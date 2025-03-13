import React from "react";
import { useAccountId } from "../../../../hooks/hooks";
import { ConnectWalletButton } from "../../../../components/Header/WalletButton";
import { EmptyIcon } from "../../../../components/Dashboard/icons";
import UnLoginBox from "../../../../components/Dashboard/unLoginBox";
import MyMarginTradingPage from "./MyTradingPage";

const MyMarginTrading = () => {
  const accountId = useAccountId();
  let overviewNode;
  if (accountId) {
    overviewNode = <MyMarginTradingPage />;
  } else {
    overviewNode = (
      <div className="w-full">
        <UnLoginBox />
      </div>
    );
  }
  return <div className="flex flex-col items-center justify-center w-full">{overviewNode}</div>;
};

export default MyMarginTrading;
