import React from "react";
import { useAccountId } from "../../../../hooks/hooks";
import { isMobileDevice } from "../../../../helpers/helpers";
import { ConnectWalletButton } from "../../../../components/Header/WalletButton";
import BookTokenSvg from "../../../../public/svg/Group 74.svg";
import BookTokenMobileSvg from "../../../../public/svg/Group 75.svg";
import MyMarginTradingPage from "./MyTradingPage";

const MyMarginTrading = () => {
  const accountId = useAccountId();
  let overviewNode;
  if (accountId) {
    overviewNode = <MyMarginTradingPage />;
  } else {
    overviewNode = (
      <div className="bg-gray-800 md:border md:border-dark-50 w-full md:p-4 mb-4 rounded xsm:py-6 xsm:px-5 xsm:rounded-xl xsm:ml-4 xsm:mr-4 xsm:w-fit">
        <div className="flex justify-end items-center xsm:justify-center">
          <div className="text-center xsm:text-start">
            <div className="h3 mb-2">Connect your wallet</div>
            <div className="mb-9 text-gray-300 h4 xsm:mb-6">
              Please connect your wallet to see your supplies, borrowings, and open positions.
            </div>
            <div className="w-full md-w-auto xsm:hidden">
              <ConnectWalletButton accountId={accountId} />
            </div>
          </div>
          <div className="xsm:hidden" style={{ margin: "-20px 0 -40px" }}>
            <BookTokenSvg />
          </div>
          <div className="md:hidden" style={{ margin: "-52px 0 -40px" }}>
            <BookTokenMobileSvg />
          </div>
        </div>
        <div className="w-full md:hidden">
          <ConnectWalletButton accountId={accountId} className="h-[36px] w-full" />
        </div>
      </div>
    );
  }
  return <div className="flex flex-col items-center justify-center w-full">{overviewNode}</div>;
};

export default MyMarginTrading;
