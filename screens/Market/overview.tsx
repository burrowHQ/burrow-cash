import Decimal from "decimal.js";
import { createContext, useContext } from "react";
import { toInternationalCurrencySystem_usd, formatWithCommas_usd } from "../../utils/uiNumber";
import { useProtocolNetLiquidity } from "../../hooks/useNetLiquidity";
import { useRewards } from "../../hooks/useRewards";
import { isMobileDevice } from "../../helpers/helpers";
import { MarketBg, MarketMobileBg, MarketTextIcon } from "./svg";

const MarketOverviewData = createContext(null) as any;
function MarketsOverview() {
  // main
  const { protocolBorrowed, protocolDeposited, protocolNetLiquidity } = useProtocolNetLiquidity(
    false,
    false,
  );
  const { tokenNetBalanceRewards } = useRewards(false);
  // meme
  const {
    protocolBorrowed: protocolBorrowedMEME,
    protocolDeposited: protocolDepositedMEME,
    protocolNetLiquidity: protocolNetLiquidityMEME,
  } = useProtocolNetLiquidity(false, true);
  const { tokenNetBalanceRewards: tokenNetBalanceRewardsMEME } = useRewards(true);
  const sumRewards = (acc, r) => acc + r.dailyAmount * r.price;
  const amount = tokenNetBalanceRewards.reduce(sumRewards, 0);
  const amountMEME = tokenNetBalanceRewardsMEME.reduce(sumRewards, 0);
  const isMobile = isMobileDevice();
  return (
    <MarketOverviewData.Provider
      value={{
        protocolBorrowed: new Decimal(protocolBorrowed || 0)
          .plus(protocolBorrowedMEME || 0)
          .toFixed(),
        protocolDeposited: new Decimal(protocolDeposited || 0)
          .plus(protocolDepositedMEME || 0)
          .toFixed(),
        protocolNetLiquidity: new Decimal(protocolNetLiquidity || 0).plus(
          protocolNetLiquidityMEME || 0,
        ),
        amount: new Decimal(amount || 0).plus(amountMEME || 0),
      }}
    >
      {isMobile ? <MarketsOverviewMobile /> : <MarketsOverviewPc />}
    </MarketOverviewData.Provider>
  );
}

function MarketsOverviewPc() {
  const { protocolBorrowed, protocolDeposited, protocolNetLiquidity, amount } = useContext(
    MarketOverviewData,
  ) as any;
  return (
    <div className="relative flex items-center w-full h-[100px] border border-primary rounded-3xl overflow-hidden">
      {/* bg */}
      <MarketBg className="absolute w-full h-full" />
      {/* content */}
      <div className="flex items-center pl-7 pr-5 z-10 w-full">
        <MarketTextIcon className="mr-20" />
        <div className="grid grid-cols-4 items-center justify-items-center flex-grow">
          <div className="flex flex-col col-span-1">
            <span className="text-sm text-gray-300">Total Supplied</span>
            <span className="text-white font-bold text-[26px]">
              {toInternationalCurrencySystem_usd(protocolDeposited)}
            </span>
          </div>
          <div className="flex flex-col col-span-1">
            <span className="text-sm text-gray-300">Total Borrowed</span>
            <span className="text-white font-bold text-[26px]">
              {toInternationalCurrencySystem_usd(protocolBorrowed)}
            </span>
          </div>
          <div className="flex flex-col col-span-1">
            <span className="text-sm text-gray-300">Available Liquidity</span>
            <span className="text-white font-bold text-[26px]">
              {toInternationalCurrencySystem_usd(protocolNetLiquidity)}
            </span>
          </div>
          <div className="flex flex-col col-span-1">
            <span className="text-sm text-gray-300">Daily Rewards</span>
            <span className="text-white font-bold text-[26px]">{formatWithCommas_usd(amount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
function MarketsOverviewMobile() {
  const { protocolBorrowed, protocolDeposited, protocolNetLiquidity, amount } = useContext(
    MarketOverviewData,
  ) as any;
  return (
    <div className="w-full px-4">
      <div className="text-xl font-bold text-white mb-4 pl-2">Markets</div>
      <div className="relative border border-primary rounded-2xl overflow-hidden">
        <MarketMobileBg className="absolute w-full h-full" />
        <div className="grid grid-cols-2 gap-y-5 relative z-10 p-4">
          <TemplateMobile
            title="Total Supplied"
            value={toInternationalCurrencySystem_usd(protocolDeposited)}
          />
          <TemplateMobile
            title="Total Borrowed"
            value={toInternationalCurrencySystem_usd(protocolBorrowed)}
          />
          <TemplateMobile
            title="Available Liquidity"
            value={toInternationalCurrencySystem_usd(protocolNetLiquidity)}
          />
          <TemplateMobile title="Daily Rewards" value={formatWithCommas_usd(amount)} />
        </div>
      </div>
    </div>
  );
}

function TemplateMobile({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-300 text-sm mb-1 whitespace-nowrap">{title}</span>
      <span className="flex text-2xl font-bold text-white  whitespace-nowrap">{value}</span>
    </div>
  );
}
export default MarketsOverview;
