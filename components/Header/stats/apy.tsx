import { useState } from "react";
import { Stat } from "./components";
import { useUserHealth } from "../../../hooks/useUserHealth";
import { useAverageAPY } from "../../../hooks/useAverageAPY";
import { APY_FORMAT } from "../../../store";
import { useAppSelector } from "../../../redux/hooks";
import { getAverageSupplyRewardApy } from "../../../redux/selectors/getAverageSuppliedRewardApy";
import { getAverageBorrowedRewardApy } from "../../../redux/selectors/getAverageBorrowedRewardApy";
import { getAverageNetRewardApy } from "../../../redux/selectors/getAverageNetRewardApy";
import { getListTokenNetRewardApy } from "../../../redux/selectors/getListTokenNetRewardApy";
import HtmlTooltip from "../../common/html-tooltip";
import { format_apy } from "../../../utils/uiNumber";
import { NetAPYTip } from "../../Dashboard/stat";

export const APY = ({ memeCategory }: { memeCategory?: boolean }) => {
  const { netAPY, netLiquidityAPY } = useUserHealth(memeCategory);
  const { averageSupplyApy, averageBorrowedApy } = useAverageAPY(memeCategory);
  const totalApy = netAPY + netLiquidityAPY;
  const amount = `${totalApy.toLocaleString(undefined, APY_FORMAT)}%`;
  const showLabels = netAPY !== 0 || netLiquidityAPY !== 0;
  const apyLabels = [
    [
      {
        value: format_apy(averageSupplyApy),
        text: "Avg. Supply APY",
      },
    ],
    [
      {
        value: format_apy(averageBorrowedApy),
        text: "Avg. Borrow APY",
      },
    ],
    [
      {
        type: "component",
        content: <IncentiveAPY memeCategory={memeCategory} />,
      },
    ],
  ];
  return (
    <div className="relative">
      <div className="flex items-end">
        <Stat
          title="Net APY"
          titleTooltip={NetAPYTip}
          amount={amount}
          labels={showLabels ? apyLabels : []}
        />
      </div>
    </div>
  );
};
const IncentiveAPY = ({ memeCategory }: { memeCategory?: boolean }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const userSupplyApy = useAppSelector(getAverageSupplyRewardApy(memeCategory));
  const userBorrowedApy = useAppSelector(getAverageBorrowedRewardApy(memeCategory));
  const userNetApy = useAppSelector(getAverageNetRewardApy(memeCategory));
  const userListTokenNetApy = useAppSelector(getListTokenNetRewardApy(memeCategory));
  const empty = !userSupplyApy && !userBorrowedApy && !userNetApy && !userListTokenNetApy.length;
  if (empty) return null;
  return (
    <HtmlTooltip
      open={showTooltip}
      onOpen={() => setShowTooltip(true)}
      onClose={() => setShowTooltip(false)}
      title={
        <div className="flex flex-col gap-2">
          <div
            className={`flex items-center justify-between text-xs gap-6 ${
              userSupplyApy ? "" : "hidden"
            }`}
          >
            <span className="text-gray-300 font-normal">Avg. Supply Reward APY</span>
            <span className="text-white font-normal">{format_apy(userSupplyApy)}</span>
          </div>
          <div
            className={`flex items-center justify-between text-xs gap-6 ${
              userBorrowedApy ? "" : "hidden"
            }`}
          >
            <span className="text-gray-300 font-normal">Avg. Borrow Reward APY</span>
            <span className="text-white font-normal">{format_apy(userBorrowedApy)}</span>
          </div>
          <div
            className={`flex items-center justify-between text-xs gap-6 ${
              userNetApy ? "" : "hidden"
            }`}
          >
            <span className="text-gray-300 font-normal">Avg. Net Liquidity Reward APY</span>
            <span className="text-white font-normal">{format_apy(userNetApy)}</span>
          </div>
          <div
            className={`flex flex-col gap-2 text-xs ${userListTokenNetApy.length ? "" : "hidden"}`}
          >
            {userListTokenNetApy.map((apyData) => {
              return (
                <div
                  className="flex items-center justify-between gap-3"
                  key={apyData.asset.token_id}
                >
                  <span className="text-gray-300 font-normal">
                    {apyData.asset.metadata.symbol} Net Liquidity Reward APY
                  </span>
                  <span className="text-white font-normal">{format_apy(apyData.apy)}</span>
                </div>
              );
            })}
          </div>
        </div>
      }
    >
      <span
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
      >
        <div className="flex items-center justify-center w-[22px] h-[22px] rounded-3xl bg-white bg-opacity-10 z-50 cursor-pointer">
          <DotIcon />
        </div>
      </span>
    </HtmlTooltip>
  );
};
const DotIcon = () => {
  return (
    <svg width="9" height="2" viewBox="0 0 9 2" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 1C2 1.55228 1.55228 2 1 2C0.447715 2 0 1.55228 0 1C0 0.447715 0.447715 0 1 0C1.55228 0 2 0.447715 2 1ZM5.33333 1C5.33333 1.55228 4.88562 2 4.33333 2C3.78105 2 3.33333 1.55228 3.33333 1C3.33333 0.447715 3.78105 0 4.33333 0C4.88562 0 5.33333 0.447715 5.33333 1ZM7.66667 2C8.21895 2 8.66667 1.55228 8.66667 1C8.66667 0.447715 8.21895 0 7.66667 0C7.11438 0 6.66667 0.447715 6.66667 1C6.66667 1.55228 7.11438 2 7.66667 2Z"
        fill="white"
      />
    </svg>
  );
};
