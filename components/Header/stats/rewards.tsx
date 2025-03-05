// @ts-nocheck
import { useState } from "react";
import { useRewards, useDailyRewards } from "../../../hooks/useRewards";
import { TOKEN_FORMAT, USD_FORMAT, NUMBER_FORMAT } from "../../../store";
import CustomTooltips from "../../CustomTooltips/CustomTooltips";
import TokenIcon from "../../TokenIcon";
import { Stat } from "./components";
import HtmlTooltip from "../../common/html-tooltip";
import {
  toInternationalCurrencySystem_usd,
  toInternationalCurrencySystem_number,
} from "../../../utils/uiNumber";
import { ThreeDotIcon } from "../../Icons/IconsV2";
import { useAppSelector } from "../../../redux/hooks";
import { beautifyPrice } from "../../../utils/beautyNumber";
import { DailyRewardsTip } from "../../Dashboard/stat";

const transformAssetReward = (r, text) => ({
  value: r.dailyAmount.toLocaleString(undefined, TOKEN_FORMAT),
  tooltip: `${r.unclaimedAmount.toLocaleString(undefined, TOKEN_FORMAT)} unclaimed`,
  text: text || r.symbol,
  icon: r.icon,
});

const sumRewards = (acc, r) => acc + r.dailyAmount * r.price;

export const UserDailyRewards = ({ memeCategory }: { memeCategory?: boolean }) => {
  const {
    baseDepositUsdDaily,
    baseBorrowedUsdDaily,
    farmSuppliedUsdDaily,
    farmBorrowedUsdDaily,
    farmTokenNetUsdDaily,
    farmNetTvlUsdDaily,
    farmTotalUsdDaily,
    totalUsdDaily,
    allRewards,
  } = useDailyRewards(memeCategory);

  const rewardsLabels = [
    [
      {
        value: beautifyPrice(baseDepositUsdDaily, true),
        text: "Supply",
      },
    ],
    [
      {
        value: beautifyPrice(farmTotalUsdDaily, true),
        text: "Incentive",
      },
    ],
    [
      {
        type: "component",
        content: (
          <IncentiveMore
            farmSuppliedUsdDaily={farmSuppliedUsdDaily}
            farmBorrowedUsdDaily={farmBorrowedUsdDaily}
            farmNetTvlUsdDaily={farmNetTvlUsdDaily}
            farmTokenNetUsdDaily={farmTokenNetUsdDaily}
          />
        ),
      },
    ],
    [
      {
        value: (
          <span>
            -{baseBorrowedUsdDaily > 0 ? beautifyPrice(baseBorrowedUsdDaily, true) : "$0"}
          </span>
        ),
        text: "Borrow Interest",
      },
    ],
  ];
  return (
    <div className="relative">
      <Stat
        title="Daily Rewards"
        titleTooltip={DailyRewardsTip}
        amount={
          <div className="flex items-center gap-2">
            {totalUsdDaily > 0 ? beautifyPrice(totalUsdDaily, true) : "$0"}
            <IconMore allRewards={allRewards} />
          </div>
        }
        labels={totalUsdDaily !== 0 ? rewardsLabels : []}
      />
    </div>
  );
};

const transformProtocolReward = (r) => ({
  value: r.dailyAmount.toLocaleString(undefined, NUMBER_FORMAT),
  tooltip: `${r.remainingAmount.toLocaleString(undefined, TOKEN_FORMAT)} remaining`,
  text: r.symbol,
  icon: r.icon,
});

export const ProtocolDailyRewards = () => {
  const { protocol } = useRewards();

  const labels = protocol.map(transformProtocolReward);
  const amount = protocol.reduce(sumRewards, 0);

  return (
    <Stat
      title="Net Liquidity Daily Rewards"
      titleTooltip="Total protocol daily rewards from net liquidity"
      amount={amount.toLocaleString(undefined, USD_FORMAT)}
      labels={[labels]}
    />
  );
};

const IncentiveMore = ({
  farmSuppliedUsdDaily,
  farmBorrowedUsdDaily,
  farmNetTvlUsdDaily,
  farmTokenNetUsdDaily,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const empty =
    !farmSuppliedUsdDaily && !farmBorrowedUsdDaily && !farmNetTvlUsdDaily && !farmTokenNetUsdDaily;
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
              farmSuppliedUsdDaily ? "" : "hidden"
            }`}
          >
            <span className="text-gray-300 font-normal">Supply Incentive</span>
            <span className="text-white font-normal">
              {beautifyPrice(farmSuppliedUsdDaily, true)}
            </span>
          </div>
          <div
            className={`flex items-center justify-between text-xs gap-6 ${
              farmBorrowedUsdDaily ? "" : "hidden"
            }`}
          >
            <span className="text-gray-300 font-normal">Borrow Incentive</span>
            <span className="text-white font-normal">
              {beautifyPrice(farmBorrowedUsdDaily, true)}
            </span>
          </div>
          <div
            className={`flex items-center justify-between text-xs gap-6 ${
              farmNetTvlUsdDaily ? "" : "hidden"
            }`}
          >
            <span className="text-gray-300 font-normal">Net Liquidity</span>
            <span className="text-white font-normal">
              {beautifyPrice(farmNetTvlUsdDaily, true)}
            </span>
          </div>
          <div
            className={`flex items-center justify-between text-xs gap-6 ${
              farmTokenNetUsdDaily ? "" : "hidden"
            }`}
          >
            <span className="text-gray-300 font-normal">Net Liquidity</span>
            <span className="text-white font-normal">
              {beautifyPrice(farmTokenNetUsdDaily, true)}
            </span>
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
        <div className="w-[22px] h-[22px] rounded-3xl bg-white bg-opacity-10 flex items-center justify-center z-50 cursor-pointer mr-8">
          <svg
            width="12"
            height="4"
            viewBox="0 0 12 4"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.20005 1.9998C3.20005 2.66255 2.66279 3.1998 2.00005 3.1998C1.33731 3.1998 0.800049 2.66255 0.800049 1.9998C0.800049 1.33706 1.33731 0.799805 2.00005 0.799805C2.66279 0.799805 3.20005 1.33706 3.20005 1.9998ZM7.20005 1.9998C7.20005 2.66255 6.66279 3.1998 6.00005 3.1998C5.33731 3.1998 4.80005 2.66255 4.80005 1.9998C4.80005 1.33706 5.33731 0.799805 6.00005 0.799805C6.66279 0.799805 7.20005 1.33706 7.20005 1.9998ZM10 3.1998C10.6628 3.1998 11.2 2.66255 11.2 1.9998C11.2 1.33706 10.6628 0.799805 10 0.799805C9.33731 0.799805 8.80005 1.33706 8.80005 1.9998C8.80005 2.66255 9.33731 3.1998 10 3.1998Z"
              fill="#C0C4E9"
            />
          </svg>
        </div>
      </span>
    </HtmlTooltip>
  );
};

export const IconMore = ({ allRewards }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const list = Object.values(allRewards);
  return (
    <HtmlTooltip
      open={showTooltip}
      onOpen={() => setShowTooltip(true)}
      onClose={() => setShowTooltip(false)}
      title={
        <div className="flex flex-col gap-3">
          {list.map(({ amount, asset }: any) => {
            return (
              <div key={asset.token_id} className="flex items-center justify-between text-xs gap-6">
                <div className="flex items-center gap-1">
                  <img className="w-5 h-5 rounded-full" src={asset?.metadata?.icon} alt="" />
                  <span className="text-gray-300 font-normal">{asset?.metadata?.symbol}</span>
                </div>
                <span className="text-white font-normal">
                  {toInternationalCurrencySystem_number(amount)}
                </span>
              </div>
            );
          })}
        </div>
      }
    >
      <span
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
      >
        <IconsDisplay icons={list} />
      </span>
    </HtmlTooltip>
  );
};
const IconsDisplay = ({ icons }) => (
  <div className="flex">
    {icons.slice(0, 5).map((item, index) => (
      <img
        key={item?.asset?.token_id}
        src={item?.asset?.metadata?.icon}
        alt=""
        className="w-5 h-5 rounded-3xl border-2 border-dark-120"
        style={{
          marginLeft: icons.length > 1 && index > 0 ? `-8px` : undefined,
          zIndex: index + 1,
        }}
      />
    ))}
    {icons.length > 5 && (
      <div className="w-5 h-5 rounded-3xl border-2 border-dark-120 bg-gray-150 flex items-center justify-center -ml-2.5 z-50">
        <ThreeDotIcon />
      </div>
    )}
  </div>
);
