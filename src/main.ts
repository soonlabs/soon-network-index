import { run } from "@subsquid/batch-processor";
import { DataSourceBuilder, SolanaRpcClient } from "@subsquid/solana-stream";
import { augmentBlock, Block } from "@subsquid/solana-objects";
import { Store, TypeormDatabase } from "@subsquid/typeorm-store";
import { log } from "node:console";
import { SyncConfig } from "./config";
import { handleSynchronization } from "./handlers/synchronization/handler";
import { handleSoonNetwork } from "./handlers/soonNetwork/handler";
import * as computeBudget from "./abi/computeBudget";
import { handleComputeBudget } from "./handlers/computeBudget/handler";

// First we create a DataSource - component,
// that defines where to get the data and what data should we get.
const dataSource = new DataSourceBuilder()
  // Provide Subsquid Network Gateway URL.
  .setGateway(SyncConfig.endpoint.gateWay)
  // Subsquid Network is always about 1000 blocks behind the head.
  // We must use regular RPC endpoint to get through the last mile
  // and stay on top of the chain.
  // This is a limitation, and we promise to lift it in the future!
  .setRpc(
    // process.env.SOLANA_NODE == null
    //   ? undefined
    //   : {
    //       client: new SolanaRpcClient({
    //         url: process.env.SOLANA_NODE,
    //         // rateLimit: 100 // requests per sec
    //       }),
    //       strideConcurrency: 10,
    //     }
    {
      client: new SolanaRpcClient({
        url: SyncConfig.endpoint.rpc,
        // rateLimit: 100 // requests per sec
      }),
      strideConcurrency: 10,
    }
  )
  // Currently only blocks from 260000000 and above are stored in Subsquid Network.
  // When we specify it, we must also limit the range of requested blocks.
  //
  // Same applies to RPC endpoint of a node that cleanups its history.
  //
  // NOTE, that block ranges are specified in heights, not in slots !!!
  //
  .setBlockRange({ from: SyncConfig.startBlock })
  //
  // Block data returned by the data source has the following structure:
  //
  // interface Block {
  //     header: BlockHeader
  //     transactions: Transaction[]
  //     instructions: Instruction[]
  //     logs: LogMessage[]
  //     balances: Balance[]
  //     tokenBalances: TokenBalance[]
  //     rewards: Reward[]
  // }
  //
  // For each block item we can specify a set of fields we want to fetch via `.setFields()` method.
  // Think about it as of SQL projection.
  //
  // Accurate selection of only required fields can have a notable positive impact
  // on performance when data is sourced from Subsquid Network.
  //
  // We do it below only for illustration as all fields we've selected
  // are fetched by default.
  //
  // It is possible to override default selection by setting undesired fields to `false`.
  .setFields({
    block: {
      // block header fields
      timestamp: true,
    },
    transaction: {
      // transaction fields
      signatures: true,
      accountKeys: true,
    },
    instruction: {
      // instruction fields
      programId: true,
      accounts: true,
      data: true,
    },
    balance: {
      // account: true,
      pre: true,
      post: true,
    },
    tokenBalance: {
      // token balance record fields
      preAmount: true,
      postAmount: true,
      preOwner: true,
      postOwner: true,
    },
  })
  .includeAllBlocks({ from: SyncConfig.startBlock }) // By default, block can be skipped if it doesn't contain explicitly requested items.
  //
  // We request items via `.addXxx()` methods.
  //
  // Each `.addXxx()` method accepts item selection criteria
  // and also allows to request related items.
  //
  .addInstruction({
    // select instructions, that:
    where: {
      programId: [SyncConfig.address.ComputeBudget.programId],
      d1: [
        computeBudget.instructions.setComputeUnitLimit.d1,
        computeBudget.instructions.setComputeUnitPrice.d1,
      ],
      isCommitted: true, // where successfully committed
    },
    // for each instruction selected above
    // make sure to also include:
    include: {
      innerInstructions: true, // inner instructions
      transaction: true, // transaction, that executed the given instruction
      transactionTokenBalances: true, // all token balance records of executed transaction
    },
  })
  .build();

// Once we've prepared a data source we can start fetching the data right away:
//
// for await (let batch of dataSource.getBlockStream()) {
//     for (let block of batch) {
//         console.log(block)
//     }
// }
//
// However, Subsquid SDK can also help to decode and persist the data.
//

// Data processing in Subsquid SDK is defined by four components:
//
//  1. Data source (such as we've created above)
//  2. Database
//  3. Data handler
//  4. Processor
//
// Database is responsible for persisting the work progress (last processed block)
// and for providing storage API to the data handler.
//
// Data handler is a user defined function which accepts consecutive block batches,
// storage API and is responsible for entire data transformation.
//
// Processor connects and executes above three components.
//

// Below we create a `TypeormDatabase`.
//
// It provides restricted subset of [TypeORM EntityManager API](https://typeorm.io/working-with-entity-manager)
// as a persistent storage interface and works with any Postgres-compatible database.
//
// Note, that we don't pass any database connection parameters.
// That's because `TypeormDatabase` expects a certain project structure
// and environment variables to pick everything it needs by convention.
// Companion `@subsquid/typeorm-migration` tool works in the same way.
//
// For full configuration details please consult
// https://github.com/subsquid/squid-sdk/blob/278195bd5a5ed0a9e24bfb99ee7bbb86ff94ccb3/typeorm/typeorm-config/src/config.ts#L21
const database = new TypeormDatabase();

const handlers: ((blocks: Block[], store: Store) => Promise<void>)[] = [
  handleSoonNetwork,
  // compute budger handler should be place after soonNetwork handler,
  // wait for soonNetwork handler to create txs
  handleComputeBudget,
];
run(dataSource, database, async (ctx) => {
  const blocks = ctx.blocks.map(augmentBlock);
  for (const handler of handlers) {
    await handler(blocks, ctx.store);
  }
  await handleSynchronization(blocks, ctx.store);
});
