import { useEffect, useState } from "react";
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
import { deepCopy } from "../utils/commonUtils";
import { expandTokenDecimal } from "../store";

init_env("dev");
export const useEstimateSwap = ({
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
  const [estimateData, setEstimateData] = useState<any>();
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
      setEstimateData({
        swapError: swapTodos.message,
      });
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
      expandTokenDecimal(tokenIn_amount, tokenIn_metadata.decimals).toFixed(),
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
      ).toFixed(),
      swap_indication: {
        dex_id,
        swap_action_text: msg,
        client_echo: null,
      },
      fee,
      tokensPerRoute,
      identicalRoutes,
      priceImpact,
    });
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
