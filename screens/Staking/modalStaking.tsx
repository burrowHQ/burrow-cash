import React, { useEffect, useMemo, useState } from "react";
import Decimal from "decimal.js";
import { DateTime } from "luxon";
import styled from "styled-components";
import RangeSlider, { MonthSlider } from "../../components/Modal/RangeSlider";
import { useAppSelector } from "../../redux/hooks";
import { getTotalBRRR } from "../../redux/selectors/getTotalBRRR";
import { useStaking } from "../../hooks/useStaking";
import { trackMaxStaking, trackStaking } from "../../utils/telemetry";
import { stake } from "../../store/actions/stake";
import CustomModal from "../../components/CustomModal/CustomModal";
import { APY_FORMAT, TOKEN_FORMAT } from "../../store";
import CustomButton from "../../components/CustomButton/CustomButton";
import { useRewards, useStakeRewardApy } from "../../hooks/useRewards";
import { ContentTipBox } from "../../components/ContentBox/ContentBox";
import { BrrrLogo } from "./components";
import { Alerts } from "../../components/Modal/components";
import Booster from "./booster";
import { format_apy } from "../../utils/uiNumber";

const ModalStaking = ({ isOpen, onClose }) => {
  const [total, totalUnclaim, totalToken] = useAppSelector(getTotalBRRR);
  const app = useAppSelector((state) => state.app);
  const [monthPercent, setMonthPercent] = useState(0);
  const [loadingStake, setLoadingStake] = useState(false);
  const {
    stakingTimestamp,
    amount,
    months,
    setAmount,
    setMonths,
    stakingNetAPY,
    stakingNetTvlAPY,
  } = useStaking();
  const [minMonth, maxMonth, monthList] = useMemo(() => {
    if (app?.config) {
      const { minimum_staking_duration_sec, maximum_staking_duration_sec } = app?.config || {};
      const min = minimum_staking_duration_sec / (30 * 24 * 60 * 60);
      const max = maximum_staking_duration_sec / (30 * 24 * 60 * 60);
      const arr: number[] = [];
      for (let i = min; i <= max; i++) {
        arr.push(i);
      }
      return [min, max, arr];
    }
    return [];
  }, [app]);
  const unstakeDate = DateTime.fromMillis(stakingTimestamp / 1e6);
  const selectedMonths = stakingTimestamp ? Math.round(unstakeDate.diffNow().as("months")) : months;
  const invalidAmount = +amount > +total;
  const invalidMonths = months === maxMonth ? false : months < selectedMonths;
  const disabledStake = !amount || invalidAmount || invalidMonths;
  const { avgStakeSupplyAPY, avgStakeBorrowAPY, avgStakeNetAPY, totalTokenNetMap } =
    useStakeRewardApy();

  const inputAmount = `${amount}`
    .replace(/[^0-9.-]/g, "")
    .replace(/(?!^)-/g, "")
    .replace(/^0+(\d)/gm, "$1");

  const sliderValue = Math.round((amount * 100) / Number(total)) || 0;

  const handleMaxClick = () => {
    trackMaxStaking({ total: totalToken });
    setAmount(totalToken);
  };

  const handleInputChange = (e) => {
    let { value } = e?.target || {};
    const numRegex = /^([0-9]*\.?[0-9]*$)/;
    if (!numRegex.test(value)) {
      e.preventDefault();
      return;
    }

    if (Number(value) > Number(total)) {
      value = total;
    }
    setAmount(value);
  };

  const handleSliderChange = (e) => {
    const { value: percent } = e.target;
    setAmount((Number(total) * percent) / 100);
  };

  const handleRangeSliderChange = (percent) => {
    if (Number(percent) >= 99.7) {
      setAmount(totalToken);
    } else {
      setAmount((Number(total) * percent) / 100);
    }
  };

  const handleMonthChange = (percent, v) => {
    setMonths(v);
    setMonthPercent(percent);
  };

  const handleMonthSliderChange = (v) => {
    setMonths(v);
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  const handleStake = async () => {
    try {
      setLoadingStake(true);
      trackStaking({ amount, months, percent: (amount / Number(total)) * 100 });
      await stake({ amount, months });
      setAmount(0);
      setLoadingStake(false);
      onClose();
    } catch (e) {
      console.error(e);
      setLoadingStake(false);
    }
  };

  const handleModalClose = () => {
    setMonths(1);
    setMonthPercent(0);
    setAmount(0);
    onClose();
  };
  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleModalClose}
      onOutsideClick={handleModalClose}
      className="modal-mobile-bottom"
      width={500}
      title="Stake BRRR"
    >
      <div className="px-2">
        <div className="flex justify-between mb-2">
          <span className="h5 text-gray-300">Available</span>
          <span className="h5 text-gray-300">{total.toLocaleString(undefined, TOKEN_FORMAT)}</span>
        </div>
        <StyledRow className="custom-input-wrap relative gap-2">
          <BrrrLogo color="#D2FF3A" />
          <input
            value={inputAmount}
            type="number"
            step="any"
            onChange={handleInputChange}
            className="noselect"
          />
          <div className="btn-sm cursor-pointer" onClick={handleMaxClick}>
            Max
          </div>
        </StyledRow>
        <StyledRow>
          <RangeSlider value={sliderValue} onChange={handleRangeSliderChange} />
          <br />
          <br />
        </StyledRow>

        <StyledRow>
          <div className="flex justify-between items-center mb-1">
            <div className="flex h5 text-gray-300">Duration</div>
            <div>{months} months</div>
          </div>

          <StyledRow>
            {minMonth && maxMonth ? (
              <MonthSlider
                min={minMonth}
                max={maxMonth}
                monthList={monthList}
                months={months}
                handleMonthChange={handleMonthSliderChange}
              />
            ) : null}
          </StyledRow>
          <br />
        </StyledRow>
        <Booster />
        <StyledRow>
          <div className="flex mb-4 items-center">
            <div className="mr-2">Reward</div>
            <div className="border-b border-solid flex-grow border-dark-700" />
          </div>
          <div className={`flex justify-between mb-4 ${avgStakeSupplyAPY > 0 ? "" : "hidden"}`}>
            <div className="h5 text-gray-300">Avg. Supply Reward APY</div>
            <div className="h5 text-primary">{format_apy(avgStakeSupplyAPY)}</div>
          </div>
          <div className={`flex justify-between mb-4 ${avgStakeBorrowAPY > 0 ? "" : "hidden"}`}>
            <div className="h5 text-gray-300">Avg. Borrow Reward APY</div>
            <div className="h5 text-primary">{format_apy(avgStakeBorrowAPY)}</div>
          </div>
          <div className={`flex justify-between mb-4 ${avgStakeNetAPY > 0 ? "" : "hidden"}`}>
            <div className="h5 text-gray-300">Avg. NetLiquidity Reward APY</div>
            <div className="h5 text-primary">{format_apy(avgStakeNetAPY)}</div>
          </div>
          {Object.values(totalTokenNetMap).map((tokenNetData) => {
            const { asset, totalTokenNetPrincipal, dailyRewardsUsd } = tokenNetData as any;
            const apy = new Decimal(totalTokenNetPrincipal).gt(0)
              ? new Decimal(dailyRewardsUsd).div(totalTokenNetPrincipal).mul(365).mul(100)
              : new Decimal("0");
            return (
              <div
                key={asset.token_id}
                className={`flex justify-between mb-4 ${apy.gt(0) ? "" : "hidden"}`}
              >
                <div className="h5 text-gray-300">
                  {asset.metadata.symbol} Net Liquidity Reward APY
                </div>
                <div className="h5 text-primary">{format_apy(apy.toFixed())}</div>
              </div>
            );
          })}
        </StyledRow>

        <CustomButton
          disabled={disabledStake}
          onClick={handleStake}
          isLoading={loadingStake}
          className="w-full mt-2 mb-4"
        >
          Stake
        </CustomButton>

        <div className="text-primary h5 mb-4 text-center">
          Staking duration applies to previously staked BRRR as well.
        </div>

        <div>
          {invalidAmount && (
            <Alerts
              data={{
                staking: {
                  title: "Amount must be lower than total BRRR earned",
                  severity: "error",
                },
              }}
              errorClassName="pb-3"
            />
          )}
          {invalidMonths && (
            <Alerts
              data={{
                staking: {
                  title:
                    "The new staking duration is shorter than the current remaining staking duration",
                  severity: "error",
                },
              }}
              errorClassName="pb-3"
            />
          )}
        </div>
      </div>
    </CustomModal>
  );
};

const StakingReward = () => {
  const { net, poolRewards } = useRewards();
  return (
    <>
      {net?.length ? (
        <div className="flex justify-between mb-4">
          <div className="h5 text-gray-300">Net Liquidity Rewards</div>
          <div className="flex flex-col gap-2 text-sm">
            {net.map(([tokenId, r]) => (
              <Reward key={tokenId} data={r} type="net" />
            ))}
          </div>
        </div>
      ) : null}

      {poolRewards?.length ? (
        <div className="flex justify-between mb-4">
          <div className="h5 text-gray-300">Asset Rewards</div>
          <div className="flex flex-col gap-2 text-sm">
            {poolRewards.map(([tokenId, r]) => (
              <Reward key={tokenId} data={r} />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};

const Reward = ({ data, type }: any) => {
  const { icon, dailyAmount, symbol, multiplier, newDailyAmount } = data || {};
  return (
    <div className="flex gap-2 items-center">
      <img src={icon} alt={symbol} width={20} height={20} className="rounded-full" />
      <StyledNewDailyAmount
        className={`border-b border-dashed border-claim ${
          type === "net" ? "text-claim" : "text-primary"
        }`}
        style={{ paddingBottom: 2 }}
      >
        {newDailyAmount.toLocaleString(undefined, TOKEN_FORMAT)}
        <div className="_hints text-gray-300">
          <ContentTipBox padding="4px 8px">
            <div className="flex items-center justify-between gap-5">
              <div className="whitespace-nowrap">Current Daily</div>
              <div>{dailyAmount?.toLocaleString(undefined, TOKEN_FORMAT)}</div>
            </div>
            <div className="flex items-center justify-between gap-5">
              <div className="whitespace-nowrap">Multiplier</div>
              <div>{multiplier?.toLocaleString(undefined, TOKEN_FORMAT)}</div>
            </div>
          </ContentTipBox>
        </div>
      </StyledNewDailyAmount>
    </div>
  );
};

const StyledNewDailyAmount = styled.div`
  position: relative;

  ._hints {
    display: none;
    position: absolute;
    left: 100%;
    margin-left: 5px;
    top: 50%;
    transform: translateY(-50%);
    @media (max-width: 767px) {
      left: auto;
      right: 100%;
      transform: translate(-40px, -50%);
    }
  }
  &:hover {
    ._hints {
      display: block;
    }
  }
`;

const StyledRow = styled.div`
  margin-bottom: 10px;
`;

export default ModalStaking;
