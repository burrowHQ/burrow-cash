export function getExtendConfig(
  env: string = process.env.NEXT_PUBLIC_DEFAULT_NETWORK || process.env.NODE_ENV || "development",
) {
  switch (env) {
    case "development":
    case "testnet":
      return {
        RPC_LIST: {
          defaultRpc: {
            url: "https://g.w.lavanet.xyz/gateway/neart/rpc-http/a6e88c7710da77f09430aacd6328efd6",
            simpleName: "lava rpc",
          },
          officialRpc: {
            url: "https://rpc.testnet.near.org",
            simpleName: "official rpc",
          },
          // pagodaRpc: {
          //   url: "https://rpc.testnet.pagoda.co",
          //   simpleName: "pagoda rpc",
          // },
        },
      };
    default:
      return {
        RPC_LIST: {
          defaultRpc: {
            url: "https://rpc.mainnet.fastnear.com?apiKey=d17d0e02e6ed9582b1c9d100bda7038e2dac7945099804fadafc430884f6b54a",
            simpleName: "fastnear rpc",
          },
          lavaRpc: {
            url: "https://near.lava.build",
            simpleName: "lava rpc",
          },
          officialRpc: {
            url: "https://rpc.mainnet.near.org",
            simpleName: "official rpc",
          },
          betaRpc: {
            url: "https://beta.rpc.mainnet.near.org",
            simpleName: "official beta rpc",
          },
        },
      };
  }
}
