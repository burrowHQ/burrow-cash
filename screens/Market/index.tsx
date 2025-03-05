import { useEffect } from "react";
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
import { WarnTipIcon } from "../../components/Icons/IconsV2";

const Market = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { activeCategory: activeTab = "main" } = useAppSelector((state) => state.category);
  const rows = useAvailableAssets();
  const { sorting, setSorting } = useTableSorting();
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
      <div className="flex items-center w-full mb-5 xsm:px-4 xsm:items-start">
        <WarnTipIcon className="mr-1.5 xsm:mt-1.5 flex-shrink-0" />
        <span>
          <span className="text-sm text-white text-opacity-60 inline">
            The following positions cannot be borrowed from{" "}
            {activeTab == "main" ? "Meme's" : "Mainstream's"} positions.
          </span>
          <span className="text-base text-white inline">😬</span>
        </span>
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
