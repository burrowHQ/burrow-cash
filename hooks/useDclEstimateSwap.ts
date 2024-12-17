import { useEffect, useState } from "react";
import _ from "lodash";
import Decimal from "decimal.js";
import { useAppSelector } from "../redux/hooks";
import { getAssets } from "../redux/assetsSelectors";
import { getMarginConfig } from "../redux/marginConfigSelectors";
import { deepCopy } from "../utils/commonUtils";
import { expandTokenDecimal } from "../store";
import { getDclPools } from "../redux/poolSelectors";
import { DCL_POOL_FEE_LIST } from "../utils/constant";
import { quote } from "../api/get-pool";
import { IQuoteResult } from "../interfaces/pool";
import { IEstimateResult } from "../interfaces/margin";
import { percentLess } from "../utils/number";

export const useDclEstimateSwap = ({
  tokenIn_id,
  tokenOut_id,
  tokenIn_amount,
  slippageTolerance,
}: {
  tokenIn_id: string;
  tokenOut_id: string;
  tokenIn_amount: string;
  slippageTolerance: number;
}) => {
  const [estimateData, setEstimateData] = useState<IEstimateResult>();
  const assets = useAppSelector(getAssets);
  const marginConfig = useAppSelector(getMarginConfig);
  const allDclPools = useAppSelector(getDclPools);
  useEffect(() => {
    if (tokenIn_id && tokenOut_id && new Decimal(tokenIn_amount || 0).gt(0)) {
      estimateDclSwap();
    }
  }, [tokenIn_id, tokenOut_id, tokenIn_amount, slippageTolerance]);
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
          client_echo: null,
        },
        fee: 0,
        tokensPerRoute: [[tokenIn_metadata, tokenOut_metadata]],
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
    const estimates = await Promise.all(quotePending);
    const bestEstimate: IQuoteResult = _.maxBy(estimates, (e) => Number(e.amount))!;
    const dexMap = Object.entries(marginConfig.registered_dexes).reduce((acc, cur: any) => {
      return {
        ...acc,
        [cur[1]]: cur[0],
      };
    }, {});
    const dex = dexMap["2"];
    const min_output_amount = percentLess(slippageTolerance, bestEstimate.amount || "0");
    const expand_min_output_amount = expandTokenDecimal(
      min_output_amount,
      tokenOut_metadata.decimals,
    ).toFixed(0);
    const swap_pool_id = bestEstimate.tag.split("@")[0];
    const [in_id, out_id, fee] = swap_pool_id.split("|");
    const msg = JSON.stringify({
      Swap: {
        pool_ids: [bestEstimate.tag.split("@")[0]],
        output_token: tokenOut_id,
        min_output_amount: expand_min_output_amount,
        skip_unwrap_near: true,
        client_echo: null,
      },
    });
    const swap_indication = {
      dex_id: dex,
      swap_action_text: msg,
      client_echo: null,
    };
    setEstimateData({
      amount_out: bestEstimate.amount || "0",
      min_amount_out: min_output_amount,
      swap_indication,
      fee: (+fee || 0) / 100,
      tokensPerRoute: [[tokenIn_metadata, tokenOut_metadata]],
      tag: `${tokenIn_id}@${tokenOut_id}@${tokenIn_amount}`,
      from: "dcl",
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
