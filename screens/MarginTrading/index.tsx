import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { LayoutBox } from "../../components/LayoutContainer/LayoutContainer";
import MyMarginTrading from "./components/MyTrading";
import MarketMarginTrading from "./components/MarketTrading";
import { RootState } from "../../redux/store";
import { setAccountDetailsOpen, setActiveTab } from "../../redux/marginTabSlice";
import { useAccountId } from "../../hooks/hooks";
import { MARGIN_WHITELIST } from "../../utils/config";
import { ConnectWalletButton } from "../../components/Header/WalletButton";

const MarginTrading = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const selectedWalletId = window.selector?.store?.getState()?.selectedWalletId;
  const activeTab = useSelector((state: RootState) => state.tab.activeTab);
  const accountId = useAccountId();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  useEffect(() => {
    if (selectedWalletId === "btc-wallet") {
      setShowLoginModal(false);
      setShowWhitelistModal(false);
    } else {
      if (!accountId) {
        setShowLoginModal(true);
      } else {
        setShowLoginModal(false);
        const isInWhitelist = MARGIN_WHITELIST.includes(accountId);
        if (!isInWhitelist) {
          setShowWhitelistModal(true);
        }
      }
    }
  }, [accountId, selectedWalletId]);

  const handleTabChange = (tab: string) => {
    dispatch(setActiveTab(tab));
    dispatch(setAccountDetailsOpen(false));
  };

  const getTabClassName = (tabName) => {
    const baseClass = "py-2.5 px-24 text-base xsm:px-0 xsm:flex-1";
    const activeClass = "bg-primary rounded-md text-dark-200";
    return activeTab === tabName ? `${baseClass} ${activeClass}` : baseClass;
  };

  return (
    <LayoutBox className="flex flex-col items-center justify-center mt-14 xsm:mt-0">
      {showLoginModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center"
          style={{
            zIndex: "66",
            backdropFilter: "blur(6px)",
            height: "100vh",
            overflow: "hidden",
          }}
        >
          <div
            className="text-white text-center bg-dark-100 px-5 pt-9 pb-7 rounded-md border border-dark-300"
            style={{ width: "278px" }}
          >
            <div className="mb-4 text-gray-300 h4">
              Please connect your wallet to enable this feature.
            </div>
            <div className="w-full md-w-auto">
              <ConnectWalletButton accountId={accountId} />
            </div>
          </div>
        </div>
      )}
      {showWhitelistModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center"
          style={{
            zIndex: "66",
            backdropFilter: "blur(6px)",
            height: "100vh",
            overflow: "hidden",
          }}
        >
          <div
            className="text-white text-center bg-dark-100 px-5 pt-9 pb-7 rounded-md border border-dark-300"
            style={{ width: "278px" }}
          >
            <div className="mb-4 text-gray-300 h4">Account is not whitelist.</div>
            <div
              onClick={() => router.push("/")}
              className="text-primary h4 underline cursor-pointer"
            >
              Go to home page.
            </div>
          </div>
        </div>
      )}

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

      <MarketMarginTrading hidden={activeTab !== "market"} />
      <MyMarginTrading hidden={activeTab !== "my"} />
    </LayoutBox>
  );
};

export default MarginTrading;
