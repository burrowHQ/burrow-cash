import Decimal from "decimal.js";
import { createContext, useContext } from "react";
import { toInternationalCurrencySystem_usd, formatWithCommas_usd } from "../../utils/uiNumber";
import { useProtocolNetLiquidity } from "../../hooks/useNetLiquidity";
import { useRewards } from "../../hooks/useRewards";
import { isMobileDevice } from "../../helpers/helpers";

const MarketOverviewData = createContext(null) as any;
function MarketsOverview() {
  const { protocolBorrowed, protocolDeposited, protocolNetLiquidity } = useProtocolNetLiquidity();
  const { tokenNetBalanceRewards } = useRewards();
  const sumRewards = (acc, r) => acc + r.dailyAmount * r.price;
  const amount = tokenNetBalanceRewards.reduce(sumRewards, 0);
  const isMobile = isMobileDevice();
  return (
    <MarketOverviewData.Provider
      value={{
        protocolBorrowed,
        protocolDeposited,
        protocolNetLiquidity,
        amount,
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
    <div className="flex items-center w-full h-[100px] border border-dark-50 bg-gray-800 rounded-xl mb-5 px-5">
      <span className="text-[26px] text-primary col-span-2 mr-20 xl:mr-40">Markets</span>
      <div className="grid grid-cols-4 items-center justify-items-center flex-grow">
        <div className="flex flex-col items-center col-span-1">
          <span className="text-sm text-gray-300">Total Supplied</span>
          <span className="text-white font-bold text-[26px]">
            {toInternationalCurrencySystem_usd(protocolDeposited)}
          </span>
        </div>
        <div className="flex flex-col items-center col-span-1">
          <span className="text-sm text-gray-300">Total Borrowed</span>
          <span className="text-white font-bold text-[26px]">
            {toInternationalCurrencySystem_usd(protocolBorrowed)}
          </span>
        </div>
        <div className="flex flex-col items-center col-span-1">
          <span className="text-sm text-gray-300">Available Liquidity</span>
          <span className="text-white font-bold text-[26px]">
            {toInternationalCurrencySystem_usd(protocolNetLiquidity)}
          </span>
        </div>
        <div className="flex flex-col items-center col-span-1">
          <span className="text-sm text-gray-300">Daily Rewards</span>
          <span className="text-white font-bold text-[26px]">{formatWithCommas_usd(amount)}</span>
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
    <div className="w-full px-4 pb-5 border-b border-dark-950">
      <div className="text-xl font-bold text-white mb-6">Markets</div>
      <div className="grid grid-cols-2 gap-y-5">
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
