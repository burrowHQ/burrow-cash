import { useEffect, useState } from "react";
import Decimal from "decimal.js";
import { init_env } from "@ref-finance/ref-sdk";
import { useV1EstimateSwap } from "./useV1EstimateSwap";
import { useDclEstimateSwap } from "./useDclEstimateSwap";
import { IEstimateResult } from "../interfaces";

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
  forceUpdate,
}: {
  tokenIn_id: string;
  tokenOut_id: string;
  tokenIn_amount: string;
  slippageTolerance: number;
  account_id?: string;
  simplePools: any[];
  stablePools: any[];
  stablePoolsDetail: any[];
  forceUpdate?: number;
}) => {
  const [estimateResult, setEstimateResult] = useState<IEstimateResult>();
  const dclEstimateResult: any = useDclEstimateSwap({
    tokenIn_id,
    tokenOut_id,
    tokenIn_amount,
    slippageTolerance,
    forceUpdate,
  });
  const v1EstimateResult: any = useV1EstimateSwap({
    tokenIn_id,
    tokenOut_id,
    tokenIn_amount,
    slippageTolerance,
    account_id,
    simplePools,
    stablePools,
    stablePoolsDetail,
    forceUpdate,
  });
  useEffect(() => {
    if (dclEstimateResult?.tag && v1EstimateResult?.tag && validator()) {
      getBestEstimateResult();
    }
    if (tokenIn_amount == "0" || !tokenIn_amount) {
      setEstimateResult((prev: any) => {
        if (prev?.amount_out !== "0" || !prev?.loadingComplete) {
          return { ...prev, amount_out: "0", loadingComplete: true };
        }
        return prev;
      });
    }
  }, [
    dclEstimateResult?.tag,
    v1EstimateResult?.tag,
    dclEstimateResult?.amount_out,
    v1EstimateResult?.amount_out,
    tokenIn_amount,
  ]);
  function getBestEstimateResult() {
    const { amount_out: dcl_amount_out } = dclEstimateResult!;
    const { amount_out: v1_amount_out } = v1EstimateResult!;
    console.log(dcl_amount_out, v1_amount_out, "dcl_amount_out, v1_amount_out");
    // best is v1
    if (new Decimal(v1_amount_out || 0).gt(dcl_amount_out || 0)) {
      setEstimateResult({ ...v1EstimateResult, loadingComplete: true });
    } else if (new Decimal(dcl_amount_out || 0).gt(v1_amount_out || 0)) {
      // best is dcl
      setEstimateResult({ ...dclEstimateResult, loadingComplete: true });
    }
  }
  function validator() {
    if (dclEstimateResult?.tag && v1EstimateResult?.tag) {
      const dclTag = dclEstimateResult.tag;
      const v1Tag = v1EstimateResult.tag;
      const [v1InId, v1OutId, v1InAmount] = v1Tag.split("@");
      const [dclInId, dclOutId, dclInAmount] = dclTag.split("@");
      return (
        v1InId == tokenIn_id &&
        v1OutId == tokenOut_id &&
        v1InAmount == tokenIn_amount &&
        dclInId == tokenIn_id &&
        dclOutId == tokenOut_id &&
        dclInAmount == tokenIn_amount
      );
    }
    return false;
  }
  return estimateResult;
};
