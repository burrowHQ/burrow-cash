import { IPool } from "../interfaces/pool";

export interface AssetsState {
  dclPools: IPool[];
  classicPools: IPool[];
  stablePools: IPool[];
  degenPools: IPool[];
  status: "pending" | "fulfilled" | "rejected" | "fetching" | null;
  fetchedAt: string | undefined;
}

export const initialState: AssetsState = {
  dclPools: [],
  classicPools: [],
  stablePools: [],
  degenPools: [],
  status: null,
  fetchedAt: undefined,
};
