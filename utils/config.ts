import { ConnectConfig } from "near-api-js";
import { getRpcList } from "../components/Rpc/tool";

export const LOGIC_CONTRACT_NAME = process.env.NEXT_PUBLIC_CONTRACT_NAME as string;
export const LOGIC_MEMECONTRACT_NAME = process.env.NEXT_PUBLIC_MEMECONTRACT_NAME as string;
export const DUST_THRESHOLD = 0.001;

export const hiddenAssets = ["meta-token.near", "usn"];
export const lpTokenPrefix = "shadow_ref_v1";
export const blackAssets = ["shadow_ref_v1-0"];
export const MARGIN_MIN_COLLATERAL_USD = 0.1;

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
export const incentiveTokens = [
  "853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near",
  "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
  "usdt.tether-token.near",
  // "aurora",
];
export const topTokens = ["shadow_ref_v1-4179"];

export const NBTC_ENV = "mainnet";
export const MARGIN_WHITELIST = [
  "lini.near",
  "juaner.near",
  "skyto.near",
  "wheelsbyte.near",
  "hexie.near",
  "earnestetim.near",
  "maiye.near",
  "successismine.near",
  "ai_buys.near",
  "glacial_enigma.slimetest.near",
  "curmello.near",
  "gustavo_paulo.near",
  "youmammon.tg",
  "maxbuyanov.near",
  "abdussomad.near",
  "purre.near",
  "349a9a49cba46e9d6bd1fa7bedbbdf93d35502d8c0a49acb6434544066c17736",
  "daysofshiba.tg",
  "vvr.near",
  "coolnabil.near",
  "poppingbean.tg",
  "racheludoka.near",
  "0030lonerxoul.near",
  "Luffy786.near",
  "rhymetaylor.near",
  "realade21.near",
  "q8i.near",
  "1737949770.tg",
  "dchris.near",
  "blessudoka5.tg",
  "Arthurkings.near",
  "tbam.near",
  "naivang1983.near",
  "nftgokhanerbatu.near",
  "csp88.near",
  "zcamm7417.near",
  "quangle613.tg",
  "kenny22.near",
  "henryisai.near",
  "jackindeeper.near",
  "enleap.near",
  "ibohigboze.near",
  "donorsfoundation.near",
  "leon_mitte.near",
  "0xg1enn.near",
  "bobbypack.near",
  "itsmarcus.near",
  "fc948c6698f446df71b438821b6b7d69df5ce8150c4ada62ebd84abcc771f468",
  "zerobot.near",
  "enleap.near",
  "yapeo.near",
  "jsalas.near",
  "quest1k.tg",
  "betonchel.tg",
  "solipsun.tg",
  "phamtomx2y.tg",
  "Itaookon.near",
  "ibz82.near",
  "sxlxm_x.tg",
  "krikkraktrak.near",
  "burner_full.near",
  "gusthecruel.near",
  "endshuvo.near",
  "qiv5da_dragon.dragon_bot.near",
  "Humblegiwa",
  "Pumpkineater69.near",
  "Dominicayo.near",
  "i1254643630.tg",
  "gayus.near",
  "koolipoiss.near",
  "mpc02.near",
  "Lamz0.near",
  "Shubham32325.near",
  "quietice.near",
  "11fivecryptocurrency.near",
  "7d5b85e59a75a462213a3f064096a7be5f2e2c8beee8313febb9db9c55e0a434",
  "juniorfigueiredo.near",
  "Red11_trader.near",
  "closezebra1068.near",
  "jasters.near",
  "xan0118.near",
  "pym888.near",
  "d1g1t-v2.near",
  "yemariamyene21.tg",
  "npthebull.near",
  "wecare.near",
  "nearmultiverse.near",
  "voodooking.near",
  "lucasdeprueba.near",
  "21mbulls.near",
  "doublerose.near",
  "db02f607e2c86afa8886dcd21670dcfb44322fb0d26ffc8a33e8db1c628ffb3e",
  "demannu13.tg",
  "jackindeeper.near",
  "xmen02109x.near",
  "deepuni3051.near",
  "sleet.near",
  "ceefoon.near",
  "jefe_duvet.tg",
  "48ae4ca4744d536befe02c25f58ae33a1b6d4f900eccf1d8bb58a635910dbf75",
  "orerhime.near",
  "ertugrulozturk.near",
  "i6743224471.tg",
  "Aflatoon123.near",
  "5789cda20d329d031fb7176a5f7671cac7e35d00d32c9ea5463c0d2e7ecfaa30",
  "ytramn.near",
  "leon-mitte.near",
  "meteorkent.near",
  "0x6871979c76a1313949b2E928F75dC316E02bfe33",
  "trisharichie.near",
  "pironi.near",
  "escobarindo.near",
  "zent.near",
  "pironi.near",
  "scalable.near",
  "cakmirza.tg",
  "cwpuzzles.near",
  "marior.near",
  "cwpuzzles.near",
  "eklan.near",
  "zkjandro.near",
  "hsyang.near",
  "aiml.near",
  "refinternn.near",
  "willagao.near",
  "web3hedge.near",
  "71b85bee14a52c42ce331d2b7ee789da4c542d72678cedcab0c762b43e28f244",
  "aquarius29.tg",
  "liqbot.near",
  "pysr.near",
];
export const DISABLE_WITHDRAW_ADDRESS = "bc1p";
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
          "usdt.tether-token.near",
          "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
          "shadow_ref_v1-4179",
          "853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near",
          "a663b02cf0a4b149d2ad41910cb81e23e1c41c32.factory.bridge.near",
          "shadow_ref_v1-4179",
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
        PRICE_ORACLE_ID: "mock-priceoracle.testnet",
        MEME_PRICE_ORACLE_ID: "mock-priceoracle.testnet",
        REF_EXCHANGE_ID: "exchange.ref-dev.testnet",
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
