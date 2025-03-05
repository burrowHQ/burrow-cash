import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TabState {
  selectedTab: string;
  isAccountDetailsOpen: boolean;
}

const initialState: TabState = {
  selectedTab: "positions",
  isAccountDetailsOpen: false,
};

const tabSlice = createSlice({
  name: "tab",
  initialState,
  reducers: {
    setSelectedTab(state, action: PayloadAction<string>) {
      state.selectedTab = action.payload;
    },
    setAccountDetailsOpen(state, action: PayloadAction<boolean>) {
      state.isAccountDetailsOpen = action.payload;
    },
  },
});

export const { setSelectedTab, setAccountDetailsOpen } = tabSlice.actions;
export default tabSlice.reducer;
