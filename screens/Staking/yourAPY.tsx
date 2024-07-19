import React, { useState } from "react";
import HtmlTooltip from "../../components/common/html-tooltip";
import { useAppSelector } from "../../redux/hooks";
import { getYourNetAPY } from "../../redux/selectors/getNetAPY";
import { formatAPYValue } from "../../helpers/helpers";

const YourAPYCell = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const yourAPY: any = useAppSelector(getYourNetAPY());
  const { baseAPY, tokenNetAPY, totalAPY } = yourAPY;
  return (
    <HtmlTooltip
      open={showTooltip}
      placement="top"
      onOpen={() => setShowTooltip(true)}
      onClose={() => setShowTooltip(false)}
      title={
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-10">
            <span>Base APY</span>
            <span className="text-white"> {`${formatAPYValue(baseAPY || 0)}%`}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Net APY</span>
            <span className="text-white">{`${formatAPYValue(tokenNetAPY || 0)}%`}</span>
          </div>
        </div>
      }
    >
      <span
        className="text-primary border-b border-dashed"
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
      >
        {`${formatAPYValue(totalAPY || 0)}%`}
      </span>
    </HtmlTooltip>
  );
};
export default YourAPYCell;
