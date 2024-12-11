import MarketsTable from "./table";
import MarketsOverview from "./overview";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { showModal } from "../../redux/appSlice";
import { useAvailableAssets, useAvailableAssetsMEME } from "../../hooks/hooks";
import { useTableSorting } from "../../hooks/useTableSorting";
import { LayoutBox } from "../../components/LayoutContainer/LayoutContainer";

const Market = () => {
  const dispatch = useAppDispatch();
  const { dashBoardActiveTab } = useAppSelector((state) => state.category);
  const rows = dashBoardActiveTab == "main" ? useAvailableAssets() : useAvailableAssetsMEME();
  const { sorting, setSorting } = useTableSorting();
  const handleOnRowClick = ({ tokenId }) => {
    dispatch(showModal({ action: "Supply", tokenId, amount: "0" }));
  };
  const loading = !rows.length;
  return (
    <LayoutBox className="flex flex-col items-center justify-center">
      <MarketsOverview />
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
