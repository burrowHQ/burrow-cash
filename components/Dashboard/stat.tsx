import React from "react";
import { TagToolTip } from "../ToolTip";

export const NetLiquidityTip = "Net Liquidity = Your total Supplied - Your total Borrowed";
export const NetAPYTip = "Net APY = Daily Total Profit / Your Net Liquidity * 365 days";
export const DailyRewardsTip = "Estimated daily profit";
export const UnclaimedRewardsTip = "Base APY earnings added to your supply balance.";
export const HealthFactorTip =
  "Represents the combined collateral ratios of the borrowed assets. If it is less than 100%, your account can be partially liquidated";

export function StatsRegular({
  title,
  value,
  tip,
}: {
  title: string;
  value: string | React.ReactElement;
  tip?: string;
}) {
  return (
    <div className="flex flex-col gap-1 relative z-10">
      <div className="flex items-center gap-1">
        <span className="text-sm text-white text-opacity-40">{title}</span>
        {tip ? <TagToolTip title={tip} /> : null}
      </div>
      <span className="text-3xl xsm:text-2xl">{value}</span>
    </div>
  );
}
