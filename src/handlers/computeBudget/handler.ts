import { bigdecimalTransformer, Store } from "@subsquid/typeorm-store";
import assert from "assert";
import * as tokenProgram from "../../abi/token-program";
import {
  DailyPriorityFeeStat,
  DailyTransactionStat,
  DailyUniqueAddressStat,
  SoonNetworkProgram,
  SoonNetworkStatus,
  SoonNetworkTx,
  SoonNetworkUserAddress,
} from "../../model/soonNetwork.model";
import { Block, Instruction, Transaction } from "@subsquid/solana-objects";
import { log } from "node:console";
import { SyncConfig } from "../../config";
import { Base58Bytes } from "@subsquid/borsh/lib/type-util";
import * as computeBudget from "../../abi/computeBudget";

export async function handleComputeBudget(blocks: Block[], store: Store): Promise<void> {
  for (let block of blocks) {
    for (let ins of block.instructions) {
      // filter out the instructions with errors
      if (ins.getTransaction().err) {
        continue;
      }
      await handleIns(ins, store);
    }
  }
}

async function handleIns(ins: Instruction, store: Store): Promise<void> {
  const txDate = new Date(ins.block.timestamp * 1000).toISOString().split('T')[0];

  if (ins.programId === SyncConfig.address.ComputeBudget.programId) {
    let savedTx = await store.get(SoonNetworkTx, {
      where: {
        id: ins.getTransaction().signatures[0],
      },
    });

    if (!savedTx) {
      throw new Error("Tx not found");
    }

    let priorityFee = BigInt(0); // microLamports
    if (ins.d1 === computeBudget.instructions.setComputeUnitLimit.d1) {
      let decodedIns = computeBudget.instructions.setComputeUnitLimit.decode(ins);
      savedTx.computeUnit = BigInt(decodedIns.data.units);
    } else if (ins.d1 === computeBudget.instructions.setComputeUnitPrice.d1) {
      let decodedIns = computeBudget.instructions.setComputeUnitPrice.decode(ins);
      savedTx.prioritizationGasPrice = BigInt(decodedIns.data.microLamports);
    }

    if (savedTx.prioritizationGasPrice != BigInt(0)) {
      savedTx.fee =
        BigInt(ins.getTransaction().signatures.length) * BigInt(250) +
        (savedTx.prioritizationGasPrice * savedTx.computeUnit +
          BigInt(10) ** BigInt(6) -
          BigInt(1)) /
          BigInt(10) ** BigInt(6);
      
      priorityFee = savedTx.prioritizationGasPrice;
    }

    // record tx
    await store.upsert(savedTx);

    /////////////////////////////////////////////////////////////////////////////////
    // update gas price
    let dailyPriorityFee = await store.get(DailyPriorityFeeStat, { where: { date: txDate } });
    if (!dailyPriorityFee) {
      dailyPriorityFee = new DailyPriorityFeeStat();
      dailyPriorityFee.id = txDate;
      dailyPriorityFee.date = txDate;
      dailyPriorityFee.transactionCount = 0;
      dailyPriorityFee.averagePriorityFee = BigInt(0);
      dailyPriorityFee.maxPriorityFee = BigInt(0);
      dailyPriorityFee.minPriorityFee = BigInt(0);
      dailyPriorityFee.totalPriorityFee = BigInt(0);
    }

    // process priority fee
    dailyPriorityFee.transactionCount +=1;

    if(priorityFee > dailyPriorityFee.maxPriorityFee){
      dailyPriorityFee.maxPriorityFee = priorityFee;
    }

    if(priorityFee < dailyPriorityFee.minPriorityFee){
      dailyPriorityFee.minPriorityFee = priorityFee;
    }

    dailyPriorityFee.totalPriorityFee += priorityFee;

    dailyPriorityFee.averagePriorityFee = dailyPriorityFee.totalPriorityFee / BigInt(dailyPriorityFee.transactionCount);
    
    await store.upsert(dailyPriorityFee);
  }

  /////////////////////////////////////////////////////////////////////////////////
  // update daily transaction
  let dailyTx = await store.get(DailyTransactionStat, { where: { date: txDate } });
  if (!dailyTx) {
    dailyTx = new DailyTransactionStat();
    dailyTx.id = txDate;
    dailyTx.date = txDate;
    dailyTx.transactionCount = 0;
  }
  dailyTx.transactionCount += 1;
  await store.upsert(dailyTx);

  /////////////////////////////////////////////////////////////////////////////////
  // update unique address
  const sender = (ins.getTransaction() as any).accountKeys[0];
  let dailyUniqueAddr = await store.get(DailyUniqueAddressStat, { where: { date: txDate } });
  
  if (!dailyUniqueAddr) {
    // clear previous addresses array
    const yesterday = new Date(ins.block.timestamp * 1000 - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let yesterdayStats = await store.get(DailyUniqueAddressStat, { where: { date: yesterday } });
    if(yesterdayStats && yesterdayStats.addresses?.length > 0){
      yesterdayStats.addresses = []; 
      await store.upsert(yesterdayStats);
    }

    // create today's entity
    dailyUniqueAddr = new DailyUniqueAddressStat();
    dailyUniqueAddr.id = txDate;
    dailyUniqueAddr.date = txDate;
    dailyUniqueAddr.uniqueAddressCount = 0;
    dailyUniqueAddr.addresses = [];
  }
  
  if (!dailyUniqueAddr.addresses.includes(sender)) {
    dailyUniqueAddr.addresses.push(sender);
    dailyUniqueAddr.uniqueAddressCount += 1;
  }

  await store.upsert(dailyUniqueAddr);
}
