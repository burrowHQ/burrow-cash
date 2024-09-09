import React from "react";
import { useAccountId, usePortfolioAssets } from "../../../../hooks/hooks";
import { isMobileDevice } from "../../../../helpers/helpers";
import { ConnectWalletButton } from "../../../../components/Header/WalletButton";
import BookTokenSvg from "../../../../public/svg/Group 74.svg";
import MyMarginTradingPage from "./MyTradingPage";

const MyMarginTrading = () => {
  const accountId = useAccountId();

  let overviewNode;
  if (accountId) {
    overviewNode = <MyMarginTradingPage />;
  } else {
    overviewNode = (
      <div className="bg-gray-800 border border-dark-50 w-full flex p-4 mb-4 rounded justify-end items-center">
        <div className="text-center">
          <div className="h3 mb-2">Connect your wallet</div>
          <div className="mb-9 text-gray-300 h4">
            Please connect your wallet to see your open positions.
          </div>
          <div className="w-full md-w-auto">
            <ConnectWalletButton accountId={accountId} />
          </div>
        </div>
        <div className="hidden md:block" style={{ margin: "-20px 0 -40px" }}>
          <BookTokenSvg />
        </div>
      </div>
    );
  }
  return <div className="flex flex-col items-center justify-center w-full">{overviewNode}</div>;
};

export default MyMarginTrading;
