import millify from "millify";
import { IReward } from "../../interfaces";
import { PERCENT_DIGITS, shrinkToken } from "../../store";
import { formatPortfolioRewardAmount } from "../../components/Table/common/cells";
import { formatUSDValue } from "../../helpers/helpers";
import { standardizeAsset } from "../../utils";

interface RewardProps {
  rewardList?: IReward[];
  page?: "deposit" | "borrow";
}

const DashboardReward = ({ rewardList = [], page }: RewardProps) => {
  let node;
  let totalUsd = 0;
  if (rewardList?.length) {
    node = rewardList.map(({ metadata, rewards, config, price }) => {
      const { symbol, decimals } = metadata;
      const dailyRewards = shrinkToken(
        rewards.reward_per_day || 0,
        decimals + config.extra_decimals,
      );
      const usdPrice = price ? Number(dailyRewards) * price : 0;
      totalUsd += usdPrice;
      const cloned = metadata && standardizeAsset({ ...metadata });
      return (
        <div key={symbol} style={{ margin: "0 -3px" }}>
          <img src={cloned?.icon} className="w-[16px] h-[16px] rounded-full" alt="" />
        </div>
      );
    });
  }

  const usdNode =
    totalUsd !== 0 && totalUsd < 0.01 ? `<${formatUSDValue(0.01)}` : formatUSDValue(totalUsd);

  return (
    <div className="flex gap-2 md:gap-0 md:flex-col px-1">
      <div className="flex items-center md:mb-1">{node}</div>
      <div className="md:h6 md:text-gray-300">{usdNode}</div>
    </div>
  );
};

export default DashboardReward;
