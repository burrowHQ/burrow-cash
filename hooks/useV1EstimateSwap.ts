import { useEffect, useState, useMemo } from "react";
import {
  estimateSwap,
  getExpectedOutputFromSwapTodos,
  instantSwap,
  Transaction,
  getAvgFee,
} from "@ref-finance/ref-sdk";
import { isEmpty } from "lodash";
import Decimal from "decimal.js";
import { useAppSelector } from "../redux/hooks";
import { getAllAssetsData } from "../redux/assetsSelectors";
import { getMarginConfigMEME } from "../redux/marginConfigSelectors";
import { getAllPools } from "../redux/poolSelectors";
import { expandTokenDecimal } from "../store";
import { IEstimateResult, IFindPathResult, IServerPool, IRoute } from "../interfaces/margin";
import { findPath } from "../api/get-swap-path";
import { shrinkToken, expandToken } from "../store/helper";
import {
  getMetadatas,
  get_swap_indication_info,
  get_amount_from_msg,
  get_registered_dexes,
} from "../utils/margin";
import { get_pools_from_sdk } from "../api/get-pool";

const SHUTDOWN_SERVER = false;
let simplePools;
let stablePools;
let stablePoolsDetail;
export const useV1EstimateSwap = ({
  tokenIn_id,
  tokenOut_id,
  tokenIn_amount,
  slippageTolerance,
  account_id,
  forceUpdate,
}: {
  tokenIn_id: string;
  tokenOut_id: string;
  tokenIn_amount: string;
  slippageTolerance: number;
  account_id?: string;
  forceUpdate?: number;
}) => {
  const combinedAssetsData = useAppSelector(getAllAssetsData);
  const marginConfigMEME = useAppSelector(getMarginConfigMEME);
  const allPools = useAppSelector(getAllPools);
  const [estimateData, setEstimateData] = useState<IEstimateResult>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenIn_metadata, tokenOut_metadata] = useMemo(() => {
    if (tokenIn_id && tokenOut_id) {
      const [tokenIn_metadata, tokenOut_metadata] = getMetadatas([
        combinedAssetsData[tokenIn_id],
        combinedAssetsData[tokenOut_id],
      ]);
      return [tokenIn_metadata, tokenOut_metadata];
    }
    return [];
  }, [tokenIn_id, tokenOut_id]);
  useEffect(() => {
    if (!isEmpty(combinedAssetsData) && Number(tokenIn_amount) > 0 && tokenIn_id && tokenOut_id) {
      getEstimateSwapData();
    }
  }, [combinedAssetsData, tokenIn_id, tokenOut_id, tokenIn_amount, slippageTolerance, forceUpdate]);
  async function getEstimateSwapData() {
    setLoading(true);
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
    })
      .catch(() => ({}))
      .finally(() => {
        setLoading(false);
      });
    if (!(resultFromServer?.result_code !== 0 || !resultFromServer?.result_data?.routes?.length)) {
      const result: IFindPathResult = resultFromServer.result_data;
      let min_output_amount = new Decimal(0);
      const dexMap = get_registered_dexes();
      const dex = dexMap["1"];
      const { routes, amount_in } = result;
      const actionsList: IServerPool[] = [];
      routes.forEach((route) => {
        route.pools.forEach((pool) => {
          if (+(pool.amount_in || 0) == 0) {
            delete pool.amount_in;
          }
          pool.pool_id = Number(pool.pool_id);
          actionsList.push(pool);
          min_output_amount = min_output_amount.plus(pool.min_amount_out || 0);
        });
      });
      const msg = JSON.stringify({
        force: 0,
        actions: actionsList,
        skip_degen_price_sync: true,
      });
      const avgFee = getAvgFeeFromServer({
        routes,
        tokenInAmount: tokenIn_amount,
      });
      setEstimateData({
        expand_amount_in: amount_in,
        amount_out: shrinkToken(result.amount_out, tokenOut_metadata.decimals),
        min_amount_out: min_output_amount.toFixed(0),
        swap_indication: {
          dex_id: dex,
          swap_action_text: msg,
        },
        fee: avgFee,
        tag: `${tokenIn_id}@${tokenOut_id}@${tokenIn_amount}`,
        from: "v1",
      });
    } else {
      getEstimateSwapFromScript();
    }
  }
  async function getEstimateSwapFromScript() {
    if (!simplePools) {
      const poolsMap = await get_pools_from_sdk();
      simplePools = poolsMap.simplePools;
      stablePools = poolsMap.stablePools;
      stablePoolsDetail = poolsMap.stablePoolsDetail;
    }
    const [tokenIn_metadata, tokenOut_metadata] = getMetadatas([
      combinedAssetsData[tokenIn_id],
      combinedAssetsData[tokenOut_id],
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
    }).finally(() => {
      setLoading(false);
    });
    const swapTransaction = transactionsRef.pop() as any;
    const [dex_id, msg] = get_swap_indication_info(
      swapTransaction,
      marginConfigMEME.registered_dexes,
    );
    const { min_amount_out, expand_amount_in } = get_amount_from_msg(msg);
    const fee = getAvgFee(
      swapTodos,
      tokenOut_id,
      expandTokenDecimal(tokenIn_amount, tokenIn_metadata.decimals).toFixed(0),
    );
    // const priceImpact = getPriceImpact({
    //   estimates: swapTodos,
    //   tokenIn: tokenIn_metadata,
    //   tokenOut: tokenOut_metadata,
    //   amountIn: tokenIn_amount,
    //   amountOut,
    //   stablePools: stablePoolsDetail,
    // });
    // const tokensPerRoute = swapTodos
    //   .filter((swap) => swap.inputToken === tokenIn_metadata?.id)
    //   .map((swap) => swap.tokens);
    // const identicalRoutes = separateRoutes(
    //   swapTodos,
    //   swapTodos[swapTodos.length - 1]?.outputToken || "",
    // );
    setEstimateData({
      expand_amount_in,
      amount_out: amountOut,
      min_amount_out,
      swap_indication: {
        dex_id,
        swap_action_text: msg,
      },
      fee,
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
  return {
    estimateData,
    loading,
  };
};
