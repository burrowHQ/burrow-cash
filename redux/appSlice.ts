import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

import { getConfig } from "../api";
import { IConfig } from "../interfaces";

export type TokenAction = "Supply" | "Borrow" | "Repay" | "Adjust" | "Withdraw";

export type IOrder = "asc" | "desc";

export interface ITableSorting {
  property: string;
  order: IOrder;
}

export type ITheme = "light" | "dark";

export interface AppState {
  theme: ITheme;
  isBlocked: {
    [ip: string]: boolean;
  };
  disclaimerAgreed: boolean;
  degenMode: {
    enabled: boolean;
    repayFromDeposits: boolean;
  };
  toastMessage: string;
  showModal: boolean;
  showInfo: boolean;
  protocolStats: boolean;
  displayAsTokenValue: boolean;
  showTicker: boolean;
  slimStats: boolean;
  showDailyReturns: boolean;
  fullDigits: {
    totals: boolean;
    user: boolean;
    table: boolean;
    dailyReturns: boolean;
  };
  selected: {
    action?: TokenAction;
    tokenId: string;
    useAsCollateral: boolean;
    amount: string;
    isMax: boolean;
    position?: string;
  };
  staking: {
    amount: number;
    months: number;
  };
  tableSorting: {
    market: ITableSorting;
    portfolioDeposited: ITableSorting;
    portfolioBorrowed: ITableSorting;
  };
  config: IConfig;
  unreadLiquidation: {
    count: number;
    unreadIds: [];
  };
  refreshNumber: number;
}

export const initialState: AppState = {
  isBlocked: {},
  theme: "light",
  unreadLiquidation: {
    count: 0,
    unreadIds: [],
  },
  toastMessage: "",
  disclaimerAgreed: false,
  degenMode: {
    enabled: true,
    repayFromDeposits: false,
  },
  showModal: false,
  showInfo: true,
  protocolStats: true,
  displayAsTokenValue: true,
  showTicker: false,
  slimStats: false,
  showDailyReturns: false,
  fullDigits: {
    totals: false,
    user: false,
    table: true,
    dailyReturns: true,
  },
  selected: {
    action: undefined,
    tokenId: "",
    useAsCollateral: false,
    amount: "0",
    isMax: false,
    position: undefined,
  },
  staking: {
    amount: 0,
    months: 1,
  },
  tableSorting: {
    market: {
      property: "totalSupplyMoney",
      order: "desc" as IOrder,
    },
    portfolioDeposited: {
      property: "deposited",
      order: "desc" as IOrder,
    },
    portfolioBorrowed: {
      property: "borrowed",
      order: "desc" as IOrder,
    },
  },
  config: {
    booster_decimals: 0,
    booster_token_id: "",
    force_closing_enabled: 0,
    max_num_assets: 0,
    maximum_recency_duration_sec: 0,
    maximum_staking_duration_sec: 0,
    maximum_staleness_duration_sec: 0,
    minimum_staking_duration_sec: 0,
    oracle_account_id: "",
    ref_exchange_id: "",
    owner_id: "",
    x_booster_multiplier_at_maximum_staking_duration: 0,
    boost_suppress_factor: 0,
    enable_price_oracle: false,
    enable_pyth_oracle: true,
    meme_oracle_account_id: "",
    meme_ref_exchange_id: "",
  },
  refreshNumber: 0,
};

export const fetchConfig = createAsyncThunk("account/getConfig", async () => {
  const config = await getConfig();
  return config;
});

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    hideModal(state) {
      state.showModal = false;
    },
    showModal(
      state,
      action: PayloadAction<{
        action: TokenAction;
        amount: string;
        tokenId: string;
        position?: string;
      }>,
    ) {
      state.selected = { ...state.selected, isMax: false, ...action.payload };
      state.showModal = true;
    },
    updateAmount(state, action: PayloadAction<{ amount: string; isMax: boolean }>) {
      state.selected.amount = action.payload.amount;
      state.selected.isMax = action.payload.isMax;
    },
    updatePosition(state, action: PayloadAction<{ position: string }>) {
      state.selected.position = action.payload.position;
    },
    toggleUseAsCollateral(state, action: PayloadAction<{ useAsCollateral: boolean }>) {
      state.selected.useAsCollateral = action.payload.useAsCollateral;
    },
    toggleDisplayValues(state) {
      state.displayAsTokenValue = !state.displayAsTokenValue;
    },
    toggleSlimStats(state) {
      state.slimStats = !state.slimStats;
    },
    setProtocolStats(state, action) {
      state.protocolStats = action.payload;
    },
    setShowInfo(state, action) {
      state.showInfo = action.payload;
    },
    setFullDigits(state, action) {
      state.fullDigits = { ...state.fullDigits, ...action.payload };
    },
    toggleShowTicker(state) {
      state.showTicker = !state.showTicker;
    },
    toggleShowDailyReturns(state) {
      state.showDailyReturns = !state.showDailyReturns;
    },
    setTableSorting(state, action) {
      const { name, property, order } = action.payload;
      state.tableSorting[name] = { property, order };
    },
    setStaking(state, action) {
      state.staking = { ...state.staking, ...action.payload };
    },
    toggleDegenMode(state) {
      state.degenMode = { ...state.degenMode, enabled: !state.degenMode.enabled };
    },
    setRepayFrom(state, action) {
      state.degenMode = {
        ...state.degenMode,
        repayFromDeposits: action.payload.repayFromDeposits,
      };
      state.selected = {
        ...state.selected,
        amount: "0",
      };
    },
    setDisclaimerAggreed(state, action) {
      state.disclaimerAgreed = action.payload;
    },
    setBlocked(state, action) {
      const { ip, blocked } = action.payload;
      state.isBlocked[ip] = blocked;
    },
    setTheme(state, action) {
      state.theme = action.payload;
    },
    setUnreadLiquidation(state, action) {
      state.unreadLiquidation = action.payload;
    },
    setToastMessage(state, action) {
      state.toastMessage = action.payload;
    },
    setRefreshNumber(state, action) {
      state.refreshNumber = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchConfig.fulfilled, (state, action) => {
      state.config = action.payload;
    });
  },
});

export const {
  hideModal,
  showModal,
  updateAmount,
  toggleUseAsCollateral,
  toggleDisplayValues,
  toggleSlimStats,
  setFullDigits,
  toggleShowTicker,
  setTableSorting,
  toggleShowDailyReturns,
  setStaking,
  toggleDegenMode,
  setRepayFrom,
  setProtocolStats,
  setShowInfo,
  setDisclaimerAggreed,
  setBlocked,
  setTheme,
  setUnreadLiquidation,
  setToastMessage,
  updatePosition,
  setRefreshNumber,
} = appSlice.actions;

export default appSlice.reducer;
