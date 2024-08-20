import React, { useState } from "react";
import { Box, Typography, Stack } from "@mui/material";
import Decimal from "decimal.js";
import HtmlTooltip from "../../components/common/html-tooltip";
import { IToken, UIAsset } from "../../interfaces";
import { shrinkToken } from "../../store";
import { digitalProcess } from "../../utils/uiNumber";

const LPTokenCell = ({
  children,
  asset,
  balance,
}: {
  children: React.ReactNode;
  asset: UIAsset;
  balance: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { tokens, isLpToken } = asset;
  function display_token_number(token: IToken) {
    const { amount, metadata } = token;
    const unit_amount = shrinkToken(amount, metadata?.decimals || 0);
    return digitalProcess(new Decimal(unit_amount || 0).mul(balance || 0).toFixed(), 3);
  }
  if (!isLpToken) {
    return <span>{children}</span>;
  }
  return (
    <HtmlTooltip
      open={showTooltip}
      onOpen={() => setShowTooltip(true)}
      onClose={() => setShowTooltip(false)}
      title={
        <div className="flex flex-col gap-2.5">
          {tokens?.map((token: IToken) => {
            return (
              <div className="flex items-center" key={token.token_id}>
                <img alt="" src={token.metadata?.icon} className="w-4 h-4 rounded-full mr-2" />
                <span className="text-xs text-white">{display_token_number(token)}</span>
              </div>
            );
          })}
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
};

export default LPTokenCell;
