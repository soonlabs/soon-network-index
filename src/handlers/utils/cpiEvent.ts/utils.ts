import { Instruction, Transaction } from "@subsquid/solana-objects";
import bs58 from "bs58";
import { CustomLog } from "./type";

export function convertCpiInsToLogMessage(ins: Instruction): CustomLog {
  let message = Buffer.from(bs58.decode(ins.data).slice(8)).toString("base64");

  return {
    message,
    programId: ins.programId,
    id: "cpiEvent" + ins.id,
    tx: ins.getTransaction(),
  };
}
