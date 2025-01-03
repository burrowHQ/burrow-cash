import React, { useState } from "react";
import HtmlTooltip from "../../components/common/html-tooltip";
import { UIAsset } from "../../interfaces";
import { DEFAULT_POSITION } from "../../utils/config";
import { digitalProcess } from "../../utils/uiNumber";
import { useAvailableAssets } from "../../hooks/hooks";

const AvailableBorrowCell = ({
  asset,
  borrowData,
}: {
  asset: UIAsset;
  borrowData: [string, number];
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const assets = useAvailableAssets();
  function getName(position) {
    if (position === DEFAULT_POSITION) return "Standard Token";
    const t = assets.find((a: UIAsset) => a.tokenId === position);
    const symbols = t?.tokens?.reduce(
      (acc, cur, index) =>
        acc + (cur.metadata?.symbol || "") + (index !== t.tokens.length - 1 ? "-" : ""),
      "",
    );
    return `LP token (${symbols})`;
  }
  return (
    <HtmlTooltip
      open={showTooltip}
      onOpen={() => setShowTooltip(true)}
      onClose={() => setShowTooltip(false)}
      title={
        <div className="flex flex-col" style={{ fontFamily: "work-sans" }}>
          <span className="text-xs text-gray-300">Collateral</span>
          <div>{getName(borrowData[0])}</div>
        </div>
      }
    >
      <div
        className="flex items-center"
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
      >
        <span className="text-sm text-white mr-2.5 border-b border-dashed border-dark-800">
          {digitalProcess(borrowData?.[1], 2)}
        </span>
        <img src={asset?.icon} className="w-5 h-5 rounded-full" alt="" />
      </div>
    </HtmlTooltip>
  );
};

export default AvailableBorrowCell;
