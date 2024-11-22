import React, { useState, useEffect } from "react";
import { useAppDispatch } from "../../redux/hooks";
import { LayoutBox } from "../../components/LayoutContainer/LayoutContainer";
import MyMarginTrading from "./components/MyTrading";
import MarketMarginTrading from "./components/MarketTrading";

const MarginTrading = () => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("marginTradingTab");
    return savedTab || "market";
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem("marginTradingTab", tab);
  };

  const getTabClassName = (tabName) => {
    const baseClass = "py-2.5 px-24 text-base";
    const activeClass = "bg-primary rounded-md text-dark-200";
    return activeTab === tabName ? `${baseClass} ${activeClass}` : baseClass;
  };

  return (
    <LayoutBox className="flex flex-col items-center justify-center mt-14">
      <div className="flex space-x-4 bg-gray-800 mb-6 text-gray-300 rounded-md py-0.5 px-0.5">
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

      {activeTab === "market" && <MarketMarginTrading />}
      {activeTab === "my" && <MyMarginTrading />}
    </LayoutBox>
  );
};

export default MarginTrading;
