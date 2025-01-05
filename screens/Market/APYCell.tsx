import { useState } from "react";
import Decimal from "decimal.js";
import { Box, Typography, Stack, useTheme } from "@mui/material";
import { useRouter } from "next/router";
import HtmlTooltip from "../../components/common/html-tooltip";
import TokenIcon from "../../components/TokenIcon";
import { useExtraAPY } from "../../hooks/useExtraAPY";
import { useAPY } from "../../hooks/useAPY";
import { format_apy } from "../../utils/uiNumber";
import { standardizeAsset } from "../../utils/index";
import { getAssetsCategory } from "../../redux/assetsSelectors";
import { useAppSelector } from "../../redux/hooks";
import { getProtocolRewards } from "../../redux/selectors/getProtocolRewards";

export const APYCell = ({
  baseAPY,
  rewards,
  page,
  tokenId,
  isStaking = false,
  onlyMarket = false,
  excludeNetApy = false,
  memeCategory,
}: {
  memeCategory?: boolean;
} & Record<string, any>) => {
  // Filter out the ones rewards sent out
  const list = rewards.filter((reward) => reward.rewards.remaining_rewards !== "0");
  const isBorrow = page === "borrow";
  const [boostedAPY, stakeBoostedAPY] = useAPY({
    baseAPY,
    rewards: list,
    tokenId,
    page,
    onlyMarket,
    excludeNetApy,
    memeCategory,
  });
  const stakeBooster = new Decimal(stakeBoostedAPY).gt(boostedAPY);
  return (
    <ToolTip
      tokenId={tokenId}
      list={list}
      baseAPY={baseAPY}
      isBorrow={isBorrow}
      isStaking={isStaking}
      onlyMarket={onlyMarket}
      excludeNetApy={excludeNetApy}
      memeCategory={memeCategory}
    >
      <span
        className={`border-b border-dashed border-dark-800 pb-0.5 whitespace-nowrap ${
          stakeBooster ? "text-primary" : ""
        }`}
      >
        {format_apy(boostedAPY)} {stakeBooster ? `~ ${format_apy(stakeBoostedAPY)}` : ""}
      </span>
    </ToolTip>
  );
};

const ToolTip = ({
  children,
  tokenId,
  list,
  baseAPY,
  isBorrow,
  isStaking,
  onlyMarket,
  excludeNetApy,
  memeCategory,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const assets = useAppSelector(getAssetsCategory());
  const router = useRouter();
  // suppose only one reward
  const netTvlFarmTokenId = (Object.keys(assets?.netTvlFarm || {}) || [])[0];
  const {
    computeRewardAPY,
    computeStakingRewardAPY,
    netLiquidityAPY,
    netTvlMultiplier,
    computeTokenNetRewardAPY,
  } = useExtraAPY({
    tokenId,
    isBorrow,
    onlyMarket,
    memeCategory,
  });
  const netTvlRewards = useAppSelector(getProtocolRewards());
  function getNetTvlFarmRewardIcon() {
    const asset = assets.data[netTvlFarmTokenId];
    const icon = asset?.metadata?.icon;
    return icon;
  }
  const assetMetadata = standardizeAsset(
    JSON.parse(JSON.stringify(assets?.data?.[tokenId]?.metadata || {})),
  );
  const { apy, tokenNetRewards } = computeTokenNetRewardAPY();
  return (
    <HtmlTooltip
      open={showTooltip}
      onOpen={() => setShowTooltip(true)}
      onClose={() => setShowTooltip(false)}
      title={
        <Box display="grid" gridTemplateColumns="1fr 1fr" alignItems="center" gap={1}>
          <Typography fontSize="0.75rem">Base APY</Typography>
          <Typography fontSize="0.75rem" color="#fff" textAlign="right">
            {format_apy(baseAPY)}
          </Typography>
          {!isBorrow &&
            !excludeNetApy &&
            netTvlRewards?.length > 0 && [
              <Typography fontSize="0.75rem" key={0}>
                Net Liquidity APY
              </Typography>,
              <Typography fontSize="0.75rem" color="#fff" textAlign="right" key={1}>
                <div className="flex items-center justify-end gap-1.5">
                  <img className="w-4 h-4 rounded-full" alt="" src={getNetTvlFarmRewardIcon()} />
                  {format_apy(netLiquidityAPY * netTvlMultiplier)}
                </div>
              </Typography>,
            ]}
          {!isBorrow && tokenNetRewards.length > 0
            ? [
                <Typography fontSize="0.75rem" key={6}>
                  <span className="whitespace-nowrap">
                    {assetMetadata?.symbol} Net Liquidity Reward APY
                  </span>
                </Typography>,
                <Typography fontSize="0.75rem" color="#fff" textAlign="right" key={7}>
                  <div className="flex items-center justify-end gap-1.5 break-all">
                    <div className="flex items-center flex-shrink-0">
                      {tokenNetRewards.map((reward, index) => {
                        return (
                          <img
                            key={reward.token_id}
                            className={`w-4 h-4 rounded-full flex-shrink-0 ${
                              index > 0 ? "-ml-1.5" : ""
                            }`}
                            alt=""
                            src={reward.icon}
                          />
                        );
                      })}
                    </div>
                    {format_apy(apy)} ~ {format_apy(Number(apy || 0) * 1.5)}
                  </div>
                </Typography>,
                <div className="flex items-center whitespace-nowrap gap-1 text-xs" key={8}>
                  Max Boost <span className="text-white font-extrabold">1.5X</span> by{" "}
                  <span
                    className="text-xs text-primary underline cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/staking");
                    }}
                  >
                    staking BRRR🔥
                  </span>
                </div>,
              ]
            : null}
          {list.map(({ rewards, metadata, price, config }) => {
            const { symbol, icon } = metadata;
            const rewardAPY = computeRewardAPY({
              rewardTokenId: metadata.token_id,
              rewardData: rewards,
            });

            const stakingRewardAPY = computeStakingRewardAPY(metadata.token_id);

            return [
              <Stack key={1} direction="row" alignItems="center" spacing={1}>
                <TokenIcon width={16} height={16} icon={icon} />
                <Typography fontSize="0.75rem" color="#fff" whiteSpace="nowrap">
                  {symbol}
                </Typography>
              </Stack>,
              <Typography fontSize="0.75rem" key={2} color="#fff" textAlign="right">
                {isBorrow ? "-" : ""}
                {format_apy(isStaking ? stakingRewardAPY : rewardAPY)}
              </Typography>,
            ];
          })}
        </Box>
      }
    >
      <span
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
      >
        {children}
      </span>
    </HtmlTooltip>
  );
};

export default APYCell;
