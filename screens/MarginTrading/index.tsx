import React, { useState } from "react";
import { useAppDispatch } from "../../redux/hooks";
import { LayoutBox } from "../../components/LayoutContainer/LayoutContainer";
import MyMarginTrading from "./components/MyTrading";
import MarketMarginTrading from "./components/MarketTrading";

const MarginTrading = () => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("market");
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
          onClick={() => setActiveTab("market")}
        >
          Market
        </button>
        <button type="button" className={getTabClassName("my")} onClick={() => setActiveTab("my")}>
          Yours
        </button>
      </div>

      {activeTab === "market" && <MarketMarginTrading />}
      {activeTab === "my" && <MyMarginTrading />}
    </LayoutBox>
  );
};

export default MarginTrading;
