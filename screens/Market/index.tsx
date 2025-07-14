import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import MarketsTable from "./table";
import MarketsOverview from "./overview";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { showModal } from "../../redux/appSlice";
import { useAvailableAssets } from "../../hooks/hooks";
import { useTableSorting } from "../../hooks/useTableSorting";
import { LayoutBox } from "../../components/LayoutContainer/LayoutContainer";
import { RefreshIcon } from "../../components/Header/svg";
import { setActiveCategory } from "../../redux/marginTrading";
import { PointsIcon, WarnTipIcon } from "../../components/Icons/IconsV2";
import BtcMarketGuide from "../../components/BeginnerGuide/BtcMarketGuide";
import { getAccountId } from "../../redux/accountSelectors";

const Market = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { activeCategory: activeTab = "main" } = useAppSelector((state) => state.category);
  const rows = useAvailableAssets();
  const { sorting, setSorting } = useTableSorting();
  const accountId = useAppSelector(getAccountId);
  const [isBtcWallet, setIsBtcWallet] = useState(false);

  useEffect(() => {
    const checkWalletType = () => {
      if (window.selector) {
        try {
          const walletId = window.selector?.store?.getState()?.selectedWalletId;
          setIsBtcWallet(walletId === "btc-wallet");
        } catch (err) {
          setIsBtcWallet(false);
        }
      } else {
        setIsBtcWallet(false);
      }
    };
    checkWalletType();
    const nearPromise = (window as any).nearInitPromise;
    if (nearPromise) {
      nearPromise
        .then(() => {
          checkWalletType();
        })
        .catch((err) => {
          console.error(err);
        });
    }

    const intervalId = setInterval(() => {
      if (window.selector) {
        checkWalletType();
        clearInterval(intervalId);
      }
    }, 500);

    if (accountId) {
      checkWalletType();
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [accountId]);

  useEffect(() => {
    const handleWalletLoaded = () => {
      if (window.selector) {
        const walletId = window.selector?.store?.getState()?.selectedWalletId;
        setIsBtcWallet(walletId === "btc-wallet");
      }
    };
    window.addEventListener("walletLoaded", handleWalletLoaded);
    window.addEventListener("walletSelected", handleWalletLoaded);
    return () => {
      window.removeEventListener("walletLoaded", handleWalletLoaded);
      window.removeEventListener("walletSelected", handleWalletLoaded);
    };
  }, []);

  useEffect(() => {
    if (router?.query?.vault === "true") {
      setSorting("market", "depositApy", "desc");
    }
  }, [router?.query]);
  const handleOnRowClick = ({ tokenId }) => {
    dispatch(showModal({ action: "Supply", tokenId, amount: "0" }));
  };
  const loading = !rows.length;
  return (
    <LayoutBox className="flex flex-col items-center justify-center">
      {activeTab === "main" && <BtcMarketGuide isBtcWallet={isBtcWallet} />}
      <MarketsOverview />
      <div className="  h-[48px] rounded-lg lg:bg-gray-110 p-0.5 text-base text-gray-300 my-[46px] xsm:w-screen xsm:px-4">
        <div className="flex items-center h-full xsm:bg-gray-110 rounded-lg">
          <span
            className={`flex items-center justify-center lg:w-[340px] xsm:flex-grow xsm:w-1 h-full rounded-md cursor-pointer ${
              activeTab == "main" ? "bg-primary text-black" : "text-gray-300"
            }`}
            onClick={() => dispatch(setActiveCategory("main"))}
          >
            Mainstream Position
          </span>
          <span
            className={`flex items-center justify-center lg:w-[340px] xsm:flex-grow xsm:w-1 h-full rounded-md cursor-pointer ${
              activeTab == "meme" ? "bg-primary text-black" : "text-gray-300"
            }`}
            onClick={() => dispatch(setActiveCategory("meme"))}
          >
            Meme Position
          </span>
        </div>
      </div>
      <div className="flex items-center w-full gap-2.5 xsm:flex-col xsm:px-4">
        <div className="bg-green-150 bg-opacity-20 rounded-[16px] py-1 px-2.5 flex items-center w-auto mb-5 xsm:px-4 xsm:items-start">
          <PointsIcon className="mr-1.5 xsm:mt-1.5 flex-shrink-0" />
          <span>
            <span className="text-sm text-white inline">
              Some designated tokens are participating in RHEA's
            </span>
            <span
              className="text-base text-primary underline ml-1 cursor-pointer"
              onClick={() => {
                window.open(
                  "https://guide.rhea.finance/products/guides/rhea-point-system",
                  "_blank",
                );
              }}
            >
              Reward Points
            </span>
            <span className="text-base text-white inline ml-1"> program. 🎉</span>
          </span>
        </div>
        <div className="bg-yellow-100 bg-opacity-20 rounded-[16px] py-1 px-2.5 flex items-center w-auto mb-5 xsm:px-4 xsm:items-start">
          <WarnTipIcon className="mr-1.5 xsm:mt-1.5 flex-shrink-0" />
          <span>
            <span className="text-sm text-white inline mr-1">
              The positions of MainStream and Meme are independent.
            </span>
            <span className="text-base text-white inline">😬</span>
          </span>
        </div>
      </div>
      <MarketsTable
        rows={rows}
        onRowClick={handleOnRowClick}
        sorting={{ name: "market", ...sorting.market, setSorting }}
        isMeme={activeTab !== "main"}
      />
      {loading ? (
        <div className="flex flex-col items-center mt-24">
          <RefreshIcon className="flex-shrink-0 animate-spin h-6 w-6" />
          <span className="flex items-center text-sm text-gray-300 mt-2">Loading data...</span>
        </div>
      ) : null}
    </LayoutBox>
  );
};

export default Market;
