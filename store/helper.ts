import BN from "bn.js";
import Decimal from "decimal.js";
import { Account, Contract } from "near-api-js";

import { DEFAULT_PRECISION, NANOS_PER_YEAR, NEAR_DECIMALS } from "./constants";
import { getBurrow, nearTokenId } from "../utils";
import {
  ViewMethodsOracle,
  IAssetPrice,
  IPrices,
  ChangeMethodsLogic,
  ViewMethodsPyth,
  IPythPrice,
  ViewMethodsToken,
  ViewMethodsLogic,
  IConfig,
  IPrice,
} from "../interfaces";
import { isRegistered } from "./wallet";
import {
  NEARX_TOKEN,
  LINEAR_TOKEN,
  STNEAR_TOKEN,
  SFRAX_TOKEN,
  FRACTION_DIGITS,
} from "../utils/pythOracleConfig";
// eslint-disable-next-line import/no-cycle
import { getTokenContract } from "./tokens";
import getConfig from "../utils/config";
import { getAuthenticationHeaders } from "../utils/signature";

Decimal.set({ precision: DEFAULT_PRECISION });

export const aprToRate = (apr: string): string => {
  const exp = new Decimal(1).dividedBy(new Decimal(NANOS_PER_YEAR));
  const base = new Decimal(apr).dividedBy(new Decimal(100));
  const result: Decimal = base.plus(new Decimal(1)).pow(exp);
  const roundRes: Decimal = result.mul(new Decimal(10).pow(new Decimal(27)));
  return roundRes.toPrecision(12);
};

export const rateToApr = (rate: string): string => {
  const apr = new Decimal(100)
    .mul(new Decimal(rate).div(new Decimal(10).pow(new Decimal(27))).pow(NANOS_PER_YEAR))
    .sub(100);

  return apr.toFixed(2);
};

export const getPrices = async (): Promise<IPrices | undefined> => {
  const { view, logicContract } = await getBurrow();
  const config = (await view(
    logicContract,
    ViewMethodsLogic[ViewMethodsLogic.get_config],
  )) as IConfig;
  const { enable_pyth_oracle } = config;
  if (enable_pyth_oracle) {
    const pythResponse = await getPythPrices();
    return pythResponse;
  } else {
    const oracleResponse = await getOraclePrices();
    return oracleResponse;
  }
};
const getPythPrices = async () => {
  const { view, pythContract, logicContract } = await getBurrow();
  const COINList = await view(
    logicContract,
    ViewMethodsLogic[ViewMethodsLogic.get_all_token_pyth_infos],
  );
  try {
    const array_coins = Object.entries(COINList) as any[];
    const allRequest = array_coins.map(([, coin]) => {
      return view(pythContract, ViewMethodsPyth[ViewMethodsPyth.get_price], {
        price_identifier: coin.price_identifier,
      });
    });
    let near_pyth_price_obj: IPythPrice = {
      price: "0",
      conf: "0",
      expo: 0,
      publish_time: 0,
    };
    const price_array = (await Promise.all(allRequest)) as IPythPrice[];
    const format_price: IAssetPrice[] = price_array.map((priceObject: IPythPrice, index) => {
      const coin = array_coins[index];
      if (!priceObject) {
        if (coin[1].default_price) {
          return {
            asset_id: coin[0],
            price: coin[1].default_price as IPrice,
          };
        }
        return {
          asset_id: coin[0],
          price: {
            multiplier: "0",
            decimals: coin[1].decimals + coin[1].fraction_digits,
          },
        };
      }
      const { price, expo } = priceObject;
      const p = new Decimal(10).pow(expo).mul(price).toNumber();
      if (coin[0] === nearTokenId) {
        near_pyth_price_obj = priceObject;
      }
      coin[1].fraction_digits = coin[1].fraction_digits || FRACTION_DIGITS;
      const discrepancy_denominator = new Decimal(10).pow(coin[1].fraction_digits).toNumber();
      const object = {
        asset_id: coin[0],
        price: {
          multiplier: new Decimal(p).mul(discrepancy_denominator).toFixed(0),
          decimals: coin[1].decimals + coin[1].fraction_digits,
        },
      };
      return object;
    });
    const format_price_map = format_price.reduce(
      (acc, p: IAssetPrice) => ({ ...acc, [p.asset_id]: p }),
      {},
    );
    if (near_pyth_price_obj) {
      const near_price = new Decimal(10)
        .pow(near_pyth_price_obj.expo)
        .mul(near_pyth_price_obj.price);
      const NEARX_CONTRACT = await getTokenContract(NEARX_TOKEN);
      const STNEAR_CONTRACT = await getTokenContract(STNEAR_TOKEN);
      const LINEAR_CONTRACT = await getTokenContract(LINEAR_TOKEN);
      const nearx_proportion = (await view(
        NEARX_CONTRACT,
        ViewMethodsToken[ViewMethodsToken.get_nearx_price],
      )) as string;
      const stnear_proportion = (await view(
        STNEAR_CONTRACT,
        ViewMethodsToken[ViewMethodsToken.get_st_near_price],
      )) as string;
      const linear_proportion = (await view(
        LINEAR_CONTRACT,
        ViewMethodsToken[ViewMethodsToken.ft_price],
      )) as string;
      const nearx_price = new Decimal(near_price)
        .mul(nearx_proportion)
        .div(new Decimal(10).pow(24));
      const stnear_price = new Decimal(near_price)
        .mul(stnear_proportion)
        .div(new Decimal(10).pow(24));
      const linear_price = new Decimal(near_price)
        .mul(linear_proportion)
        .div(new Decimal(10).pow(24));
      format_price_map[NEARX_TOKEN] = {
        asset_id: NEARX_TOKEN,
        price: {
          multiplier: nearx_price.mul(new Decimal(10).pow(FRACTION_DIGITS)).toFixed(0),
          decimals: 24 + FRACTION_DIGITS,
        },
      };
      format_price_map[STNEAR_TOKEN] = {
        asset_id: STNEAR_TOKEN,
        price: {
          multiplier: stnear_price.mul(new Decimal(10).pow(FRACTION_DIGITS)).toFixed(0),
          decimals: 24 + FRACTION_DIGITS,
        },
      };
      format_price_map[LINEAR_TOKEN] = {
        asset_id: LINEAR_TOKEN,
        price: {
          multiplier: linear_price.mul(new Decimal(10).pow(FRACTION_DIGITS)).toFixed(0),
          decimals: 24 + FRACTION_DIGITS,
        },
      };
    }
    // try {
    //   const listTokenPrice = await fetch(`${getConfig().recordsUrl}/list-token-price`, {
    //     method: "GET",
    //     headers: {
    //       Authentication: getAuthenticationHeaders("/list-token-price"),
    //     },
    //   }).then((r) => r.json());
    //   if (listTokenPrice?.[SFRAX_TOKEN]?.price) {
    //     format_price_map[SFRAX_TOKEN] = {
    //       asset_id: SFRAX_TOKEN,
    //       price: {
    //         multiplier: new Decimal(listTokenPrice?.[SFRAX_TOKEN]?.price)
    //           .mul(new Decimal(10).pow(FRACTION_DIGITS))
    //           .toFixed(0),
    //         decimals: 18 + FRACTION_DIGITS,
    //       },
    //     };
    //   }
    // } catch (error) {}
    return {
      prices: Object.values(format_price_map) as IAssetPrice[],
      recency_duration_sec: 0,
      timestamp: "0",
    };
  } catch (error) {
    return undefined;
  }
};
const getOraclePrices = async () => {
  const { view, oracleContract } = await getBurrow();
  try {
    const priceResponse: IPrices = (await view(
      oracleContract,
      ViewMethodsOracle[ViewMethodsOracle.get_price_data],
    )) as IPrices;

    if (priceResponse) {
      priceResponse.prices = priceResponse?.prices.map((assetPrice: IAssetPrice) => ({
        ...assetPrice,
        price: assetPrice.price,
      }))!;
    }

    return priceResponse;
  } catch (err: any) {
    console.error("Getting prices failed: ", err.message);
    return undefined;
  }
};

export const expandTokenDecimal = (
  value: string | number | Decimal,
  decimals: string | number,
): Decimal => {
  return new Decimal(value).mul(new Decimal(10).pow(decimals));
};

export const expandToken = (
  value: string | number | Decimal,
  decimals: string | number,
  fixed?: number,
): string => {
  return expandTokenDecimal(value, decimals).toFixed(fixed);
};

export const shrinkToken = (
  value: string | number,
  decimals: string | number,
  fixed?: number,
): string => {
  return new Decimal(value).div(new Decimal(10).pow(decimals)).toFixed(fixed);
};

export const getContract = async (
  account: Account,
  contractAddress: string,
  viewMethods: any,
  changeMethods: any,
): Promise<Contract> => {
  const contract: Contract = new Contract(account, contractAddress, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: Object.values(viewMethods)
      .filter((m) => typeof m === "string")
      .map((m) => m as string),
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: Object.values(changeMethods)
      .filter((m) => typeof m === "string")
      .map((m) => m as string),
  });

  return contract;
};

export const registerNearFnCall = async (accountId: string, contract: Contract) =>
  !(await isRegistered(accountId, contract))
    ? [
        {
          methodName: ChangeMethodsLogic[ChangeMethodsLogic.storage_deposit],
          attachedDeposit: new BN(expandToken(0.00125, NEAR_DECIMALS)),
          gas: new BN("5000000000000"),
        },
      ]
    : [];
