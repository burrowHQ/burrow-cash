import React, { useMemo } from "react";
import TradingTable from "../../../Trading/components/Table";
import { useMarginAccount } from "../../../../hooks/useMarginAccount";
import DashboardMarginOverview from "../../../../components/Dashboard/dashboardMarginOverview";

const MyMarginTradingPage = () => {
  const { marginAccountList, marginAccountListMEME } = useMarginAccount();
  const totalMarginAccountList = useMemo(() => {
    return { ...(marginAccountList || {}), ...(marginAccountListMEME || {}) };
  }, [marginAccountList, marginAccountListMEME]);
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <DashboardMarginOverview styleType="simple" wrapClassName="w-full mb-6" />
      <TradingTable positionsList={totalMarginAccountList} />
    </div>
  );
};

export default MyMarginTradingPage;
