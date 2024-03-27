import { Link, Stack, Typography } from "@mui/material";

import { useEffect, useState } from "react";
import { Stat } from "./components";
import { useUserHealth } from "../../../hooks/useUserHealth";
import { useAverageAPY } from "../../../hooks/useAverageAPY";
import { APY_FORMAT, USD_FORMAT } from "../../../store";
import { useAppSelector } from "../../../redux/hooks";
import { getAverageSupplyRewardApy } from "../../../redux/selectors/getAverageSuppliedRewardApy";
import { getAverageBorrowedRewardApy } from "../../../redux/selectors/getAverageBorrowedRewardApy";
import { getAverageNetRewardApy } from "../../../redux/selectors/getAverageNetRewardApy";
import { useNonFarmedAssets } from "../../../hooks/hooks";
import HtmlTooltip from "../../common/html-tooltip";
import { format_apy } from "../../../utils/uiNumber";

export const APY = () => {
  const { netAPY, netLiquidityAPY, dailyReturns } = useUserHealth();
  const { weightedNetLiquidity, hasNegativeNetLiquidity, assets } = useNonFarmedAssets();
  const totalApy = netAPY + netLiquidityAPY;
  const amount = `${totalApy.toLocaleString(undefined, APY_FORMAT)}%`;
  const showLabels = netAPY > 0 || netLiquidityAPY > 0;
  const { averageSupplyApy, averageBorrowedApy } = useAverageAPY();
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
  const netLiquidityTooltip = hasNegativeNetLiquidity ? (
    <NotFarmingNetLiquidity assets={assets} liquidity={weightedNetLiquidity} />
  ) : undefined;
  const tooltip = `${dailyReturns.toLocaleString(undefined, USD_FORMAT)} / day`;

  return (
    <div className="relative">
      <div className="flex items-end">
        <Stat
          title="Net APY"
          titleTooltip="Net APY = Daily Total Profit / Your Net Liquidity * 365 days"
          amount={amount}
          tooltip={tooltip}
          labels={showLabels ? apyLabels : []}
        />
      </div>
    </div>
  );
};

const NotFarmingNetLiquidity = ({ assets, liquidity }) => (
  <Stack gap="1">
    <Typography fontSize="0.85rem">
      Your weighted net liquidity is <b>{liquidity.toLocaleString(undefined, USD_FORMAT)}</b> which
      is below 0.
    </Typography>
    <Typography fontSize="0.85rem">
      The following assets have the net liquidity coefficient below 1:
      <Stack gap={1} component="span" direction="row" display="inline-flex" ml={1}>
        {assets.map((asset) => (
          <span key={asset.token_id}>
            {asset.metadata.symbol} ({asset.config.net_tvl_multiplier / 10000})
          </span>
        ))}
      </Stack>
    </Typography>
    <Typography fontSize="0.85rem">
      In order to start farming the net liquidity rewards you need to have a positive balance.
    </Typography>
    <Typography fontSize="0.85rem">
      For more information about the net liquidity coefficients{" "}
      <Link
        href="https://burrowcash.medium.com/net-liquidity-farming-part-2-varied-coefficients-6b839ae2178b"
        target="_blank"
        color="#ACFFD1"
        fontWeight={500}
      >
        click here
      </Link>
    </Typography>
  </Stack>
);
const IncentiveAPY = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const userSupplyApy = useAppSelector(getAverageSupplyRewardApy());
  const userBorrowedApy = useAppSelector(getAverageBorrowedRewardApy());
  const userNetApy = useAppSelector(getAverageNetRewardApy());
  const empty = !userSupplyApy && !userBorrowedApy && !userNetApy;
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
