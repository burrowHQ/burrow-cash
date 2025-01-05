import { useState } from "react";
import HtmlTooltip from "../common/html-tooltip";
import { Star } from "./svg";
import { isMemeCategory } from "../../redux/categorySelectors";
import { useAppSelector } from "../../redux/hooks";

export default function CollateralTypeName({ children }) {
  const [showTooltip, setShowTooltip] = useState(localStorage.getItem("COLLATERAL_TYPE") !== "1");
  const isMeme = useAppSelector(isMemeCategory);
  function close() {
    localStorage.setItem("COLLATERAL_TYPE", "1");
    setShowTooltip(false);
  }
  return (
    <HtmlTooltip
      open={showTooltip}
      onOpen={() => setShowTooltip(true)}
      onClose={close}
      title={
        isMeme ? (
          ""
        ) : (
          <div className="flex items-start gap-1 text-sm text-gray-1200 w-40">
            <Star className="relative top-1 flex-shrink-0" />
            <span>Try different collateral positions.</span>
          </div>
        )
      }
    >
      <span
        // onClick={(e) => {
        //   e.stopPropagation();
        //   setShowTooltip(!showTooltip);
        // }}
        className="flex items-center"
      >
        {children}
      </span>
    </HtmlTooltip>
  );
}
