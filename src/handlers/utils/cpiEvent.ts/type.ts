import { Transaction } from "@subsquid/solana-objects";

export interface CustomLog {
  message: string;
  programId: string;
  id: string;
  tx: Transaction;
}
