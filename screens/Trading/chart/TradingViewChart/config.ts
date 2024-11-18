import { formatFileUrl } from "../../../../utils/format";

export const IS_MAINNET = process.env.NEXT_PUBLIC_NETWORK === "mainnet";

export const CHAINS: Chain[] = ["near", "solana"];
export const CHAIN_NAMES: Record<Chain, string> = {
  near: "Near",
  solana: "Solana",
  ethereum: "Ethereum",
};

export const TOKENS: Record<string, Token.TokenMeta> = {
  NEAR: {
    symbol: "NEAR",
    decimals: 24,
    SolanaDecimals: 9,
    amountDecimals: 2,
    priceDecimals: 2,
    icon: formatFileUrl("/crypto/near.svg"),
    addresses: {
      near: { mainnet: "wrap.near", testnet: "wrap.testnet" },
      ethereum: {
        mainnet: "0x85F17Cf997934a597031b2E18a9aB6ebD4B9f6a4",
        testnet: "0xe6b7C088Da1c2BfCf84aaE03fd6DE3C4f28629dA",
      },
      solana: {
        mainnet: "BYPsjxa3YuZESQz1dKuBw1QSFCSpecsm8nCQhY5xbU1Z",
      },
    },
  },
  Near: {
    symbol: "Near",
    decimals: 24,
    SolanaDecimals: 6,
    amountDecimals: 2,
    priceDecimals: 2,
    icon: formatFileUrl("/crypto/near.svg"),
    addresses: {
      near: { mainnet: "", testnet: "deltanear.testnet" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  WETH: {
    symbol: "WETH",
    decimals: 18,
    SolanaDecimals: 8,
    amountDecimals: 5,
    priceDecimals: 2,
    icon: formatFileUrl("/crypto/weth.png"),
    addresses: {
      near: {
        mainnet: "aurora",
        testnet: "deltaeth.testnet",
      },
      ethereum: { mainnet: "", testnet: "" },
      solana: {
        mainnet: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
        testnet: "GgE6LjokCiAXXVn2rMTwuc7ko76GJ28X8gtgtrNj9mTh",
      },
    },
  },
  ETH: {
    symbol: "ETH",
    decimals: 18,
    SolanaDecimals: 8,
    amountDecimals: 5,
    priceDecimals: 2,
    icon: formatFileUrl("/crypto/eth.svg"),
    addresses: {
      near: {
        mainnet: "aurora",
        testnet: "deltaeth.testnet",
      },
      ethereum: { mainnet: "", testnet: "" },
      solana: {
        mainnet: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
        testnet: "GgE6LjokCiAXXVn2rMTwuc7ko76GJ28X8gtgtrNj9mTh",
      },
    },
  },
  "USDT.e": {
    symbol: "USDT.e",
    decimals: 6,
    amountDecimals: 2,
    priceDecimals: 2,
    icon: formatFileUrl("/crypto/usdt.e.svg"),
    addresses: {
      near: {
        mainnet: "dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near",
        testnet: "usdt.fakes.testnet",
      },
      ethereum: { mainnet: "0xdAC17F958D2ee523a2206206994597C13D831ec7", testnet: "" },
    },
  },
  USDt: {
    symbol: "USDt",
    decimals: 6,
    SolanaDecimals: 6,
    amountDecimals: 2,
    priceDecimals: 2,
    icon: formatFileUrl("/crypto/usdt.svg"),
    addresses: {
      near: { mainnet: "usdt.tether-token.near", testnet: "usdtt.fakes.testnet" },
      ethereum: { mainnet: "", testnet: "" },
      solana: { mainnet: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", testnet: "" },
    },
  },
  "USDC.e": {
    symbol: "USDC.e",
    decimals: 6,
    amountDecimals: 2,
    priceDecimals: 4,
    icon: formatFileUrl("/crypto/usdc.e.svg"),
    addresses: {
      near: {
        mainnet: "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near",
        testnet: "deltausdc.testnet",
      },
      ethereum: { mainnet: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", testnet: "" },
    },
  },
  USDC: {
    symbol: "USDC",
    decimals: 6,
    amountDecimals: 2,
    priceDecimals: 4,
    icon: formatFileUrl("/crypto/usdc.svg"),
    addresses: {
      near: {
        mainnet: "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
        testnet: "deltausdc.testnet",
      },
      ethereum: { mainnet: "", testnet: "" },
      solana: {
        mainnet: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        testnet: "4daMLQAi8PhHQizRXyJPdvURJ6yYMYfBXFDT4LAMJG1L",
      },
    },
  },
  WBTC: {
    symbol: "WBTC",
    decimals: IS_MAINNET ? 8 : 18,
    SolanaDecimals: 8,
    amountDecimals: 6,
    priceDecimals: 2,
    icon: formatFileUrl("/crypto/wbtc.svg"),
    addresses: {
      near: {
        mainnet: "2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near",
        testnet: "deltabtc.testnet",
      },
      ethereum: { mainnet: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", testnet: "" },
      solana: { mainnet: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh", testnet: "" },
    },
  },
  REF: {
    symbol: "REF",
    decimals: 18,
    amountDecimals: 2,
    priceDecimals: 4,
    icon: formatFileUrl("/crypto/ref.svg"),
    addresses: {
      near: { mainnet: "token.v2.ref-finance.near", testnet: "ref.fakes.testnet" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  BRRR: {
    symbol: "BRRR",
    decimals: 18,
    amountDecimals: 2,
    priceDecimals: 6,
    icon: formatFileUrl("/crypto/BURROW.png"),
    addresses: {
      near: { mainnet: "token.burrow.near", testnet: "" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  LONK: {
    symbol: "LONK",
    decimals: 8,
    amountDecimals: 2,
    priceDecimals: 8,
    icon: formatFileUrl("/crypto/LONK.png"),
    addresses: {
      near: { mainnet: "token.lonkingnearbackto2024.near", testnet: "deltalonk.testnet" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  DGS: {
    symbol: "DGS",
    decimals: 18,
    amountDecimals: 2,
    priceDecimals: 8,
    icon: formatFileUrl("/crypto/DGS.svg"),
    addresses: {
      near: { mainnet: "dragonsoultoken.near", testnet: "dragonsoultoken.testnet" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  BLACKDRAGON: {
    symbol: "BLACKDRAGON",
    decimals: 24,
    amountDecimals: 2,
    priceDecimals: 12,
    icon: formatFileUrl("/crypto/blackdragon.jpeg"),
    addresses: {
      near: { mainnet: "blackdragon.tkn.near", testnet: "" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  SHITZU: {
    symbol: "SHITZU",
    decimals: 18,
    amountDecimals: 2,
    priceDecimals: 8,
    icon: formatFileUrl("/crypto/SHITZU.webp"),
    addresses: {
      near: { mainnet: "token.0xshitzu.near", testnet: "" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  NEKO: {
    symbol: "NEKO",
    decimals: 24,
    amountDecimals: 2,
    priceDecimals: 8,
    icon: formatFileUrl("/crypto/NEKO.svg"),
    addresses: {
      near: { mainnet: "ftv2.nekotoken.near", testnet: "" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  NEARVIDIA: {
    symbol: "NEARVIDIA",
    decimals: 8,
    amountDecimals: 2,
    priceDecimals: 12,
    icon: formatFileUrl("/crypto/NEARVIDIA.png"),
    addresses: {
      near: { mainnet: "nearnvidia.near", testnet: "" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  GEAR: {
    symbol: "GEAR",
    decimals: 18,
    amountDecimals: 4,
    priceDecimals: 4,
    icon: formatFileUrl("/crypto/GEAR.png"),
    addresses: {
      near: { mainnet: "gear.enleap.near", testnet: "" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  BEAN: {
    symbol: "BEAN",
    decimals: 18,
    amountDecimals: 2,
    priceDecimals: 12,
    icon: formatFileUrl("/crypto/BEAN.jpeg"),
    addresses: {
      near: { mainnet: "bean.tkn.near", testnet: "" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  SLUSH: {
    symbol: "SLUSH",
    decimals: 18,
    amountDecimals: 2,
    priceDecimals: 12,
    icon: formatFileUrl("/crypto/SLUSH.jpeg"),
    addresses: {
      near: { mainnet: "slush.tkn.near", testnet: "" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  marmaj: {
    symbol: "marmaj",
    decimals: 18,
    amountDecimals: 4,
    priceDecimals: 6,
    icon: formatFileUrl("/crypto/marmaj.png"),
    addresses: {
      near: { mainnet: "marmaj.tkn.near", testnet: "" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  FAST: {
    symbol: "FAST",
    decimals: 24,
    amountDecimals: 2,
    priceDecimals: 4,
    icon: formatFileUrl("/crypto/FAST.png"),
    addresses: {
      near: { mainnet: "edge-fast.near", testnet: "" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  HAT: {
    symbol: "HAT",
    decimals: 18,
    amountDecimals: 2,
    priceDecimals: 8,
    icon: formatFileUrl("/crypto/HAT.jpeg"),
    addresses: {
      near: { mainnet: "hat.tkn.near", testnet: "" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  LNR: {
    symbol: "LNR",
    decimals: 18,
    amountDecimals: 2,
    priceDecimals: 4,
    icon: formatFileUrl("/crypto/LNR.png"),
    addresses: {
      near: {
        mainnet: "802d89b6e511b335f05024a65161bce7efc3f311.factory.bridge.near",
        testnet: "",
      },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  CHILL: {
    symbol: "CHILL",
    decimals: 18,
    amountDecimals: 2,
    priceDecimals: 6,
    icon: formatFileUrl("/crypto/CHILL.png"),
    addresses: {
      near: { mainnet: "chill-129.meme-cooking.near", testnet: "" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  mpDAO: {
    symbol: "mpDAO",
    decimals: 6,
    amountDecimals: 2,
    priceDecimals: 4,
    icon: formatFileUrl("/crypto/mpDAO.svg"),
    addresses: {
      near: { mainnet: "mpdao-token.near", testnet: "" },
      ethereum: { mainnet: "", testnet: "" },
    },
  },
  SOL: {
    symbol: "SOL",
    decimals: 9,
    SolanaDecimals: 9,
    amountDecimals: 4,
    priceDecimals: 2,
    icon: formatFileUrl("/crypto/SOL.svg"),
    addresses: {
      near: { mainnet: "22.contract.portalbridge.near" },
      solana: {
        mainnet: "So11111111111111111111111111111111111111112",
        testnet: "So11111111111111111111111111111111111111112",
      },
    },
  },
  JUP: {
    symbol: "JUP",
    decimals: 6,
    SolanaDecimals: 6,
    amountDecimals: 2,
    priceDecimals: 4,
    icon: formatFileUrl("/crypto/jup.png"),
    addresses: {
      solana: { mainnet: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
    },
  },
  RAY: {
    symbol: "RAY",
    decimals: 6,
    SolanaDecimals: 6,
    amountDecimals: 2,
    priceDecimals: 4,
    icon: formatFileUrl("/crypto/ray.png"),
    addresses: {
      solana: { mainnet: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R" },
    },
  },
  Bonk: {
    symbol: "Bonk",
    decimals: 5,
    SolanaDecimals: 5,
    amountDecimals: 2,
    priceDecimals: 8,
    icon: formatFileUrl("/crypto/bonk.jpg"),
    addresses: {
      solana: { mainnet: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
    },
  },
  Moutai: {
    symbol: "Moutai",
    decimals: 6,
    SolanaDecimals: 6,
    amountDecimals: 2,
    priceDecimals: 6,
    icon: formatFileUrl("/crypto/moutai.jpg"),
    addresses: {
      solana: { mainnet: "45EgCwcPXYagBC7KqBin4nCFgEZWN7f3Y6nACwxqMCWX" },
    },
  },
  $WIF: {
    symbol: "$WIF",
    decimals: 6,
    SolanaDecimals: 6,
    amountDecimals: 2,
    priceDecimals: 4,
    icon: formatFileUrl("/crypto/$wif.jpg"),
    addresses: {
      solana: { mainnet: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
    },
  },
  mSOL: {
    symbol: "mSOL",
    decimals: 9,
    SolanaDecimals: 9,
    amountDecimals: 4,
    priceDecimals: 2,
    icon: formatFileUrl("/crypto/msol.png"),
    addresses: {
      solana: { mainnet: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So" },
    },
  },
  ORCA: {
    symbol: "ORCA",
    decimals: 6,
    SolanaDecimals: 6,
    amountDecimals: 2,
    priceDecimals: 4,
    icon: formatFileUrl("/crypto/orca.png"),
    addresses: {
      solana: { mainnet: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE" },
    },
  },
  KMNO: {
    symbol: "KMNO",
    decimals: 6,
    SolanaDecimals: 6,
    amountDecimals: 2,
    priceDecimals: 6,
    icon: formatFileUrl("/crypto/kmno.svg"),
    addresses: {
      solana: { mainnet: "KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS" },
    },
  },
  CIGGS: {
    symbol: "CIGGS",
    decimals: 9,
    SolanaDecimals: 9,
    amountDecimals: 2,
    priceDecimals: 6,
    icon: formatFileUrl("/crypto/ciggs.png"),
    addresses: {
      solana: { mainnet: "7p6RjGNZ7HLHpfTo6nh21XYw4CZgxXLQPzKXG72pNd2y" },
    },
  },
  BUTT: {
    symbol: "BUTT",
    decimals: 6,
    SolanaDecimals: 6,
    amountDecimals: 2,
    priceDecimals: 6,
    icon: formatFileUrl("/crypto/butt.jpeg"),
    addresses: {
      solana: { mainnet: "3dCCbYca3jSgRdDiMEeV5e3YKNzsZAp3ZVfzUsbb4be4" },
    },
  },
};

export const TEST_TOKENS = ["USDC.e", "ETH", "WBTC", "LONK"].filter(Boolean) as string[];

export const TEST_TOKENS_CLAIM_AMOUNT = {
  ETH: [0.001, 0.002, 0.003, 0.005, 0.008, 0.015],
  WBTC: [0.00005, 0.0001, 0.0002, 0.0003, 0.0005, 0.0008],
  USDC: [2, 5, 8, 15, 20, 30],
  LONK: [400000, 1000000, 1600000, 3000000, 4000000, 5000000],
};

export const ExternalUrls = {
  docs: "https://docs.deltatrade.ai/",
  twitter: "https://twitter.com/DeltaBotTeam",
  telegram: "https://t.me/deltabotchat",
};
