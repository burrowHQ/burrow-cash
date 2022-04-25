import { Box } from "@mui/material";

import { getAccountId } from "../../redux/accountSelectors";
import { PageTitle, InfoBox, OnboardingBRRR, BetaInfo } from "../../components";
import Table from "../../components/Table";
import { columns as defaultColumns } from "./tabledata";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { getAvailableAssets } from "../../redux/assetsSelectors";
import { showModal } from "../../redux/appSlice";
import { useTableSorting } from "../../hooks";

const Borrow = () => {
  const dispatch = useAppDispatch();
  const accountId = useAppSelector(getAccountId);
  const rows = useAppSelector(getAvailableAssets("borrow"));
  const { sorting, setSorting } = useTableSorting();

  const columns = !accountId
    ? [...defaultColumns.filter((col) => col.dataKey !== "borrowed")]
    : defaultColumns;

  const handleOnRowClick = ({ tokenId }) => {
    dispatch(showModal({ action: "Borrow", tokenId, amount: 0 }));
  };

  return (
    <Box pb="2.5rem" display="grid" justifyContent="center">
      <InfoBox accountId={accountId} />
      {!accountId && <OnboardingBRRR />}
      <PageTitle first="Borrow" second="Assets" />
      <BetaInfo />
      <Table
        rows={rows}
        columns={columns}
        onRowClick={handleOnRowClick}
        sorting={{ name: "borrow", ...sorting.borrow, setSorting }}
      />
    </Box>
  );
};

export default Borrow;
