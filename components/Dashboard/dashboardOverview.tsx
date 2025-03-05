import { useState, createContext, useContext } from "react";
import Decimal from "decimal.js";
import { useRouter } from "next/router";
import {
  StatsRegular,
  NetAPYTip,
  NetLiquidityTip,
  DailyRewardsTip,
  UnclaimedRewardsTip,
  HealthFactorTip,
} from "./stat";
import { useAppSelector } from "../../redux/hooks";
import { getTotalAccountBalance } from "../../redux/selectors/getTotalAccountBalance";
import { beautifyPrice } from "../../utils/beautyNumber";
import { useUserHealth } from "../../hooks/useUserHealth";
import { APY_FORMAT } from "../../store";
import { useDailyRewards, useRewards } from "../../hooks/useRewards";
import { IconMore } from "../Header/stats/rewards";
import ClaimRewardsModal from "./claimRewardsModal";
import { usePortfolioAssets } from "../../hooks/hooks";
import { ThreeDotIcon } from "../Icons/IconsV2";
import { TagToolTip } from "../ToolTip";
import { MainAssetsIcon, MemeAssetsIcon } from "./icons";
import { isMobileDevice } from "../../helpers/helpers";

const ICONLENGTH = 4;
const DashboardOverviewContext = createContext(null) as any;
export default function DashboardOverview({ memeCategory }: { memeCategory: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = isMobileDevice();
  const router = useRouter();
  const closeModal = () => {
    setIsModalOpen(false);
  };
  const openModal = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };
  // net Liquidity
  const userDeposited = useAppSelector(getTotalAccountBalance("supplied", memeCategory));
  const userBorrowed = useAppSelector(getTotalAccountBalance("borrowed", memeCategory));
  const userNetLiquidity = new Decimal(userDeposited).minus(userBorrowed).toNumber();
  const userNetLiquidityValue = userNetLiquidity > 0 ? beautifyPrice(userNetLiquidity, true) : `$0`;

  // net apy + health factor
  const { netAPY, netLiquidityAPY, allHealths } = useUserHealth(memeCategory);
  const totalApyMain = netAPY + netLiquidityAPY;
  const amountMain = `${totalApyMain.toLocaleString(undefined, APY_FORMAT)}%`;

  // Daily Rewards
  const { totalUsdDaily, allRewards } = useDailyRewards(memeCategory);
  const dailyRewards = (
    <div className="flex items-center gap-1">
      {totalUsdDaily > 0 ? beautifyPrice(totalUsdDaily, true) : "$0"}
      {isMobile ? null : <IconMore allRewards={allRewards} />}
    </div>
  );
  // Unclaimed Rewards
  const rewardsObj = useRewards(memeCategory);
  const rewards = (
    <div className="flex xsm:flex-col xsm:items-start xsm:gap-2 items-center gap-4 my-1 relative z-10">
      <div className="h2">{rewardsObj?.data?.totalUnClaimUSDDisplay || "$0"}</div>
      <div className="flex items-center xsm:hidden">
        {rewardsObj?.data?.array.map(({ data, tokenId }) => {
          return (
            <img
              src={data?.icon}
              key={tokenId}
              alt="token"
              className="rounded-full w-5 h-5 flex-shrink-0"
            />
          );
        })}
      </div>
      {rewardsObj?.data?.totalUnClaimUSD > 0 ? (
        <span
          onClick={openModal}
          className="flex items-center justify-center w-[80px] h-8 xsm:h-[26px] rounded-full text-sm text-dark-130 bg-primary cursor-pointer"
        >
          Claim
        </span>
      ) : null}
    </div>
  );
  // supplied、borrowed
  const [suppliedRows, , totalSuppliedUSD, totalBorrowedUSD, , borrowedRows] =
    usePortfolioAssets(memeCategory);

  function jump(e) {
    router.push(`/dashboardDetail?pageType=${memeCategory ? "meme" : "main"}`);
  }
  return (
    <DashboardOverviewContext.Provider
      value={{
        memeCategory,
        jump,
        userNetLiquidityValue,
        amountMain,
        dailyRewards,
        rewards,
        suppliedRows,
        totalSuppliedUSD,
        borrowedRows,
        totalBorrowedUSD,
        allHealths,
        rewardsObj,
        isModalOpen,
        closeModal,
      }}
    >
      {isMobile ? <DashboardOverviewMobile /> : <DashboardOverviewPc />}
    </DashboardOverviewContext.Provider>
  );
}

function DashboardOverviewPc() {
  const {
    memeCategory,
    jump,
    userNetLiquidityValue,
    amountMain,
    dailyRewards,
    rewards,
    suppliedRows,
    totalSuppliedUSD,
    borrowedRows,
    totalBorrowedUSD,
    allHealths,
    rewardsObj,
    isModalOpen,
    closeModal,
  } = useContext(DashboardOverviewContext) as any;
  return (
    <div className="mb-[50px]">
      <div className="flex items-center justify-between">
        <span className="text-lg text-gray-140">
          {memeCategory ? "Meme Position" : "Mainstream"}
        </span>
        <span className="text-sm text-primary underline cursor-pointer" onClick={jump}>
          Position Detail
        </span>
      </div>
      <div className="relative grid grid-cols-4 bg-dark-110 rounded-xl border border-dark-50 px-[30px] py-6 mt-4 hover:border-primary">
        <StatsRegular title="Net Liquidity" value={userNetLiquidityValue} tip={NetLiquidityTip} />
        <StatsRegular title="Net APY" value={amountMain} tip={NetAPYTip} />
        <StatsRegular title="Daily Rewards" value={dailyRewards} tip={DailyRewardsTip} />
        <StatsRegular title="Unclaimed Rewards" value={rewards} tip={UnclaimedRewardsTip} />
        {memeCategory ? (
          <MemeAssetsIcon className="absolute bottom-0 right-0" />
        ) : (
          <MainAssetsIcon className="absolute bottom-0 right-0" />
        )}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <div className="flex items-center gap-1.5 rounded-full h-[28px] p-1 px-2 bg-white bg-opacity-10">
          <div className="flex items-center">
            {((suppliedRows || []) as any[]).slice(0, ICONLENGTH).map((item, index) => {
              return (
                <img
                  key={item.tokenId}
                  src={item.metadata.icon}
                  alt=""
                  className={`w-5 h-5 border border-black rounded-full ${
                    index !== 0 ? "-ml-1.5" : ""
                  }`}
                />
              );
            })}
            {((suppliedRows || []) as any[]).length > ICONLENGTH ? (
              <div className="w-5 h-5 rounded-full border border-black bg-gray-150 flex items-center justify-center -ml-2.5 z-50">
                <ThreeDotIcon />
              </div>
            ) : null}
          </div>
          <span className="text-sm text-white text-opacity-30">Supplied</span>
          <span className="text-sm text-primary">
            {Number(totalSuppliedUSD || 0) > 0
              ? beautifyPrice(totalSuppliedUSD as string, true)
              : "$0"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full h-[28px] p-1 px-2 bg-white bg-opacity-10">
          <div className="flex items-center">
            {((borrowedRows || []) as any[]).slice(0, ICONLENGTH).map((item, index) => {
              return (
                <img
                  key={item.tokenId}
                  src={item.metadata.icon}
                  alt=""
                  className={`w-5 h-5 border border-black rounded-full ${
                    index !== 0 ? "-ml-1.5" : ""
                  }`}
                />
              );
            })}
            {((borrowedRows || []) as any[]).length > ICONLENGTH ? (
              <div className="w-5 h-5 rounded-full border border-black bg-gray-150 flex items-center justify-center -ml-2.5 z-50">
                <ThreeDotIcon />
              </div>
            ) : null}
          </div>
          <span className="text-sm text-white text-opacity-30">Borrowed</span>
          <span className="text-sm text-orange">
            {Number(totalBorrowedUSD || 0) > 0
              ? beautifyPrice(totalBorrowedUSD as string, true)
              : "$0"}
          </span>
        </div>
        {allHealths.map((Health) => {
          const healthColor = {
            good: "text-primary",
            warning: "text-warning",
            danger: "text-orange",
          };
          return (
            <div
              key={Health.positionId}
              className="flex items-center gap-1.5 rounded-full h-[28px] p-1 px-2 bg-white bg-opacity-10"
            >
              <TagToolTip title={HealthFactorTip} />
              <span className="text-sm text-white text-opacity-30">Health Factor</span>
              <span
                className={`text-sm ${healthColor[Health.healthStatus]}`}
              >{`${Health?.healthFactor}%`}</span>
              {Health.type == "LP" ? <span className="text-xs text-primary">(LP)</span> : null}
            </div>
          );
        })}
      </div>
      <ClaimRewardsModal rewardsObj={rewardsObj} isOpen={isModalOpen} closeModal={closeModal} />
    </div>
  );
}
function DashboardOverviewMobile() {
  const {
    jump,
    userNetLiquidityValue,
    amountMain,
    dailyRewards,
    rewards,
    rewardsObj,
    isModalOpen,
    closeModal,
    memeCategory,
  } = useContext(DashboardOverviewContext) as any;
  return (
    <div className="px-4">
      <div className="text-white text-xl mb-4">{memeCategory ? "Meme Position" : "Mainstream"}</div>
      <div
        className="grid grid-cols-2 gap-5  border border-dark-50 bg-dark-110 rounded-xl p-3.5 mb-4"
        onClick={jump}
      >
        <StatsRegular title="Net Liquidity" value={userNetLiquidityValue} tip={NetLiquidityTip} />
        <StatsRegular title="Net APY" value={amountMain} tip={NetAPYTip} />
        <StatsRegular title="Daily Rewards" value={dailyRewards} tip={DailyRewardsTip} />
        <StatsRegular title="Unclaimed Rewards" value={rewards} tip={UnclaimedRewardsTip} />
      </div>
      <ClaimRewardsModal rewardsObj={rewardsObj} isOpen={isModalOpen} closeModal={closeModal} />
    </div>
  );
}
