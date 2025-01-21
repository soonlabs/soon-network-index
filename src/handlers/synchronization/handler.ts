import { Store } from "@subsquid/typeorm-store";
import assert from "assert";
import * as tokenProgram from "../../abi/token-program";
import { Block, Instruction } from "@subsquid/solana-objects";
import { log } from "node:console";
import { SyncConfig } from "../../config";
import { SyncrhonizationStatus } from "../../model";

export async function handleSynchronization(blocks: Block[], store: Store): Promise<void> {
  store.upsert([
    new SyncrhonizationStatus({
      id: "0",
      slot: BigInt(blocks[blocks.length - 1].header.slot),
      timestamp: new Date(blocks[blocks.length - 1].header.timestamp * 1000),
      blockNumber: BigInt(blocks[blocks.length - 1].header.height),
    }),
  ]);
}
