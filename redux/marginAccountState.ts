import { IMarginTradingPositionView, IAsset } from "../interfaces";

type Status = "pending" | "fulfilled" | "rejected" | undefined;
export interface IMarginAccountState {
  account_id: string;
  supplied: IAsset[];
  margin_positions: IMarginTradingPositionView;
  status: Status;
  fetchedAt: string | undefined;
}

export const initialState: IMarginAccountState = {
  account_id: "",
  supplied: [],
  margin_positions: {},
  status: undefined,
  fetchedAt: undefined,
};
