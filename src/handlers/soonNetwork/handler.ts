import { Store } from "@subsquid/typeorm-store";
import assert from "assert";
import * as tokenProgram from "../../abi/token-program";
import {
  SoonNetworkProgram,
  SoonNetworkStatus,
  SoonNetworkTx,
  SoonNetworkUserAddress,
} from "../../model/soonNetwork.model";
import { Block, Instruction, Transaction } from "@subsquid/solana-objects";
import { log } from "node:console";
import { SyncConfig } from "../../config";
import { Base58Bytes } from "@subsquid/borsh/lib/type-util";

export async function handleSoonNetwork(blocks: Block[], store: Store): Promise<void> {
  for (let block of blocks) {
    for (let tx of block.transactions) {
      // filter out the instructions with errors
      if (tx.err) {
        continue;
      }
      await handleTx(tx, store);
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

  // record tx
  await store.save(
    new SoonNetworkTx({
      id: tx.signatures[0],
      sender: (tx as any).accountKeys[0],
      txHash: tx.signatures[0],
      timestamp: BigInt(tx.block.timestamp),
      blockNumber: tx.block.height,
    })
  );

  if (!data) {
    await store.save(
      new SoonNetworkStatus({
        id: "1",
        txCount: BigInt(1),
        addressCount: BigInt(await store.count(SoonNetworkUserAddress)),
        programCount: BigInt(await store.count(SoonNetworkProgram)),
      })
    );
  } else {
    data.txCount += BigInt(1);
    data.addressCount = BigInt(await store.count(SoonNetworkUserAddress));
    data.programCount = BigInt(await store.count(SoonNetworkProgram));
    await store.save(data);
  }
}
