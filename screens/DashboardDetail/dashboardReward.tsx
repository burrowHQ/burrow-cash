import Decimal from "decimal.js";
import { IMetadata, IReward } from "../../interfaces";
import { shrinkToken } from "../../store";
import { standardizeAsset } from "../../utils";
import { beautifyPrice } from "../../utils/beautyNumber";

interface RewardProps {
  rewardList?: IReward[];
  supplyReward?: { supplyDailyAmount: string; supplyDailyAmountUsd: string; metadata: IMetadata };
  page?: "deposit" | "borrow";
}

const DashboardReward = ({ rewardList = [], supplyReward }: RewardProps) => {
  let node;
  let nodeSupply;
  let totalUsd = 0;
  let hasCommonReward = false;
  if (rewardList?.length) {
    node = rewardList.map(({ metadata, rewards, config, price }) => {
      const { symbol, decimals, token_id } = metadata;
      const dailyRewards = shrinkToken(
        rewards.reward_per_day || 0,
        decimals + config.extra_decimals,
      );
      const usdPrice = price ? Number(dailyRewards) * price : 0;
      totalUsd += usdPrice;
      if (supplyReward?.metadata?.token_id == token_id) {
        hasCommonReward = true;
      }
      const cloned = metadata && standardizeAsset({ ...metadata });
      return (
        <div key={symbol} style={{ margin: "0 -3px" }}>
          <img src={cloned?.icon} className="w-[16px] h-[16px] rounded-full" alt="" />
        </div>
      );
    });
  }
  const clonedSupplyMetadata =
    supplyReward?.metadata && standardizeAsset({ ...supplyReward?.metadata });
  if (clonedSupplyMetadata) {
    if (!hasCommonReward) {
      nodeSupply = (
        <div key={`${clonedSupplyMetadata.token_id}supply`} style={{ margin: "0 -3px" }}>
          <img src={clonedSupplyMetadata.icon} className="w-[16px] h-[16px] rounded-full" alt="" />
        </div>
      );
    }

    totalUsd = new Decimal(totalUsd).plus(supplyReward?.supplyDailyAmountUsd || 0).toNumber();
  }
  const usdNode = totalUsd !== 0 && beautifyPrice(totalUsd, true);

  return (
    <div className="flex gap-2 md:gap-0 md:flex-col px-1">
      <div className="flex items-center md:mb-1">
        {node}
        {nodeSupply}
      </div>
      <div className="md:h6 md:text-gray-300">{usdNode}</div>
    </div>
  );
};

export default DashboardReward;
