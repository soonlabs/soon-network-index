export const SyncConfigAllNetworks = {
  soon: {
    testnet: {
      startBlock: 420000,
      endpoint: {
        gateWay: "https://v2.archive.subsquid.io/network/soon-testnet",
        rpc: "https://rpc.testnet.soo.network/rpc",
      },
      address: {},
    },
    mainnet: {
      startBlock: 0,
      endpoint: {
        gateWay: "https://v2.archive.subsquid.io/network/soon-mainnet",
        rpc: "https://rpc.mainnet.soo.network/rpc",
      },
      address: {},
    },
  },
  solana: {},
  eclipse: {},
};

export const SyncConfig = SyncConfigAllNetworks.soon.testnet;
