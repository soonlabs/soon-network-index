import { bigdecimalTransformer, Store } from "@subsquid/typeorm-store";
import assert from "assert";
import * as tokenProgram from "../../abi/token-program";
import {
  DailyPriorityGasPriceStat,
  DailyTransactionStat,
  DailyUniqueAddressStat,
  SoonNetworkProgram,
  SoonNetworkStatus,
  SoonNetworkTx,
  SoonNetworkUserAddress,
  TokenTransfer,
  TransactionFeeStat,
} from "../../model/soonNetwork.model";
import { Block, Instruction, Transaction } from "@subsquid/solana-objects";
import { log } from "node:console";
import { SyncConfig } from "../../config";
import { Base58Bytes } from "@subsquid/borsh/lib/type-util";
import * as computeBudget from "../../abi/computeBudget";
import { LessThan, MoreThan } from "typeorm";

export function getTimestampOf24hAgo(){
  return BigInt(Math.floor(((new Date).getTime() - 24 * 60 * 60 * 1000) / 1000))
}

// process each block
export async function handleBlock(block:Block, store:Store):Promise<void>{
  const timestampOf24HoursAgo = getTimestampOf24hAgo();

  // update 24 hours tx and address
  let data = await store.get(SoonNetworkStatus, {
    where: {
      id: "1",
    },
  });

  if(data){
    // update tx count & address count for 24 hours 
    data.txCount24Hours = BigInt(await store.count(SoonNetworkTx, { where: { timestamp: MoreThan(timestampOf24HoursAgo)}}))
    data.addressCount24Hours = BigInt(await store.count(SoonNetworkUserAddress, { where: { lastActiveTimestamp: MoreThan(timestampOf24HoursAgo)}})),
    await store.save(data);
  }

  ////////////////////////////////////////////////////////////////////////
  // remove transactions before 24 hours ago
  if(block.header.height % 500 !== 0){
    return;
  }
  
  // find txs
  const txsOf24HoursAgo = await store.find(SoonNetworkTx, { where: { timestamp: LessThan(timestampOf24HoursAgo)} });

  if (txsOf24HoursAgo.length > 0) {
    for (const txOf24HoursAgo of txsOf24HoursAgo) {
      // remove token transfer record
      const tokenTransferTx = await store.find(TokenTransfer, { where: { tx: txOf24HoursAgo} });
      await store.remove(tokenTransferTx);

      // remove tx record
      await store.remove(txOf24HoursAgo);
    }
  }
}

// process each instruction
export async function handleIns(ins: Instruction, store: Store): Promise<void> {
  let insFee = BigInt(0);
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

    let priorityGasPrice = BigInt(0); // microLamports
    
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
      
      insFee = savedTx.fee;
      priorityGasPrice = savedTx.prioritizationGasPrice;
    }

    // record tx
    await store.upsert(savedTx);

    /////////////////////////////////////////////////////////////////////////////////
    // update network transaction fee
    // update average gas price
    let transactionFeeStat = await store.get(TransactionFeeStat, {
      where: {
        id: "1",
      },
    });

    if(!transactionFeeStat){
      transactionFeeStat = new TransactionFeeStat();
      transactionFeeStat.id = "1";
      transactionFeeStat.networkTransactionsFee = BigInt(0);
      // transactionFeeStat.totalGasPrice = BigInt(0);
      // transactionFeeStat.totalTxCount = BigInt(0);
      // transactionFeeStat.averageGasPrice = BigInt(0);
    }

    transactionFeeStat.networkTransactionsFee += insFee;
    // transactionFeeStat.totalGasPrice += priorityGasPrice;
    // transactionFeeStat.totalTxCount += BigInt(1);

    // transactionFeeStat.averageGasPrice = transactionFeeStat.totalGasPrice / transactionFeeStat.totalTxCount;
    await store.upsert(transactionFeeStat);

    /////////////////////////////////////////////////////////////////////////////////
    // update daily gas price
    let dailyPriorityFee = await store.get(DailyPriorityGasPriceStat, { where: { date: txDate } });
    if (!dailyPriorityFee) {
      dailyPriorityFee = new DailyPriorityGasPriceStat();
      dailyPriorityFee.id = txDate;
      dailyPriorityFee.date = txDate;
      dailyPriorityFee.transactionCount = 0;
      dailyPriorityFee.averagePriorityGasPrice = BigInt(0);
      dailyPriorityFee.maxPriorityGasPrice = BigInt(0);
      dailyPriorityFee.minPriorityGasPrice = BigInt(0);
      dailyPriorityFee.totalPriorityGasPrice = BigInt(0);
    }

    // process daily gas price
    dailyPriorityFee.transactionCount +=1;
    if(priorityGasPrice > dailyPriorityFee.maxPriorityGasPrice){
      dailyPriorityFee.maxPriorityGasPrice = priorityGasPrice;
    }
    if(priorityGasPrice < dailyPriorityFee.minPriorityGasPrice){
      dailyPriorityFee.minPriorityGasPrice = priorityGasPrice;
    }

    dailyPriorityFee.totalPriorityGasPrice += priorityGasPrice;
    dailyPriorityFee.averagePriorityGasPrice = dailyPriorityFee.totalPriorityGasPrice / BigInt(dailyPriorityFee.transactionCount);
    
    await store.upsert(dailyPriorityFee);
  }
}
