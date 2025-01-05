import { IOrder } from "../../redux/appSlice";

const descendingComparator = (a, b, orderBy) => {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
};

const getComparator = (order: "asc" | "desc", orderBy: string) =>
  order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);

export interface TableProps {
  sorting: {
    name: string;
    property: string;
    order: IOrder;
    setSorting: (name: string, property: string, order: IOrder) => void;
  };
  rows: any;
  isMeme: boolean;
  columns?: any;
  onRowClick?: (rowData: any) => void;
  sx?: any;
}
