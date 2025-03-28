// @ts-nocheck
import millify from "millify";
import { Box, Tooltip, Skeleton } from "@mui/material";

import { USD_FORMAT, TOKEN_FORMAT, APY_FORMAT, DUST_FORMAT, NUMBER_FORMAT } from "../../../store";
import type { IReward, UIAsset } from "../../../interfaces";
import { useAppSelector } from "../../../redux/hooks";
import { getDisplayAsTokenValue } from "../../../redux/appSelectors";
import { getShowDust } from "../../../redux/categorySelectors";
import { Rewards } from "../../index";
import { useFullDigits } from "../../../hooks/useFullDigits";

type FormatType = "apy" | "amount" | "string" | "reward" | "usd";
type FormatMap = {
  [t in FormatType]: (v: number | string) => string;
};
export const formatRewardAmount = (amount: number) =>
  amount < 0.001 ? "<0.001" : amount.toLocaleString(undefined, NUMBER_FORMAT);

export const formatPortfolioRewardAmount = (amount: number) =>
  amount < 0.001 ? "<0.001" : amount.toLocaleString(undefined, TOKEN_FORMAT);
