import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import millify from "millify";

import Decimal from "decimal.js";
import { PERCENT_DIGITS } from "../../store/constants";
import { formatRewardAmount, formatPortfolioRewardAmount } from "../Table/common/cells";
import { IReward } from "../../interfaces/asset";
import { shrinkToken } from "../../store/helper";
import { useFullDigits } from "../../hooks/useFullDigits";
import TokenIcon from "../TokenIcon";
import HtmlTooltip from "../common/html-tooltip";
import {
  useNetLiquidityRewards,
  useProRataNetLiquidityReward,
  useTokenNetLiquidityRewards,
} from "../../hooks/useRewards";
import { toInternationalCurrencySystem_usd } from "../../utils/uiNumber";
import { useAppSelector } from "../../redux/hooks";
import { getAssets } from "../../redux/assetsSelectors";
import { standardizeAsset } from "../../utils";
import { ThreeDotIcon } from "../Icons/IconsV2";

interface Props {
  rewards?: IReward[];
  layout?: "horizontal" | "vertical";
  fontWeight?: "normal" | "bold";
  page?: "deposit" | "borrow";
  tokenId: string;
}

const Rewards = ({ rewards: list = [], layout, fontWeight = "normal", page, tokenId }: Props) => {
  const { fullDigits } = useFullDigits();
  const isCompact = fullDigits?.table;
  const isHorizontalLayout = layout === "horizontal";
  const netLiquidityRewards = page === "deposit" ? useNetLiquidityRewards() : [];

  const restRewards = netLiquidityRewards.filter(
    (r) => !list.some((lr) => lr.metadata.symbol === r.metadata.symbol),
  );

  return (
    <RewardsTooltip
      hidden={!isHorizontalLayout}
      poolRewards={list}
      netLiquidityRewards={netLiquidityRewards}
      tokenId={tokenId}
    >
      <Stack
        spacing={0.75}
        direction={isHorizontalLayout ? "row" : "column"}
        justifyContent="flex-start"
      >
        {list.map(({ metadata, rewards, config }) => {
          const { symbol, icon, decimals } = metadata;
          const dailyRewards = shrinkToken(
            rewards.reward_per_day || 0,
            decimals + config.extra_decimals,
          );

          const amount = isCompact
            ? millify(Number(dailyRewards), { precision: PERCENT_DIGITS })
            : formatPortfolioRewardAmount(Number(dailyRewards));

          const iconSize = isHorizontalLayout ? 20 : 14;

          if (Number(dailyRewards) < 0.001) return null;

          return (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              justifyContent="flex-end"
              key={symbol}
            >
              {!isHorizontalLayout && (
                <Typography fontSize="0.75rem" fontWeight={fontWeight}>
                  {amount}
                </Typography>
              )}
              <Box height={iconSize}>
                <TokenIcon width={iconSize} height={iconSize} icon={icon} />
              </Box>
            </Stack>
          );
        })}
        {isHorizontalLayout &&
          restRewards.map(({ metadata: { symbol, icon } }) => (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              justifyContent="flex-end"
              key={symbol}
            >
              <Box height={20}>
                <TokenIcon width={20} height={20} icon={icon} />
              </Box>
            </Stack>
          ))}
      </Stack>
    </RewardsTooltip>
  );
};
const RewardsTooltip = ({ children, hidden, poolRewards, netLiquidityRewards, tokenId }) => {
  if (hidden) return children;
  const hasPoolRewards = poolRewards.length > 0;
  const hasNetLiquidityRewards = netLiquidityRewards.length > 0;
  return (
    <HtmlTooltip
      title={
        <Stack gap={1}>
          {hasPoolRewards && (
            <>
              <Typography fontSize="0.8rem" fontWeight={600}>
                Pool Rewards
              </Typography>
              <Box display="grid" gridTemplateColumns="1fr 1fr" alignItems="center" gap={1}>
                {poolRewards.map((r) => (
                  <Reward key={r.metadata.symbol} {...r} />
                ))}
              </Box>
            </>
          )}
          {hasNetLiquidityRewards && (
            <>
              <Typography fontSize="0.8rem" fontWeight={600}>
                Net Liquidity Rewards
              </Typography>
              <Box display="grid" gridTemplateColumns="1fr 1fr" alignItems="center" gap={1}>
                {netLiquidityRewards.map((r) => (
                  <Reward key={r.metadata.symbol} {...r} tokenId={tokenId} />
                ))}
              </Box>
            </>
          )}
        </Stack>
      }
    >
      {children}
    </HtmlTooltip>
  );
};
const Reward = ({ metadata, rewards, config, tokenId }) => {
  const { fullDigits } = useFullDigits();
  const isCompact = fullDigits?.table;
  const { symbol, icon, decimals } = metadata;
  const dailyRewards = shrinkToken(rewards.reward_per_day || 0, decimals + config.extra_decimals);
  const rewardAmount = useProRataNetLiquidityReward(tokenId, dailyRewards);

  const amount = isCompact
    ? millify(Number(rewardAmount), { precision: PERCENT_DIGITS })
    : formatRewardAmount(Number(rewardAmount));

  return (
    <>
      <Stack key={1} direction="row" alignItems="center" spacing={1}>
        <TokenIcon width={14} height={14} icon={icon} />
        <Typography fontSize="0.75rem">{symbol}</Typography>
      </Stack>
      <Typography key={2} fontSize="0.75rem" textAlign="right">
        {amount}
      </Typography>
    </>
  );
};
export const RewardsV2 = ({ rewards: list = [], layout, page, tokenId }: Props) => {
  const isHorizontalLayout = layout === "horizontal";
  const assets = useAppSelector(getAssets);
  const asset = assets.data[tokenId];
  const netLiquidityRewards = page === "deposit" ? useNetLiquidityRewards() : [];
  const tokenNetLiquidityRewards = page === "deposit" ? useTokenNetLiquidityRewards(tokenId) : [];
  const netReward = netLiquidityRewards[0];
  return (
    <RewardsTooltipV2
      hidden={!isHorizontalLayout}
      poolRewards={list}
      netLiquidityRewards={netReward}
      tokenNetLiquidityRewards={tokenNetLiquidityRewards}
      tokenId={tokenId}
      asset={asset}
    >
      <Stack>
        <TotalDailyRewardsUsd
          poolRewards={list}
          netLiquidityRewards={netReward}
          tokenNetLiquidityRewards={tokenNetLiquidityRewards}
          tokenId={tokenId}
        />
      </Stack>
    </RewardsTooltipV2>
  );
};
const RewardsTooltipV2 = ({
  children,
  hidden,
  poolRewards,
  netLiquidityRewards,
  tokenNetLiquidityRewards,
  tokenId,
  asset,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  if (hidden) return children;
  const hasPoolRewards = !!poolRewards?.length;
  const hasTokenetRewards = !!tokenNetLiquidityRewards?.length;
  const hasNetLiquidityRewards = !!netLiquidityRewards && asset?.config?.net_tvl_multiplier > 0;
  const isEmpty = !hasPoolRewards && !hasTokenetRewards && !hasNetLiquidityRewards;
  const assetMetadata = standardizeAsset(JSON.parse(JSON.stringify(asset?.metadata || {})));
  return (
    <HtmlTooltip
      title={
        isEmpty ? (
          ""
        ) : (
          <Stack gap={1}>
            {hasPoolRewards && (
              <div className="flex items-start justify-between gap-5">
                <span className="text-gray-300 text-xs">Pool</span>
                <Box className="flex items-center text-xs text-white">
                  <RewardV2List rewardsList={poolRewards} />
                </Box>
              </div>
            )}
            {hasNetLiquidityRewards && (
              <div className="flex items-center justify-between gap-5">
                <span className="text-gray-300 text-xs">Net Liquidity</span>
                <Box className="flex items-center text-xs text-white">
                  <RewardV2
                    key={netLiquidityRewards.metadata.symbol}
                    {...netLiquidityRewards}
                    tokenId={tokenId}
                  />
                </Box>
              </div>
            )}
            {hasTokenetRewards && (
              <div className="flex items-start justify-between gap-5">
                <span className="text-gray-300 text-xs">{assetMetadata?.symbol} Net Liquidity</span>
                <Box className="flex items-center text-xs text-white">
                  <RewardV2List rewardsList={tokenNetLiquidityRewards} />
                </Box>
              </div>
            )}
          </Stack>
        )
      }
      open={showTooltip}
      onOpen={() => setShowTooltip(true)}
      onClose={() => setShowTooltip(false)}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
      >
        {children}
      </div>
    </HtmlTooltip>
  );
};
const RewardV2 = ({ metadata, rewards, config, tokenId }) => {
  const { fullDigits } = useFullDigits();
  const isCompact = fullDigits?.table;
  const { token_id, icon, decimals } = metadata;
  const dailyRewards = shrinkToken(rewards.reward_per_day || 0, decimals + config.extra_decimals);
  const rewardAmount = useProRataNetLiquidityReward(tokenId, dailyRewards);

  const amount = isCompact
    ? millify(Number(rewardAmount), { precision: PERCENT_DIGITS })
    : formatRewardAmount(Number(rewardAmount));
  return (
    <div className="flex items-center gap-1">
      <Stack key={1} direction="row" alignItems="center" spacing={1}>
        <img className="w-4 h-4 rounded-full" alt="" src={icon} />
      </Stack>
      <Typography key={2} fontSize="0.75rem" textAlign="right">
        {amount}
      </Typography>
    </div>
  );
};
const RewardV2List = ({ rewardsList }) => {
  const rewardsDetailList = getRewardsDetailData(rewardsList);
  const { fullDigits } = useFullDigits();
  return (
    <div className="flex flex-col gap-1">
      {rewardsDetailList.map((reward) => {
        const isCompact = fullDigits?.table;
        const { rewardTokenId, metadata, dailyReward } = reward;
        const amount = isCompact
          ? millify(Number(dailyReward), { precision: PERCENT_DIGITS })
          : formatRewardAmount(Number(dailyReward));
        return (
          <div key={rewardTokenId} className="flex items-center gap-1">
            <Stack key={1} direction="row" alignItems="center" spacing={1}>
              <img className="w-4 h-4 rounded-full flex-shrink-0" alt="" src={metadata?.icon} />
            </Stack>
            <Typography key={2} fontSize="0.75rem" textAlign="right">
              {amount}
            </Typography>
          </div>
        );
      })}
    </div>
  );
};
const TotalDailyRewardsUsd = ({
  poolRewards,
  netLiquidityRewards,
  tokenNetLiquidityRewards,
  tokenId,
}) => {
  const rewardsMetadataMap = {};
  const poolRewardsDetailList = getRewardsDetailData(poolRewards);
  const tokennetRewardsDetailList = getRewardsDetailData(tokenNetLiquidityRewards);
  let netLiquidityDailyAmount = "0";
  if (netLiquidityRewards) {
    const { metadata, rewards, config } = netLiquidityRewards;
    const { decimals, token_id } = metadata;
    netLiquidityDailyAmount = shrinkToken(
      rewards.reward_per_day || 0,
      decimals + config.extra_decimals,
    );
    rewardsMetadataMap[token_id] = metadata;
  }
  const netLiquidityDailyRewardsForToken = useProRataNetLiquidityReward(
    tokenId,
    netLiquidityDailyAmount,
  );
  const net_total_usd = new Decimal(netLiquidityRewards?.price || 0).mul(
    netLiquidityDailyRewardsForToken || 0,
  );
  const pool_total_usd = poolRewardsDetailList.reduce((acc, cur) => {
    const t = acc.plus(cur.dailyRewardUsd);
    rewardsMetadataMap[cur.rewardTokenId] = cur.metadata;
    return t;
  }, new Decimal(0));
  const tokennet_total_usd = tokennetRewardsDetailList.reduce((acc, cur) => {
    const t = acc.plus(cur.dailyRewardUsd);
    rewardsMetadataMap[cur.rewardTokenId] = cur.metadata;
    return t;
  }, new Decimal(0));
  const total_usd = toInternationalCurrencySystem_usd(
    net_total_usd.plus(pool_total_usd).plus(tokennet_total_usd).toFixed(),
  );
  return (
    <div className="flex items-center gap-1.5 w-full">
      <div className="flex items-center">
        {Object.entries(rewardsMetadataMap).map(([token_id, tokenMetadata]: any, index) => {
          return (
            <img
              className={`w-4 h-4 rounded-full flex-shrink-0 ${index > 0 ? "-ml-1" : ""}`}
              key={token_id}
              src={tokenMetadata.icon}
              alt=""
            />
          );
        })}
        {Object.keys(rewardsMetadataMap).length > 4 ? (
          <div className="w-4 h-4 rounded-3xl bg-dark-100 flex items-center justify-center -ml-1 z-50">
            <ThreeDotIcon />
          </div>
        ) : null}
      </div>
      <span className="text-white text-lg xsm:text-sm">{total_usd}</span>
    </div>
  );
};
function getRewardsDetailData(rewardList) {
  const list = rewardList.map((cur) => {
    const { metadata, rewards, config, price } = cur;
    const { decimals, token_id } = metadata;
    const dailyReward = shrinkToken(rewards.reward_per_day || 0, decimals + config.extra_decimals);
    const dailyRewardUsd = new Decimal(dailyReward).mul(price).toFixed();
    return {
      rewardTokenId: token_id,
      metadata,
      dailyReward,
      dailyRewardUsd,
    };
  });
  return list;
}
export default Rewards;
