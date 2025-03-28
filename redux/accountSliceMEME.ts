import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { getBurrow } from "../utils";
import { ChangeMethodsLogic } from "../interfaces";
import { identifyUser } from "../utils/telemetry";
import { transformAccount } from "../transformers/account";
import { initialState } from "./accountState";
import getAccountMEME from "../api/get-account-meme";

export const farmClaimAllMEME = createAsyncThunk("accountMEME/farmClaimAll", async () => {
  const { call, logicMEMEContract } = await getBurrow();
  return call(
    logicMEMEContract,
    ChangeMethodsLogic[ChangeMethodsLogic.account_farm_claim_all],
    undefined,
    "0",
  );
});

export const fetchAccountMEME = createAsyncThunk("accountMEME/fetchAccount", async () => {
  const account = await getAccountMEME().then(transformAccount);
  if (account?.accountId) {
    const wallet = JSON.parse(
      localStorage.getItem("near-wallet-selector:selectedWalletId") || `"undefined"`,
    );
    identifyUser(account.accountId, { wallet });
  }
  return account;
});

export const accountSliceMEME = createSlice({
  name: "accountMEME",
  initialState,
  reducers: {
    logoutAccount: () => initialState,
    setAccountId: (state, action) => {
      state.accountId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(farmClaimAllMEME.pending, (state, action) => {
      state.isClaiming = action.meta.requestStatus;
    });
    builder.addCase(farmClaimAllMEME.fulfilled, (state, action) => {
      state.isClaiming = action.meta.requestStatus;
    });
    builder.addCase(farmClaimAllMEME.rejected, (state, action) => {
      state.status = action.meta.requestStatus;
    });
    builder.addCase(fetchAccountMEME.pending, (state, action) => {
      state.status = action.meta.requestStatus;
    });
    builder.addCase(fetchAccountMEME.rejected, (state, action) => {
      state.status = action.meta.requestStatus;
      console.error(action.payload);
      throw new Error("Failed to fetch account");
    });
    builder.addCase(fetchAccountMEME.fulfilled, (state, action) => {
      state.isClaiming = undefined;
      state.status = action.meta.requestStatus;
      state.fetchedAt = new Date().toString();

      if (!action.payload?.accountId || !window.accountId) return;

      const { accountId, balances, portfolio } = action.payload;

      state.accountId = accountId;
      state.balances = balances;

      if (portfolio) {
        state.portfolio = portfolio;
      }
    });
  },
});

export const { logoutAccount, setAccountId } = accountSliceMEME.actions;
export default accountSliceMEME.reducer;
