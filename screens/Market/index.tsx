import { useEffect } from "react";
import { useRouter } from "next/router";
import MarketsTable from "./table";
import MarketsOverview from "./overview";
import { useAppDispatch } from "../../redux/hooks";
import { showModal } from "../../redux/appSlice";
import { useAvailableAssets } from "../../hooks/hooks";
import { useTableSorting } from "../../hooks/useTableSorting";
import { LayoutBox } from "../../components/LayoutContainer/LayoutContainer";

const Market = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
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
      <MarketsTable
        rows={rows}
        onRowClick={handleOnRowClick}
        sorting={{ name: "market", ...sorting.market, setSorting }}
      />
      {loading ? (
        <div className="flex flex-col items-center mt-24">
          <img src="/favicon.png" alt="" width="75px" />
          <span className="flex items-center text-sm text-gray-300 mt-2">Loading data...</span>
        </div>
      ) : null}
    </LayoutBox>
  );
};

export default Market;
