import { useEffect, useState, useMemo } from "react";
import {
  estimateSwap,
  getExpectedOutputFromSwapTodos,
  instantSwap,
  Transaction,
  init_env,
  getAvgFee,
  getPriceImpact,
  separateRoutes,
} from "@ref-finance/ref-sdk";
import { isEmpty } from "lodash";
import Decimal from "decimal.js";
import { useAppSelector } from "../redux/hooks";
import { getAssets } from "../redux/assetsSelectors";
import { getMarginConfig } from "../redux/marginConfigSelectors";
import { getAllPools } from "../redux/poolSelectors";
import { deepCopy } from "../utils/commonUtils";
import { expandTokenDecimal } from "../store";
import { IEstimateResult, IFindPathResult, IServerPool, IRoute } from "../interfaces/margin";
import { findPath } from "../api/get-swap-path";
import { shrinkToken, expandToken } from "../store/helper";
import { percentLess } from "../utils/number";

init_env("dev");
const SHUTDOWN_SERVER = true;
export const useV1EstimateSwap = ({
  tokenIn_id,
  tokenOut_id,
  tokenIn_amount,
  slippageTolerance,
  account_id,
  simplePools,
  stablePools,
  stablePoolsDetail,
}: {
  tokenIn_id: string;
  tokenOut_id: string;
  tokenIn_amount: string;
  slippageTolerance: number;
  account_id?: string;
  simplePools: any[];
  stablePools: any[];
  stablePoolsDetail: any[];
}) => {
  const assets = useAppSelector(getAssets);
  const marginConfig = useAppSelector(getMarginConfig);
  const allPools = useAppSelector(getAllPools);
  const [estimateData, setEstimateData] = useState<IEstimateResult>();
  const [tokenIn_metadata, tokenOut_metadata] = useMemo(() => {
    if (tokenIn_id && tokenOut_id) {
      const [tokenIn_metadata, tokenOut_metadata] = getMetadatas([
        assets.data[tokenIn_id],
        assets.data[tokenOut_id],
      ]);
      return [tokenIn_metadata, tokenOut_metadata];
    }
    return [];
  }, [tokenIn_id, tokenOut_id]);
  useEffect(() => {
    if (
      !isEmpty(assets) &&
      !isEmpty(simplePools) &&
      !isEmpty(stablePools) &&
      !isEmpty(stablePoolsDetail) &&
      Number(tokenIn_amount) > 0
    ) {
      getEstimateSwapData();
    }
  }, [
    assets,
    tokenIn_id,
    tokenOut_id,
    tokenIn_amount,
    slippageTolerance,
    simplePools?.length,
    stablePools?.length,
    stablePoolsDetail?.length,
  ]);
  async function getEstimateSwapData() {
    if (SHUTDOWN_SERVER) {
      getEstimateSwapFromScript();
    } else {
      getEstimateSwapFromServer();
    }
  }
  async function getEstimateSwapFromServer() {
    const expandAmount = expandTokenDecimal(tokenIn_amount, tokenIn_metadata.decimals).toFixed(0);
    const resultFromServer = await findPath({
      amountIn: expandAmount,
      tokenIn: tokenIn_id,
      tokenOut: tokenOut_id,
      slippage: slippageTolerance,
    }).catch(() => ({}));
    // test code
    // const resultFromServer = await findPath({
    //   amountIn: "1000000000000000000000000",
    //   tokenIn: "wrap.near",
    //   tokenOut: "dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near",
    //   slippage: 0.005,
    // }).catch(() => ({}));
    if (!(resultFromServer?.result_code !== 0 || !resultFromServer?.result_data?.routes?.length)) {
      const result: IFindPathResult = resultFromServer.result_data;
      const min_output_amount = percentLess(slippageTolerance, result.amount_out || "0");
      const dexMap = Object.entries(marginConfig.registered_dexes).reduce((acc, cur: any) => {
        return {
          ...acc,
          [cur[1]]: cur[0],
        };
      }, {});
      const dex = dexMap["1"];
      const { routes } = result;
      const actionsList: IServerPool[] = [];
      routes.forEach((route) => {
        route.pools.forEach((pool) => {
          if (+(pool.amount_in || 0) == 0) {
            delete pool.amount_in;
          }
          pool.pool_id = Number(pool.pool_id);
          actionsList.push(pool);
        });
      });
      const msg = JSON.stringify({
        force: 0,
        actions: actionsList,
      });
      const avgFee = getAvgFeeFromServer({
        routes,
        tokenInAmount: tokenIn_amount,
      });
      setEstimateData({
        amount_out: shrinkToken(result.amount_out, tokenOut_metadata.decimals),
        min_amount_out: new Decimal(min_output_amount || 0).toFixed(0),
        swap_indication: {
          dex_id: dex,
          swap_action_text: msg,
          client_echo: null,
        },
        fee: avgFee,
        tokensPerRoute: [], // TODO-now
        identicalRoutes: [], // TODO-now
        tag: `${tokenIn_id}@${tokenOut_id}@${tokenIn_amount}`,
        from: "v1",
      });
    } else {
      getEstimateSwapFromScript();
    }
  }
  async function getEstimateSwapFromScript() {
    const [tokenIn_metadata, tokenOut_metadata] = getMetadatas([
      assets.data[tokenIn_id],
      assets.data[tokenOut_id],
    ]);
    const swapTodos = await estimateSwap({
      tokenIn: tokenIn_metadata,
      tokenOut: tokenOut_metadata,
      amountIn: tokenIn_amount,
      simplePools,
      options: {
        enableSmartRouting: true,
        stablePools,
        stablePoolsDetail,
      },
    }).catch((e) => {
      return e;
    });
    if (swapTodos.message) {
      // setEstimateData({
      //   swapError: swapTodos.message,
      // });
      return;
    }
    const amountOut: string = getExpectedOutputFromSwapTodos(
      swapTodos,
      tokenOut_metadata.id,
    ).toFixed();
    const transactionsRef: Transaction[] = await instantSwap({
      tokenIn: tokenIn_metadata,
      tokenOut: tokenOut_metadata,
      amountIn: tokenIn_amount,
      swapTodos,
      slippageTolerance,
      AccountId: account_id || "test_account_id",
      referralId: "app.burrow.finance",
    });
    const swapTransaction = transactionsRef.pop() as any;
    const [dex_id, msg] = get_swap_indication_info(swapTransaction, marginConfig.registered_dexes);
    const min_amount_out = get_min_amount_out(msg);
    const fee = getAvgFee(
      swapTodos,
      tokenOut_id,
      expandTokenDecimal(tokenIn_amount, tokenIn_metadata.decimals).toFixed(0),
    );
    const priceImpact = getPriceImpact({
      estimates: swapTodos,
      tokenIn: tokenIn_metadata,
      tokenOut: tokenOut_metadata,
      amountIn: tokenIn_amount,
      amountOut,
      stablePools: stablePoolsDetail,
    });
    const tokensPerRoute = swapTodos
      .filter((swap) => swap.inputToken === tokenIn_metadata?.id)
      .map((swap) => swap.tokens);
    const identicalRoutes = separateRoutes(
      swapTodos,
      swapTodos[swapTodos.length - 1]?.outputToken || "",
    );
    setEstimateData({
      amount_out: amountOut,
      min_amount_out: expandTokenDecimal(
        min_amount_out,
        assets.data[tokenOut_id].config.extra_decimals,
      ).toFixed(0),
      swap_indication: {
        dex_id,
        swap_action_text: msg,
        client_echo: null,
      },
      fee,
      tokensPerRoute,
      identicalRoutes,
      tag: `${tokenIn_id}@${tokenOut_id}@${tokenIn_amount}`,
      from: "v1",
    });
  }
  function getUsedPools(routes: IRoute[]) {
    const pools: Record<string, any> = {};
    routes.forEach((route) => {
      route.pools.forEach((cur) => {
        const p = allPools.find((p: any) => +p.id === +cur.pool_id);
        if (p) {
          pools[p.id] = p;
        }
      });
    });
    return pools;
  }
  function getAvgFeeFromServer({
    routes,
    tokenInAmount,
  }: {
    tokenInAmount: string;
    routes: IRoute[];
  }) {
    let avgFee: number = 0;
    const poolsMap = getUsedPools(routes);
    routes.forEach((route) => {
      const { amount_in, pools } = route;
      const allocation = new Decimal(amount_in).div(
        new Decimal(expandToken(tokenInAmount, tokenIn_metadata.decimals)),
      );
      const routeFee = pools.reduce((acc, cur) => {
        return acc.plus(
          new Decimal(poolsMap[cur.pool_id]?.fee || poolsMap[cur.pool_id]?.total_fee || 0).mul(
            10000,
          ),
        );
      }, new Decimal(0));
      avgFee += allocation.mul(routeFee).toNumber();
    });
    return avgFee;
  }
  return estimateData;
};
function getMetadatas(tokenAssets) {
  return tokenAssets.map((asset) => {
    const tokenData = deepCopy(asset) as any;
    const { metadata } = tokenData;
    metadata.id = metadata.token_id;
    return metadata;
  });
}
function get_swap_indication_info(swapTransaction, registered_dexes) {
  const msg = swapTransaction?.functionCalls?.[0]?.args?.msg || "{}";
  const msgObj = JSON.parse(msg);
  let dex = "";
  const dexMap = Object.entries(registered_dexes).reduce((acc, cur: any) => {
    return {
      ...acc,
      [cur[1]]: cur[0],
    };
  }, {});
  if (!isEmpty(msgObj.Swap)) {
    msgObj.Swap.skip_unwrap_near = true;
    dex = dexMap["2"];
  } else {
    dex = dexMap["1"];
  }
  return [dex, JSON.stringify(msgObj)];
}
function get_min_amount_out(msg) {
  const { actions, Swap } = JSON.parse(msg);
  if (!isEmpty(actions)) {
    return actions
      .reduce((sum, action) => sum.plus(action.min_amount_out), new Decimal(0))
      .toFixed();
  }
  if (!isEmpty(Swap)) {
    return Swap.min_output_amount;
  }
  return "0";
}
