import { useState } from "react";
import Decimal from "decimal.js";
import {
  StatsRegular,
  NetAPYTip,
  NetLiquidityTip,
  DailyRewardsTip,
  UnclaimedRewardsTip,
} from "./stat";
import { useAppSelector } from "../../redux/hooks";
import { getTotalAccountBalance } from "../../redux/selectors/getTotalAccountBalance";
import { beautifyPrice } from "../../utils/beautyNumber";
import { useUserHealth } from "../../hooks/useUserHealth";
import { APY_FORMAT } from "../../store";
import { useDailyRewards, useRewards } from "../../hooks/useRewards";
import { IconMore } from "../Header/stats/rewards";
import ClaimRewardsModal from "./claimRewardsModal";
import DashboardOverview from "./dashboardOverview";

export default function DashboardOverviewContainer() {
  return (
    <div>
      {/* main position */}
      <DashboardOverview memeCategory={false} />
      {/* meme position */}
      <DashboardOverview memeCategory={true} />
      {/* margin position */}
      <div className="flex items-center justify-between mt-[52px]">
        <span className="text-lg text-gray-140">Meme position</span>
        <span className="text-sm text-primary underline cursor-pointer">Margin Trading</span>
      </div>
      <div className="grid grid-cols-4 bg-dark-120 rounded-xl border border-dark-50 px-[30px] py-6 mt-4 hover:border-primary">
        <StatsRegular title="Net Liquidity" value="$91.78" tip="hello" />
        <StatsRegular title="Net Liquidity" value="$91.78" tip="hello" />
        <StatsRegular title="Net Liquidity" value="$91.78" tip="hello" />
        <StatsRegular title="Net Liquidity" value="$91.78" tip="hello" />
      </div>
    </div>
  );
}
