export const SyncConfigAllNetworks = {
  soon: {
    testnet: {
      startBlock: 500000,
      endpoint: {
        gateWay: "https://v2.archive.subsquid.io/network/soon-testnet",
        rpc: "https://rpc.testnet.soo.network/rpc",
      },
      address: {
        ComputeBudget: { programId: "ComputeBudget111111111111111111111111111111" },
      },
    },
    mainnet: {
      startBlock: 0,
      endpoint: {
        gateWay: "https://v2.archive.subsquid.io/network/soon-mainnet",
        rpc: "https://rpc.mainnet.soo.network/rpc",
      },
      address: { ComputeBudget: { programId: "ComputeBudget111111111111111111111111111111" } },
    },
  },
  solana: {},
  eclipse: {},
};

export const SyncConfig = SyncConfigAllNetworks.soon.mainnet;
