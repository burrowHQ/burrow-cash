import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TabState {
  activeTab: string;
  selectedTab: string;
  isAccountDetailsOpen: boolean;
}

const initialState: TabState = {
  activeTab: "market",
  selectedTab: "positions",
  isAccountDetailsOpen: false,
};

const tabSlice = createSlice({
  name: "tab",
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<string>) {
      state.activeTab = action.payload;
    },
    setSelectedTab(state, action: PayloadAction<string>) {
      state.selectedTab = action.payload;
    },
    setAccountDetailsOpen(state, action: PayloadAction<boolean>) {
      state.isAccountDetailsOpen = action.payload;
    },
  },
});

export const { setActiveTab, setSelectedTab, setAccountDetailsOpen } = tabSlice.actions;
export default tabSlice.reducer;
