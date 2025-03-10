import { Store } from "@subsquid/typeorm-store";
import assert from "assert";
import * as tokenProgram from "../../abi/token-program";
import {
  DailyTransactionStat,
  DailyUniqueAddressStat,
  SoonNetworkProgram,
  SoonNetworkStatus,
  SoonNetworkTx,
  SoonNetworkUserAddress,
  TokenTransfer,
} from "../../model/soonNetwork.model";
import { Block, Instruction, Transaction } from "@subsquid/solana-objects";
import { log } from "node:console";
import { SyncConfig } from "../../config";
import { Base58Bytes } from "@subsquid/borsh/lib/type-util";
import { handleBlock, handleIns } from "./insHandler";

export async function handleSoonNetwork(blocks: Block[], store: Store): Promise<void> {
  for (let block of blocks) {
    for (let tx of block.transactions) {
      try {
        // filter out the instructions with errors
        if (tx.err) {
          continue;
        }
      
        await handleTx(tx, store);
      } catch (error) {
        console.error(`Error processing tx, block ${tx?.block?.height ?? "unknown"}:`, error);
      }
    }

    for (let ins of block.instructions) {
      try {
        // filter out the instructions with errors
        if (ins.getTransaction().err) {
          continue;
        }
        await handleIns(ins, store);
      } catch (error) {
        console.error(`Error processing ins, block ${ins?.block?.height ?? "unknown"}:`, error);
      }
    }

    // process each block
    try {
      await handleBlock(block, store);
    } catch (error) {
      console.error(`Error processing block ${block?.header?.height ?? "unknown"}:`, error);
    }
  }
}

async function updateProgram(ins: Instruction, store: Store) {
  let data = await store.get(SoonNetworkProgram, {
    where: {
      id: ins.programId,
    },
  });
  if (!data) {
    await store.save(
      new SoonNetworkProgram({
        id: ins.programId,
        lastActiveTimestamp: BigInt(ins.block.timestamp),
      })
    );
  }
  for (let inner of ins.inner) {
    await updateProgram(inner, store);
  }
}

async function updateUserAddr(tx: Transaction & { accountKeys: Base58Bytes[] }, store: Store) {
  let data = await store.get(SoonNetworkUserAddress, {
    where: {
      id: tx.accountKeys[0],
    },
  });
  if (!data) {
    await store.save(
      new SoonNetworkUserAddress({
        id: tx.accountKeys[0],
        lastActiveTimestamp: BigInt(tx.block.timestamp),
      })
    );
  }
}

async function handleTx(tx: Transaction, store: Store): Promise<void> {
  // add txCount
  let data = await store.get(SoonNetworkStatus, {
    where: {
      id: "1",
    },
  });

  // record all programs
  for (let instruction of tx.instructions) {
    await updateProgram(instruction, store);
  }
  await updateUserAddr(tx as any, store);
  const txToSave = new SoonNetworkTx({
    id: tx.signatures[0],
    sender: (tx as any).accountKeys[0],
    computeUnit: BigInt(200000),
    prioritizationGasPrice: BigInt(0),
    fee: BigInt(tx.signatures.length) * BigInt(250),
    txHash: tx.signatures[0],
    timestamp: BigInt(tx.block.timestamp),
    blockNumber: tx.block.height,
  });

  // record tx
  await store.save(txToSave);

  if (!data) {
    await store.save(
      new SoonNetworkStatus({
        id: "1",
        txCount: BigInt(1),
        txCount24Hours: BigInt(0),
        addressCount: BigInt(await store.count(SoonNetworkUserAddress)),
        addressCount24Hours: BigInt(0),
        programCount: BigInt(await store.count(SoonNetworkProgram)),
      })
    );
  } else {
    data.txCount += BigInt(1);
    data.addressCount = BigInt(await store.count(SoonNetworkUserAddress));
    data.programCount = BigInt(await store.count(SoonNetworkProgram));
    await store.save(data);
  }

  // record token transfer events
  {
    let count = 1;
    // handle native token account
    {
      for (const balance of tx.balances) {
        await store.save(
          new TokenTransfer({
            id: `token-transfer#${tx.signatures[0]}#${count}`,
            tx: txToSave,
            preOwner: balance.account,
            postOwner: balance.account,
            preAmount: balance.pre,
            postAmount: balance.post,
            mint: "0x0000000000000000000000000000000000000000",
          })
        );
        count++;
      }
    }

    // handle token account
    {
      for (const tokenBalance of tx.tokenBalances) {
        await store.save(
          new TokenTransfer({
            id: `token-transfer#${tx.signatures[0]}#${count}`,
            tx: txToSave,
            preOwner: tokenBalance.preOwner,
            postOwner: tokenBalance.postOwner,
            preAmount: tokenBalance.preAmount,
            postAmount: tokenBalance.postAmount,
            mint: tokenBalance.preMint || tokenBalance.postMint,
          })
        );
        count++;
      }
    }
  }
}
