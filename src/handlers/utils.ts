import { Block, Instruction, Transaction } from "@subsquid/solana-objects";
import * as tokenProgram from "../abi/token-program";
import assert from "assert";
import { Base58Bytes } from "@subsquid/borsh/lib/type-util";

export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const TOKEN2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export enum TransferType {
  Normal,
  Checked,
}

// sometimes the transfer instruction is in the inner instructions at uncertain index, so we need to find it by iterating through the inner instructions
export function findTransferFromInnerInstructions(
  ins: Instruction
): { type: TransferType; ix: Instruction } | null {
  for (let i = 0; i < ins.inner.length; i++) {
    let innerIns = ins.inner[i];
    if (innerIns.programId === TOKEN_PROGRAM_ID) {
      if (
        innerIns.d1.toLowerCase() === tokenProgram.instructions.transferChecked.d1.toLowerCase()
      ) {
        return {
          type: TransferType.Checked,
          ix: innerIns,
        };
      } else if (
        innerIns.d1.toLowerCase() === tokenProgram.instructions.transfer.d1.toLowerCase()
      ) {
        return {
          type: TransferType.Normal,
          ix: innerIns,
        };
      }
    }
  }
  return null;
}

// find token info from a transaction, like mint and owner, etc.
export function findTokenInfo(
  tx: Transaction,
  tokenAccount: Base58Bytes
): { mint: Base58Bytes; owner: Base58Bytes } {
  // find token balance
  let tokenBalance = tx.tokenBalances.find((tb) => tb.account === tokenAccount);
  assert(tokenBalance, "Token balance not found");

  // get mint
  let mint = tokenBalance?.preMint || tokenBalance?.postMint;
  assert(mint, "mint not found");

  // get owner
  if (
    tokenBalance.preOwner &&
    tokenBalance.postOwner &&
    tokenBalance.preOwner != tokenBalance.postOwner
  ) {
    throw new Error("Token owner changed");
  }
  let owner = tokenBalance.preOwner || tokenBalance.postOwner;
  assert(owner, "owner not found");

  return {
    mint,
    owner,
  };
}

export function getTxHash(tx: Transaction): string {
  return tx.signatures[0];
}
