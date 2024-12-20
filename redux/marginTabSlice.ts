import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TabState {
  activeTab: string;
  selectedTab: string;
}

const initialState: TabState = {
  activeTab: "market",
  selectedTab: "positions",
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
  },
});

export const { setActiveTab, setSelectedTab } = tabSlice.actions;
export default tabSlice.reducer;
