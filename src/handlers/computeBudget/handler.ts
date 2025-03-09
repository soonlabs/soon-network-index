// import { bigdecimalTransformer, Store } from "@subsquid/typeorm-store";
// import assert from "assert";
// import * as tokenProgram from "../../abi/token-program";
// import {
//   DailyPriorityGasPriceStat,
//   DailyTransactionStat,
//   DailyUniqueAddressStat,
//   SoonNetworkProgram,
//   SoonNetworkStatus,
//   SoonNetworkTx,
//   SoonNetworkUserAddress,
//   TransactionFeeStat,
// } from "../../model/soonNetwork.model";
// import { Block, Instruction, Transaction } from "@subsquid/solana-objects";
// import { log } from "node:console";
// import { SyncConfig } from "../../config";
// import { Base58Bytes } from "@subsquid/borsh/lib/type-util";
// import * as computeBudget from "../../abi/computeBudget";

// export async function handleComputeBudget(blocks: Block[], store: Store): Promise<void> {
//   for (let block of blocks) {
//     for (let ins of block.instructions) {
//       // filter out the instructions with errors
//       if (ins.getTransaction().err) {
//         continue;
//       }
//       await handleIns(ins, store);
//     }
//   }
// }

// async function handleIns(ins: Instruction, store: Store): Promise<void> {
//   const txDate = new Date(ins.block.timestamp * 1000).toISOString().split('T')[0];

//   if (ins.programId === SyncConfig.address.ComputeBudget.programId) {
//     let savedTx = await store.get(SoonNetworkTx, {
//       where: {
//         id: ins.getTransaction().signatures[0],
//       },
//     });

//     if (!savedTx) {
//       throw new Error("Tx not found");
//     }

//     let priorityGasPrice = BigInt(0); // microLamports
//     let txFee = BigInt(0);
//     if (ins.d1 === computeBudget.instructions.setComputeUnitLimit.d1) {
//       let decodedIns = computeBudget.instructions.setComputeUnitLimit.decode(ins);
//       savedTx.computeUnit = BigInt(decodedIns.data.units);
//     } else if (ins.d1 === computeBudget.instructions.setComputeUnitPrice.d1) {
//       let decodedIns = computeBudget.instructions.setComputeUnitPrice.decode(ins);
//       savedTx.prioritizationGasPrice = BigInt(decodedIns.data.microLamports);
//     }

//     if (savedTx.prioritizationGasPrice != BigInt(0)) {
//       savedTx.fee =
//         BigInt(ins.getTransaction().signatures.length) * BigInt(250) +
//         (savedTx.prioritizationGasPrice * savedTx.computeUnit +
//           BigInt(10) ** BigInt(6) -
//           BigInt(1)) /
//           BigInt(10) ** BigInt(6);
      
//       txFee = savedTx.fee;
//       priorityGasPrice = savedTx.prioritizationGasPrice;
//     }

//     // record tx
//     await store.upsert(savedTx);

//     /////////////////////////////////////////////////////////////////////////////////
//     // update network transaction fee
//     // update average gas price
//     let transactionFeeStat = await store.get(TransactionFeeStat, {
//       where: {
//         id: "1",
//       },
//     });

//     if(!transactionFeeStat){
//       transactionFeeStat = new TransactionFeeStat();
//       transactionFeeStat.id = "1";
//       transactionFeeStat.networkTransactionsFee = BigInt(0);
//       transactionFeeStat.totalGasPrice = BigInt(0);
//       transactionFeeStat.totalTxCount = BigInt(0);
//       transactionFeeStat.averageGasPrice = BigInt(0);
//     }

//     transactionFeeStat.networkTransactionsFee += txFee;
//     transactionFeeStat.totalGasPrice += priorityGasPrice;
//     transactionFeeStat.totalTxCount += BigInt(1);

//     transactionFeeStat.averageGasPrice = transactionFeeStat.totalGasPrice / transactionFeeStat.totalTxCount;
//     await store.upsert(transactionFeeStat);

//     /////////////////////////////////////////////////////////////////////////////////
//     // update daily gas price
//     let dailyPriorityFee = await store.get(DailyPriorityGasPriceStat, { where: { date: txDate } });
//     if (!dailyPriorityFee) {
//       dailyPriorityFee = new DailyPriorityGasPriceStat();
//       dailyPriorityFee.id = txDate;
//       dailyPriorityFee.date = txDate;
//       dailyPriorityFee.transactionCount = 0;
//       dailyPriorityFee.averagePriorityGasPrice = BigInt(0);
//       dailyPriorityFee.maxPriorityGasPrice = BigInt(0);
//       dailyPriorityFee.minPriorityGasPrice = BigInt(0);
//       dailyPriorityFee.totalPriorityGasPrice = BigInt(0);
//     }

//     // process priority fee
//     dailyPriorityFee.transactionCount +=1;

//     if(priorityGasPrice > dailyPriorityFee.maxPriorityGasPrice){
//       dailyPriorityFee.maxPriorityGasPrice = priorityGasPrice;
//     }

//     if(priorityGasPrice < dailyPriorityFee.minPriorityGasPrice){
//       dailyPriorityFee.minPriorityGasPrice = priorityGasPrice;
//     }

//     dailyPriorityFee.totalPriorityGasPrice += priorityGasPrice;

//     dailyPriorityFee.averagePriorityGasPrice = dailyPriorityFee.totalPriorityGasPrice / BigInt(dailyPriorityFee.transactionCount);
    
//     await store.upsert(dailyPriorityFee);
//   }
// }
