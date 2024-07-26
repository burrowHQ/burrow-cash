import { defaultNetwork } from "./config";

const FRACTION_DIGITS = 4;
const TestnetCoins = {
  "wrap.testnet": {
    decimals: 24,
    price_identifier: "27e867f0f4f61076456d1a73b14c7edc1cf5cef4f4d6193a33424288f11bd0f4",
  },
  aurora: {
    decimals: 18,
    fraction_digits: 2,
    price_identifier: "ca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6",
  },
  "usdt.fakes.testnet": {
    decimals: 6,
    price_identifier: "1fc18861232290221461220bd4e2acd1dcdfbc89c84092c93c18bdc7756c1588",
  },
  "usdc.fakes.testnet": {
    decimals: 6,
    price_identifier: "41f3625971ca2ed2263e78573fe5ce23e13d2558ed3f2e47ab0f84fb9e7ae722",
  },
  "dai.fakes.testnet": {
    decimals: 18,
    price_identifier: "87a67534df591d2dd5ec577ab3c75668a8e3d35e92e27bf29d9e2e52df8de412",
  },
  "wbtc.fakes.testnet": {
    decimals: 8,
    fraction_digits: 2,
    price_identifier: "ea0459ab2954676022baaceadb472c1acc97888062864aa23e9771bae3ff36ed",
  },
  "aurora.fakes.testnet": {
    decimals: 18,
    fraction_digits: 5,
    price_identifier: "eb00e1f858549e12034ff880b7592456a71b4237aaf4aeb16e63cd9b68ba4d7e",
  },
  "woo.orderly.testnet": {
    decimals: 18,
    fraction_digits: 6,
    price_identifier: "bf517e0f7ccfc307f0b2fa93b99a737641933989af6af769c928725989c21e66",
  },
};
const MainnetCoins = {
  "wrap.near": {
    decimals: 24,
    price_identifier: "c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750",
  },
  aurora: {
    decimals: 18,
    fraction_digits: 2,
  },
  "dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near": {
    decimals: 6,
  },
  "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near": {
    decimals: 6,
  },
  "6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near": {
    decimals: 18,
  },
  "2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near": {
    decimals: 8,
    fraction_digits: 2,
  },
  "aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near": {
    decimals: 18,
    fraction_digits: 5,
  },
  "4691937a7508860f876c9c0a2a617e7d9e945d4b.factory.bridge.near": {
    decimals: 18,
    fraction_digits: 6,
  },
};
const COINS_ENV = {
  testnet: TestnetCoins,
  mainnet: MainnetCoins,
  privateMainnet: MainnetCoins,
};
const NEARX_TOKEN_ENV = {
  testnet: "v2-nearx.staderlabs.testnet",
  mainnet: "v2-nearx.stader-labs.near",
  privateMainnet: "v2-nearx.stader-labs.near",
};
const LINEAR_TOKEN_ENV = {
  testnet: "linear-protocol.testnet",
  mainnet: "linear-protocol.near",
  privateMainnet: "linear-protocol.near",
};
const STNEAR_TOKEN_ENV = {
  testnet: "meta-v2.pool.testnet",
  mainnet: "meta-pool.near",
  privateMainnet: "meta-pool.near",
};
const SFRAX_TOKEN_ENV = {
  testnet: "a663b0.fakes.testnet",
  mainnet: "a663b02cf0a4b149d2ad41910cb81e23e1c41c32.factory.bridge.near",
  privateMainnet: "a663b02cf0a4b149d2ad41910cb81e23e1c41c32.factory.bridge.near",
};
const COINS = COINS_ENV[defaultNetwork];
const NEARX_TOKEN = NEARX_TOKEN_ENV[defaultNetwork];
const LINEAR_TOKEN = LINEAR_TOKEN_ENV[defaultNetwork];
const STNEAR_TOKEN = STNEAR_TOKEN_ENV[defaultNetwork];
const SFRAX_TOKEN = SFRAX_TOKEN_ENV[defaultNetwork];

export { COINS, FRACTION_DIGITS, NEARX_TOKEN, LINEAR_TOKEN, STNEAR_TOKEN, SFRAX_TOKEN };
