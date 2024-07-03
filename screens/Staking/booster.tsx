import React, { useState } from "react";
import Decimal from "decimal.js";
import { useAppSelector } from "../../redux/hooks";
import { getAccountBoostRatioData } from "../../redux/selectors/getAccountRewards";
import HtmlTooltip from "../../components/common/html-tooltip";
import { toPrecision } from "../../utils/number";

const Booster = () => {
  const [BRRR, amount, multiplier] = useAppSelector(getAccountBoostRatioData);
  const displayBRRR = toPrecision(new Decimal(BRRR || 0).toFixed(), 4, false, false);
  const displayAmount = toPrecision(new Decimal(amount || 0).toFixed(), 4, false, false);
  const displayMultiplier = toPrecision(new Decimal(multiplier || 0).toFixed(), 4, false, false);
  return (
    <div className="bg-gray-500 rounded-md p-4 -mt-8 mb-8">
      <div className="flex items-center justify-between">
        <span className="text-gray-300 text-sm">Stake</span>
        <Tip BRRR={displayBRRR} amount={displayAmount}>
          <div className="flex items-center border-b border-dashed border-white text-sm gap-1">
            <span className="text-white">{displayAmount}</span>
            <span className="text-gray-300">+ {displayBRRR}</span>
          </div>
        </Tip>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-gray-300 text-sm">Boost Ratio</span>
        <span className="text-sm text-primary">{displayMultiplier}</span>
      </div>
    </div>
  );
};
function Tip({ children, BRRR, amount }) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <HtmlTooltip
      open={showTooltip}
      onOpen={() => setShowTooltip(true)}
      onClose={() => setShowTooltip(false)}
      title={
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between gap-10">
            <span className="text-gray-300">Stake</span>
            <span className="text-white">{amount || 0}</span>
          </div>
          <div className="flex items-center justify-between gap-10">
            <span className="text-gray-300">Staked</span>
            <span className="text-white">{BRRR || 0}</span>
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
        {children}
      </span>
    </HtmlTooltip>
  );
}
export default Booster;
