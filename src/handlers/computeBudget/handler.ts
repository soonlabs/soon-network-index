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
  if (ins.programId === SyncConfig.address.ComputeBudget.programId) {
    let savedTx = await store.get(SoonNetworkTx, {
      where: {
        id: ins.getTransaction().signatures[0],
      },
    });

    if (!savedTx) {
      throw new Error("Tx not found");
    }
    if (ins.d1 === computeBudget.instructions.setComputeUnitLimit.d1) {
      let decodedIns = computeBudget.instructions.setComputeUnitLimit.decode(ins);
      savedTx.computeUnit = BigInt(decodedIns.data.units);
    } else if (ins.d1 === computeBudget.instructions.setComputeUnitPrice.d1) {
      let decodedIns = computeBudget.instructions.setComputeUnitPrice.decode(ins);
      savedTx.prioritizationGasPrice = BigInt(decodedIns.data.microLamports);
    }

    if (savedTx.prioritizationGasPrice != BigInt(0)) {
      savedTx.fee =
        BigInt(ins.getTransaction().signatures.length) * BigInt(5000) +
        savedTx.prioritizationGasPrice * savedTx.computeUnit;
    }

    // record tx
    await store.upsert(savedTx);
  }
}
