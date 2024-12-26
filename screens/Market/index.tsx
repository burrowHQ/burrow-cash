import { useEffect } from "react";
import { useRouter } from "next/router";
import MarketsTable from "./table";
import MarketsOverview from "./overview";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { showModal } from "../../redux/appSlice";
import { useAvailableAssets, useAvailableAssetsMEME } from "../../hooks/hooks";
import { useTableSorting } from "../../hooks/useTableSorting";
import { LayoutBox } from "../../components/LayoutContainer/LayoutContainer";
import { setDashBoardActiveTab } from "../../redux/marginTrading";

const Market = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { dashBoardActiveTab: activeTab = "main" } = useAppSelector((state) => state.category);
  const { dashBoardActiveTab } = useAppSelector((state) => state.category);
  const rows = dashBoardActiveTab == "main" ? useAvailableAssets() : useAvailableAssetsMEME();
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
      <div className="w-full grid grid-cols-2 gap-x-1 cursor-pointer">
        <div
          className={`${
            activeTab == "main" ? "bg-primary" : "bg-[#C0C4E94D]"
          } text-center h-12 leading-[48px] text-black rounded-t-xl`}
          onClick={() => dispatch(setDashBoardActiveTab("main"))}
        >
          Mainstream
        </div>
        <div
          className={`${
            activeTab == "meme" ? "bg-primary" : "bg-[#C0C4E94D]"
          } text-center h-12 leading-[48px] text-black rounded-t-xl`}
          onClick={() => dispatch(setDashBoardActiveTab("meme"))}
        >
          Meme
        </div>
      </div>
      <MarketsTable
        rows={rows}
        onRowClick={handleOnRowClick}
        sorting={{ name: "market", ...sorting.market, setSorting }}
      />
      {loading ? (
        <div className="flex flex-col items-center mt-24">
          <img src="/loading-brrr.gif" alt="" width="75px" />
          <span className="flex items-center text-sm text-gray-300 mt-2">Loading data...</span>
        </div>
      ) : null}
    </LayoutBox>
  );
};

export default Market;
