import { ConnectConfig } from "near-api-js";
import { getRpcList } from "../components/Rpc/tool";

export const LOGIC_CONTRACT_NAME = process.env.NEXT_PUBLIC_CONTRACT_NAME as string;
export const LOGIC_MEMECONTRACT_NAME = process.env.NEXT_PUBLIC_MEMECONTRACT_NAME as string;
export const DUST_THRESHOLD = 0.001;
export const hiddenAssets = [
  "meta-token.near",
  "usn",
  "a663b02cf0a4b149d2ad41910cb81e23e1c41c32.factory.bridge.near",
  "4691937a7508860f876c9c0a2a617e7d9e945d4b.factory.bridge.near",
  "v2-nearx.stader-labs.near",
];
export const hiddenAssetsMEME = [
  "wrap.near",
  "ftv2.nekotoken.near",
  "usdt.tether-token.near",
  "nbtc.toalice.near",
  "token.burrow.near",
  "abg-966.meme-cooking.near",
];
export const lpTokenPrefix = "shadow_ref_v1";
export const blackAssets = ["shadow_ref_v1-0"];
export const MARGIN_MIN_COLLATERAL_USD = 1;
export const defaultNetwork = (process.env.NEXT_PUBLIC_DEFAULT_NETWORK ||
  process.env.NODE_ENV ||
  "development") as any;

const META_TOKEN = { testnet: undefined, mainnet: "meta-token.near" };
const REF_TOKEN = { testnet: "ref.fakes.testnet", mainnet: "token.v2.ref-finance.near" };
interface IAppConfig {
  PYTH_ORACLE_ID: string;
  DCL_EXCHANGE_ID: string;
  PRICE_ORACLE_ID: string;
  MEME_PRICE_ORACLE_ID: string;
  REF_EXCHANGE_ID: string;
  indexUrl: string;
  findPathUrl: string;
  explorerUrl: string;
}
export const STABLE_POOL_IDS = [
  "4179",
  "3514",
  "3515",
  "1910",
  "3020",
  "3364",
  "3688",
  "3433",
  "3689",
];
export const DEFAULT_POSITION = "REGULAR";
export const BRRR_TOKEN = {
  testnet: "test_brrr.1638481328.burrow.testnet",
  mainnet: "token.burrow.near",
};
// for pubtestnet env todo
export const BRRR_LABS_TOKEN = {
  testnet: "brrr.ft.ref-labs.testnet",
  mainnet: "brrr.ft.ref-labs.testnet",
};
export const NBTCTokenId = {
  testnet: "nbtc-dev.testnet",
  mainnet: "nbtc.bridge.near",
}[defaultNetwork];
export const WALLET_CONNECT_ID =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || ("87e549918631f833447b56c15354e450" as string);

export const missingPriceTokens = [REF_TOKEN, META_TOKEN, BRRR_TOKEN, BRRR_LABS_TOKEN];
export const incentiveTokens: string[] = [
  // "853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near",
  // "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
  // "usdt.tether-token.near",
  // "aurora",
];
export const topTokens: string[] = [
  // "shadow_ref_v1-4179"
];

export const NBTC_ENV = "mainnet";
export const AWS_MEDIA_DOMAIN = "https://img.ref.finance";
export const ETH_OLD_CONTRACT_ID = "aurora";
export const ETH_CONTRACT_ID = "eth.bridge.near";
const getConfig = (env: string = defaultNetwork) => {
  const RPC_LIST = getRpcList();
  let endPoint = "defaultRpc";
  try {
    endPoint = window.localStorage.getItem("endPoint") || endPoint;
    if (!RPC_LIST[endPoint]) {
      endPoint = "defaultRpc";
      localStorage.removeItem("endPoint");
    }
  } catch (error) {}
  switch (env) {
    case "production":
    case "mainnet":
      return {
        networkId: "mainnet",
        nodeUrl: RPC_LIST[endPoint].url,
        walletUrl: "https://wallet.near.org",
        helperUrl: "https://helper.mainnet.near.org",
        explorerUrl: "https://explorer.mainnet.near.org",
        dataServiceUrl: "https://api.data-service.burrow.finance",
        indexUrl: "https://api.ref.finance",
        txIdApiUrl: "https://api3.nearblocks.io",
        SPECIAL_REGISTRATION_TOKEN_IDS: [
          "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
        ],
        NATIVE_TOKENS: [
          "usdt.tether-token.near",
          "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
        ],
        NEW_TOKENS: [
          // "usdt.tether-token.near",
          // "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
          // "shadow_ref_v1-4179",
          // "853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near",
          // "a663b02cf0a4b149d2ad41910cb81e23e1c41c32.factory.bridge.near",
          // "shadow_ref_v1-4179",
          // "aurora",
        ],
        PYTH_ORACLE_ID: "pyth-oracle.near",
        PRICE_ORACLE_ID: "priceoracle.near",
        MEME_PRICE_ORACLE_ID: "meme-priceoracle.ref-labs.near",
        REF_EXCHANGE_ID: "v2.ref-finance.near",
        DCL_EXCHANGE_ID: "dclv2.ref-labs.near",
        findPathUrl: "smartrouter.ref.finance",
      } as unknown as ConnectConfig & IAppConfig;

    case "development":
    case "testnet":
      return {
        networkId: "testnet",
        nodeUrl: RPC_LIST[endPoint].url,
        walletUrl: "https://wallet.testnet.near.org",
        helperUrl: "https://helper.testnet.near.org",
        explorerUrl: "https://testnet.nearblocks.io",
        dataServiceUrl: "https://dev.data-service.ref-finance.com",
        txIdApiUrl: "https://api-testnet.nearblocks.io",
        SPECIAL_REGISTRATION_TOKEN_IDS: [
          "3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af",
        ],
        NATIVE_TOKENS: ["usdc.fakes.testnet"],
        NEW_TOKENS: ["usdc.fakes.testnet", "shadow_ref_v1-0", "shadow_ref_v1-2"],
        DCL_EXCHANGE_ID: "refv2-dev.ref-dev.testnet", // dclv2.ref-dev.testnet
        PYTH_ORACLE_ID: "pyth-oracle.testnet",
        PRICE_ORACLE_ID: "priceoracle.services.ref-labs.testnet",
        MEME_PRICE_ORACLE_ID: "mock-priceoracle.testnet",
        REF_EXCHANGE_ID: "ref-finance-101.testnet",
        findPathUrl: "smartrouterdev.refburrow.top",
        // findPathUrl: "smartrouter.ref.finance",
        indexUrl: "https://testnet-indexer.ref-finance.com",
        // indexUrl: "https://api.ref.finance",
      } as unknown as ConnectConfig & IAppConfig;
    case "betanet":
      return {
        networkId: "betanet",
        nodeUrl: RPC_LIST[endPoint].url,
        walletUrl: "https://wallet.betanet.near.org",
        helperUrl: "https://helper.betanet.near.org",
        explorerUrl: "https://explorer.betanet.near.org",
        SPECIAL_REGISTRATION_TOKEN_IDS: [],
      } as unknown as ConnectConfig & IAppConfig;
    case "local":
      return {
        networkId: "local",
        nodeUrl: RPC_LIST[endPoint].url,
        keyPath: `${process.env.HOME}/.near/validator_key.json`,
        walletUrl: "http://localhost:4000/wallet",
      } as unknown as ConnectConfig & IAppConfig;
    case "test":
    case "ci":
      return {
        networkId: "shared-test",
        nodeUrl: RPC_LIST[endPoint].url,
        masterAccount: "test.near",
      } as unknown as ConnectConfig & IAppConfig;
    case "ci-betanet":
      return {
        networkId: "shared-test-staging",
        nodeUrl: RPC_LIST[endPoint].url,
        masterAccount: "test.near",
      } as unknown as ConnectConfig & IAppConfig;
    default:
      throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`);
  }
};

export const isTestnet = getConfig(defaultNetwork).networkId === "testnet";

export default getConfig;
