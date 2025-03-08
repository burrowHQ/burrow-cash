import React, { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import SemiCircleProgressBar from "../../components/SemiCircleProgressBar/SemiCircleProgressBar";
import { useUserHealth } from "../../hooks/useUserHealth";
import { isMobileDevice } from "../../helpers/helpers";
import CustomButton from "../../components/CustomButton/CustomButton";
import { useRewards } from "../../hooks/useRewards";
import ModalHistoryInfo from "./modalHistoryInfo";
import { modalProps } from "../../interfaces/common";
import { DangerIcon, QuestionIcon, RecordsIcon } from "../../components/Icons/Icons";
import CustomTooltips from "../../components/CustomTooltips/CustomTooltips";
import { useUnreadLiquidation } from "../../hooks/hooks";
import { UserDailyRewards } from "../../components/Header/stats/rewards";
import { UserLiquidity } from "../../components/Header/stats/liquidity";
import { APY } from "../../components/Header/stats/apy";
import { ContentBox } from "../../components/ContentBox/ContentBox";
import { TagToolTip } from "../../components/ToolTip";
import ClaimRewardsModal from "../../components/Dashboard/claimRewardsModal";
import {
  MainDetailIconPc,
  MemeDetailIconPc,
  MainDetailIconMobile,
  MemeDetailIconMobile,
} from "../../components/Dashboard/icons";
import { UnclaimedRewardsTip, HealthFactorTip } from "../../components/Dashboard/stat";

const DashboardOverview = ({ suppliedRows, borrowedRows, memeCategory }) => {
  const [modal, setModal] = useState<modalProps>({
    name: "",
    data: null,
  });
  const [userHealthCur, setUserHealthCur] = useState<any>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = isMobileDevice();
  const userHealth = useUserHealth(memeCategory);
  const rewardsObj = useRewards(memeCategory);
  const { unreadLiquidation, fetchUnreadLiquidation } = useUnreadLiquidation({
    memeCategory,
  });
  const openModal = () => {
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchUnreadLiquidation().then();
  }, []);

  useEffect(() => {
    if (userHealth?.allHealths?.length && userHealth?.hasBorrow) {
      handleHealthClick(userHealth.allHealths[0]);
    } else {
      setUserHealthCur(null);
    }
  }, [JSON.stringify(userHealth)]);

  let totalSuppliedUSD = 0;
  suppliedRows?.forEach((d) => {
    const usd = Number(d.supplied) * Number(d.price);
    totalSuppliedUSD += usd;
  });

  let totalBorrowedUSD = 0;
  borrowedRows?.forEach((d) => {
    const usd = Number(d.borrowed) * Number(d.price);
    totalBorrowedUSD += usd;
  });

  const handleModalOpen = (modalName: string, modalData?: object) => {
    setModal({ name: modalName, data: modalData });
  };

  const handleModalClose = () => {
    setModal({
      name: "",
      data: null,
    });
  };

  const liquidationButton = (
    <CustomButton
      onClick={() => handleModalOpen("history", { tabIndex: 1 })}
      className="relative"
      color={unreadLiquidation?.count ? "secondary2" : "secondary"}
      size={isMobile ? "sm" : "md"}
    >
      {unreadLiquidation?.count ? (
        <span
          className="unread-count absolute rounded-full bg-pink-400 text-black"
          style={{ top: -8, right: -8 }}
        >
          {unreadLiquidation.count}
        </span>
      ) : null}
      Liquidation
    </CustomButton>
  );

  const recordsButton = (
    <div className="cursor-pointer" onClick={() => handleModalOpen("history", { tabIndex: 0 })}>
      <RecordsIcon />
    </div>
  );

  const handleHealthClick = (o) => {
    const valueLocale = o.healthFactor;
    setUserHealthCur({
      ...userHealth,
      id: o.id,
      healthFactor: valueLocale,
      data: {
        label: o.healthStatus,
        valueLabel: `${valueLocale}%`,
        valueLocale,
      },
    });
  };

  const hasMultiHealths = userHealth?.allHealths?.length > 1 && userHealth?.hasBorrow;
  return (
    <>
      <div className="flex gap-2 justify-between items-center mb-4 lg3:hidden">
        <div className="h2">{memeCategory ? "Meme Position" : "Mainstream"}</div>
        <div className="flex gap-2">
          {liquidationButton}
          {recordsButton}
        </div>
      </div>
      <ContentBox className="mb-8 relative">
        <div className="lg3:flex lg3:justify-between relative z-10 pb-10">
          <div className="mb-4 lg3:max-w-[640px] lg3:mb-0">
            <div className="flex gap-2 justify-between lg3:gap-6">
              <div className="gap-6 flex flex-col flex-2">
                <UserLiquidity memeCategory={memeCategory} />
                <UserDailyRewards memeCategory={memeCategory} />
              </div>

              <div className="gap-6 flex flex-col">
                <APY memeCategory={memeCategory} />
                <div className="flex flex-col">
                  <div className="h6 text-gray-300 flex items-center gap-1">
                    Unclaimed Rewards
                    <TagToolTip title={UnclaimedRewardsTip} />
                  </div>
                  <div className="items-start lg3:flex-row lg3:items-center lg3:gap-4">
                    <div className="flex items-center gap-4 my-1">
                      <div className="h2">{rewardsObj?.data?.totalUnClaimUSDDisplay || "$0"}</div>
                      <div className="flex w-full" style={{ marginRight: 5 }}>
                        {rewardsObj?.data?.array.map(({ data, tokenId }) => {
                          return (
                            <img
                              src={data?.icon}
                              key={tokenId}
                              alt="token"
                              className="rounded-full w-5 h-5 xsm:w-4 xsm:h-4 -ml-1.5"
                            />
                          );
                        })}
                      </div>
                    </div>

                    {rewardsObj?.data?.totalUnClaimUSD > 0 && (
                      <div className="mt-1 lg3:mt-0">
                        <div
                          className="flex items-center justify-center bg-primary rounded-3xl cursor-pointer text-sm font-bold text-dark-200 hover:opacity-80 w-20 h-8 xsm:h-[26px] mt-1.5"
                          onClick={openModal}
                        >
                          Claim
                        </div>
                        <ClaimRewardsModal
                          rewardsObj={rewardsObj}
                          isOpen={isModalOpen}
                          closeModal={closeModal}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center lg3:items-end lg3:gap-6 lg3:ml-10">
            <div className="items-center gap-2 hidden lg3:flex">
              {liquidationButton}
              {recordsButton}
            </div>

            <div className="relative flex flex-col xsm:items-center items-end gap-4 pr-[30px]">
              <HealthFactor userHealth={userHealthCur} />
              {hasMultiHealths ? (
                <div className="flex flex-col w-full">
                  {userHealth.allHealths.map((value: any) => {
                    const isActive = value.id === userHealthCur?.id;
                    const healthColor = {
                      good: "text-primary",
                      warning: "text-warning",
                      danger: "text-orange",
                    };

                    let tokensName = value?.type;
                    value?.metadata?.tokens?.forEach((d, i) => {
                      const isLast = i === value.metadata.tokens.length - 1;
                      if (i === 0) {
                        tokensName += ":";
                      }
                      tokensName += `${d.metadata.symbol}${!isLast ? "-" : ""}`;
                    });
                    return (
                      <div
                        key={value.id}
                        className="flex items-center gap-1.5 border border-gray-120 bg-dark-110 bg-opacity-90 rounded-full h-6 my-1 text-xs px-2.5 hover:border-primary cursor-pointer"
                        onClick={() => handleHealthClick(value)}
                      >
                        <span
                          className={`w-[6px] h-[6px] rounded-full ${
                            isActive ? "bg-primary" : "bg-dark-110"
                          }`}
                        />
                        <span className="text-gray-170">{tokensName}</span>
                        <span className={healthColor[value.healthStatus]}>
                          {value?.healthFactor}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {memeCategory ? (
          <>
            <MemeDetailIconPc className="absolute bottom-0 right-0 w-[245px] xsm:hidden" />
            <MemeDetailIconMobile className="absolute bottom-0 right-0 w-[245px] lg:hidden" />
          </>
        ) : (
          <>
            <MainDetailIconPc className="absolute bottom-0 right-0 w-[242px] xsm:hidden" />
            <MainDetailIconMobile className="absolute bottom-0 right-0 w-[242px] lg:hidden" />
          </>
        )}
      </ContentBox>

      <ModalHistoryInfo
        isOpen={modal?.name === "history"}
        onClose={handleModalClose}
        tab={modal?.data?.tabIndex}
      />
    </>
  );
};

const HealthFactor = ({ userHealth }) => {
  const { healthFactor, lowHealthFactor, dangerHealthFactor } = userHealth || {};
  const isDanger = healthFactor !== -1 && healthFactor < dangerHealthFactor;
  const isWarning = healthFactor !== -1 && healthFactor < lowHealthFactor;
  const healthFactorLabel = [-1, null, undefined].includes(healthFactor)
    ? "-%"
    : `${healthFactor}%`;
  const isMobile = isMobileDevice();

  let dangerTooltipStyles = {};
  let tooltipStyles = {};
  if (isMobile) {
    tooltipStyles = {
      left: -133,
    };
    dangerTooltipStyles = {
      width: 186,
      left: -103,
      bottom: "100%",
    };
  }

  return (
    <SemiCircleProgressBar
      value={healthFactor}
      dividerValue={100}
      dividerPercent={75}
      isWarning={isWarning}
    >
      <div className="absolute">
        <div
          className={twMerge(
            "h2b text-primary",
            isWarning && "text-warning",
            isDanger && "text-orange flex gap-2 items-center",
          )}
        >
          {isDanger && (
            <CustomTooltips
              alwaysShow
              style={dangerTooltipStyles}
              text={`Your health factor is dangerously low and you're at risk of liquidation`}
              width={186}
            >
              <DangerIcon />
            </CustomTooltips>
          )}
          {healthFactorLabel}
        </div>
        <div className="h5 text-gray-300 flex gap-1 items-center justify-center">
          Health Factor
          <div style={{ marginRight: -5 }} className="relative">
            <CustomTooltips style={tooltipStyles} text={HealthFactorTip}>
              <QuestionIcon />
            </CustomTooltips>
          </div>
        </div>
      </div>
    </SemiCircleProgressBar>
  );
};

export default DashboardOverview;
