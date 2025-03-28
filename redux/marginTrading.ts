import { createSlice } from "@reduxjs/toolkit";

interface commonAssets {
  ReduxcategoryAssets1: any;
  ReduxcategoryAssets2: any;
  ReduxcategoryCurrentBalance1: any;
  ReduxcategoryCurrentBalance2: any;
  ReduxSlippageTolerance: any;
  activeCategory: string;
  ReduxTotalPLN: any;
  ReduxRangeMount: any;
  ReduxActiveTab: string;
  showDust: boolean;
}

const initialState: commonAssets = {
  ReduxcategoryAssets1: null,
  ReduxcategoryAssets2: null,
  ReduxcategoryCurrentBalance1: "",
  ReduxcategoryCurrentBalance2: "",
  ReduxSlippageTolerance: 0.5,
  activeCategory: "main",
  ReduxTotalPLN: 0,
  ReduxRangeMount: 1,
  ReduxActiveTab: "long",
  showDust: false,
};

const marginCategory = createSlice({
  name: "marginCategories",
  initialState,
  reducers: {
    setCategoryAssets1(state, action) {
      state.ReduxcategoryAssets1 = action.payload;
    },
    setCategoryAssets2(state, action) {
      state.ReduxcategoryAssets2 = action.payload;
    },
    setReduxcategoryCurrentBalance1(state, action) {
      state.ReduxcategoryCurrentBalance1 = action.payload;
    },
    setReduxcategoryCurrentBalance2(state, action) {
      state.ReduxcategoryCurrentBalance2 = action.payload;
    },
    setSlippageToleranceFromRedux(state, action) {
      state.ReduxSlippageTolerance = action.payload;
    },
    setActiveCategory(state, action) {
      state.activeCategory = action.payload;
    },
    setReduxTotalPLN(state, action) {
      state.ReduxTotalPLN += action.payload;
    },
    setReduxRangeMount(state, action) {
      state.ReduxRangeMount = action.payload;
    },
    setReduxActiveTab(state, action) {
      state.ReduxActiveTab = action.payload;
    },
    toggleShowDust(state) {
      state.showDust = !state.showDust;
    },
  },
});

const {
  setCategoryAssets1,
  setCategoryAssets2,
  setReduxcategoryCurrentBalance1,
  setReduxcategoryCurrentBalance2,
  setSlippageToleranceFromRedux,
  setActiveCategory,
  setReduxTotalPLN,
  setReduxRangeMount,
  setReduxActiveTab,
  toggleShowDust,
} = marginCategory.actions;
const marginCategoryReducer = marginCategory.reducer;
export {
  setCategoryAssets1,
  setCategoryAssets2,
  setReduxcategoryCurrentBalance1,
  setReduxcategoryCurrentBalance2,
  setSlippageToleranceFromRedux,
  setActiveCategory,
  setReduxTotalPLN,
  setReduxRangeMount,
  setReduxActiveTab,
  toggleShowDust,
};
export default marginCategoryReducer;
