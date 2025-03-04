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
        content: <IncentiveAPY />,
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
const IncentiveAPY = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const userSupplyApy = useAppSelector(getAverageSupplyRewardApy());
  const userBorrowedApy = useAppSelector(getAverageBorrowedRewardApy());
  const userNetApy = useAppSelector(getAverageNetRewardApy());
  const userListTokenNetApy = useAppSelector(getListTokenNetRewardApy());
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
        <div className="w-[22px] h-[22px] rounded-3xl bg-dark-100 flex items-center justify-center z-50 cursor-pointer">
          <GiftIcon />
        </div>
      </span>
    </HtmlTooltip>
  );
};
const GiftIcon = () => {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.38442 1.55008C7.95577 0.141745 7.06202 2.27456 6.73025 3.33081V3.85893H7.98285C9.61462 3.85893 10.786 2.93133 9.38442 1.55008ZM5.024 3.85893H6.2766V3.32404C5.94483 2.26779 5.04431 0.141745 3.62244 1.55008C2.2141 2.93133 3.38546 3.85893 5.024 3.85893ZM6.22921 4.33289H1.62504C1.32712 4.33289 1.08337 4.57664 1.08337 4.87456C1.08337 5.17247 1.32712 5.41622 1.62504 5.41622H6.22921V4.33289ZM11.375 4.33289H6.77087V5.41622H11.375C11.673 5.41622 11.9167 5.17247 11.9167 4.87456C11.9167 4.57664 11.673 4.33289 11.375 4.33289Z"
        fill="#C0C4E9"
      />
      <path
        d="M1.625 5.95801V10.2913C1.625 10.8872 2.1125 11.3747 2.70833 11.3747H6.22917V5.95801H1.625ZM6.77083 5.95801V11.3747H10.2917C10.8875 11.3747 11.375 10.8872 11.375 10.2913V5.95801H6.77083Z"
        fill="#C0C4E9"
      />
    </svg>
  );
};
