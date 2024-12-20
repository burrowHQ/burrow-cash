import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { LayoutBox } from "../../components/LayoutContainer/LayoutContainer";
import MyMarginTrading from "./components/MyTrading";
import MarketMarginTrading from "./components/MarketTrading";
import { RootState } from "../../redux/store";
import { setActiveTab } from "../../redux/marginTabSlice";

const MarginTrading = () => {
  const dispatch = useAppDispatch();
  const activeTab = useSelector((state: RootState) => state.tab.activeTab);

  const handleTabChange = (tab: string) => {
    dispatch(setActiveTab(tab));
  };

  const getTabClassName = (tabName) => {
    const baseClass = "py-2.5 px-24 text-base xsm:px-0 xsm:flex-1";
    const activeClass = "bg-primary rounded-md text-dark-200";
    return activeTab === tabName ? `${baseClass} ${activeClass}` : baseClass;
  };

  return (
    <LayoutBox className="flex flex-col items-center justify-center mt-14 xsm:mt-0">
      <div className="xsm:px-4 mb-6 md:py-0.5 md:px-0.5 xsm:w-full xsm:mb-[30px]">
        <div className="flex md:space-x-4 bg-gray-800 text-gray-300 rounded-md">
          <button
            type="button"
            className={getTabClassName("market")}
            onClick={() => handleTabChange("market")}
          >
            Market
          </button>
          <button
            type="button"
            className={getTabClassName("my")}
            onClick={() => handleTabChange("my")}
          >
            Yours
          </button>
        </div>
      </div>

      {activeTab === "market" && <MarketMarginTrading />}
      {activeTab === "my" && <MyMarginTrading />}
    </LayoutBox>
  );
};

export default MarginTrading;
