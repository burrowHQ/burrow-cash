import { useEffect, useState } from "react";
import _ from "lodash";
import Decimal from "decimal.js";
import { useAppSelector } from "../redux/hooks";
import { getAssets } from "../redux/assetsSelectors";
import { expandTokenDecimal, shrinkToken } from "../store";
import { getDclPools } from "../redux/poolSelectors";
import { DCL_POOL_FEE_LIST } from "../utils/constant";
import { quote } from "../api/get-pool";
import { IQuoteResult } from "../interfaces/pool";
import { IEstimateResult } from "../interfaces/margin";
import { getMetadatas, get_registered_dexes } from "../utils/margin";

export const useDclEstimateSwap = ({
  tokenIn_id,
  tokenOut_id,
  tokenIn_amount,
  slippageTolerance,
  forceUpdate,
}: {
  tokenIn_id: string;
  tokenOut_id: string;
  tokenIn_amount: string;
  slippageTolerance: number;
  forceUpdate?: number;
}) => {
  const [estimateData, setEstimateData] = useState<IEstimateResult>();
  const assets = useAppSelector(getAssets);
  const allDclPools = useAppSelector(getDclPools);
  useEffect(() => {
    if (tokenIn_id && tokenOut_id && new Decimal(tokenIn_amount || 0).gt(0)) {
      estimateDclSwap();
    }
  }, [tokenIn_id, tokenOut_id, tokenIn_amount, slippageTolerance, forceUpdate]);
  async function estimateDclSwap() {
    const [tokenIn_metadata, tokenOut_metadata] = getMetadatas([
      assets.data[tokenIn_id],
      assets.data[tokenOut_id],
    ]);
    const expandAmount = expandTokenDecimal(tokenIn_amount, tokenIn_metadata.decimals).toFixed(0);
    const dclPoolIds = DCL_POOL_FEE_LIST.map((fee) => {
      const tokenSeq = [tokenIn_id, tokenOut_id].sort().join("|");
      return `${tokenSeq}|${fee}`;
    });
    const exist_pool_ids: string[] = [];
    dclPoolIds.forEach((pool_id) => {
      if (allDclPools.find((p) => p.id == pool_id)) {
        exist_pool_ids.push(pool_id);
      }
    });
    if (!exist_pool_ids.length) {
      setEstimateData({
        amount_out: "0",
        min_amount_out: "0",
        swap_indication: {
          dex_id: "",
          swap_action_text: "",
        },
        fee: 0,
        tag: `${tokenIn_id}@${tokenOut_id}@${tokenIn_amount}`,
        from: "dcl",
      });
      return;
    }
    const quotePending = exist_pool_ids.map((pool_id: string) =>
      quote({
        pool_ids: [pool_id],
        input_token_id: tokenIn_id,
        output_token_id: tokenOut_id,
        input_amount: expandAmount,
        tag: `${pool_id}@${expandAmount}`,
      }),
    );
    const estimatesResult = await Promise.allSettled(quotePending);
    const fulfilledEstimates = estimatesResult.filter((res) => res.status == "fulfilled");
    const estimates = fulfilledEstimates.map((r) => r.value);
    const bestEstimate: IQuoteResult = _.maxBy(estimates, (e) => Number(e.amount))!;
    const dexMap = get_registered_dexes();
    const dex = dexMap["2"];
    const min_output_amount = new Decimal(1 - slippageTolerance || 0)
      .mul(bestEstimate.amount || "0")
      .toFixed(0);
    const swap_pool_id = bestEstimate.tag.split("@")[0];
    const [in_id, out_id, fee] = swap_pool_id.split("|");
    const msg = JSON.stringify({
      Swap: {
        pool_ids: [bestEstimate.tag.split("@")[0]],
        output_token: tokenOut_id,
        min_output_amount,
        skip_unwrap_near: true,
        client_echo: null,
      },
    });
    const swap_indication = {
      dex_id: dex,
      swap_action_text: msg,
    };
    setEstimateData({
      amount_out: shrinkToken(bestEstimate.amount || "0", tokenOut_metadata.decimals),
      min_amount_out: min_output_amount,
      swap_indication,
      fee: (+fee || 0) / 100,
      tag: `${tokenIn_id}@${tokenOut_id}@${tokenIn_amount}`,
      from: "dcl",
    });
  }
  return estimateData;
};
