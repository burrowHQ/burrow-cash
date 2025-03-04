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

export default function DashboardOverview({ memeCategory }: { memeCategory: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };
  const openModal = () => {
    setIsModalOpen(true);
  };
  // net Liquidity
  const userDeposited = useAppSelector(getTotalAccountBalance("supplied", memeCategory));
  const userBorrowed = useAppSelector(getTotalAccountBalance("borrowed", memeCategory));
  const userNetLiquidity = new Decimal(userDeposited).minus(userBorrowed).toNumber();
  const userNetLiquidityValue = userNetLiquidity > 0 ? beautifyPrice(userNetLiquidity, true) : `$0`;

  // net apy
  const { netAPY, netLiquidityAPY } = useUserHealth(memeCategory);
  const totalApyMain = netAPY + netLiquidityAPY;
  const amountMain = `${totalApyMain.toLocaleString(undefined, APY_FORMAT)}%`;

  // Daily Rewards
  const { totalUsdDaily, allRewards } = useDailyRewards(memeCategory);
  const dailyRewards = (
    <div className="flex items-center gap-1">
      {totalUsdDaily > 0 ? beautifyPrice(totalUsdDaily, true) : "$0"}
      <IconMore allRewards={allRewards} />
    </div>
  );
  // Unclaimed Rewards
  const rewardsObj = useRewards(memeCategory);
  const rewards = (
    <div className="flex items-center gap-4 my-1">
      <div className="h2">{rewardsObj?.data?.totalUnClaimUSDDisplay || "$0"}</div>
      <div className="flex items-center">
        {rewardsObj?.data?.array.map(({ data, tokenId }) => {
          return (
            <img
              src={data?.icon}
              key={tokenId}
              alt="token"
              className="rounded-full w-5 h-5 flex-shrink-0"
            />
          );
        })}
      </div>
      {rewardsObj?.data?.totalUnClaimUSD > 0 ? (
        <span
          onClick={openModal}
          className="flex items-center justify-center w-[80px] h-8 rounded-full text-sm text-dark-130 bg-primary cursor-pointer"
        >
          Claim
        </span>
      ) : null}
    </div>
  );
  return (
    <div className="mb-[50px]">
      <div className="flex items-center justify-between">
        <span className="text-lg text-gray-140">
          {memeCategory ? "Meme position" : "Mainstream"}
        </span>
        <span className="text-sm text-primary underline cursor-pointer">Position Detail</span>
      </div>
      <div className="grid grid-cols-4 bg-dark-120 rounded-xl border border-dark-50 px-[30px] py-6 mt-4 hover:border-primary">
        <StatsRegular title="Net Liquidity" value={userNetLiquidityValue} tip={NetLiquidityTip} />
        <StatsRegular title="Net APY" value={amountMain} tip={NetAPYTip} />
        <StatsRegular title="Daily Rewards" value={dailyRewards} tip={DailyRewardsTip} />
        <StatsRegular title="Unclaimed Rewards" value={rewards} tip={UnclaimedRewardsTip} />
      </div>
      <ClaimRewardsModal rewardsObj={rewardsObj} isOpen={isModalOpen} closeModal={closeModal} />
    </div>
  );
}
