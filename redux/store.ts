import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  createMigrate,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

import assetsReducer from "./assetsSlice";
import assetsMEMEReducer from "./assetsSliceMEME";
import accountReducer from "./accountSlice";
import accountMEMEReducer from "./accountSliceMEME";
import marginAccountReducer from "./marginAccountSlice";
import marginAccountMEMEReducer from "./marginAccountSliceMEME";
import marginConfigReducer from "./marginConfigSlice";
import marginConfigMEMEReducer from "./marginConfigSliceMEME";
import appReducer from "./appSlice";
import appMEMEReducer from "./appSliceMEME";
import feedReducer from "./feedSlice";
import { migrations } from "./migrations";
import marginCategoryReducer from "./marginTrading";
import poolReducer from "./poolSlice";
import tabReducer from "./marginTabSlice";

const persistConfig = {
  key: "root",
  storage,
  blacklist: ["feed"],
  version: 9,
  migrate: createMigrate(migrations, { debug: false }),
};

const rootReducer = combineReducers({
  assets: assetsReducer,
  assetsMEME: assetsMEMEReducer,
  account: accountReducer,
  accountMEME: accountMEMEReducer,
  marginAccount: marginAccountReducer,
  marginAccountMEME: marginAccountMEMEReducer,
  marginConfig: marginConfigReducer,
  marginConfigMEME: marginConfigMEMEReducer,
  app: appReducer,
  appMEME: appMEMEReducer,
  feed: feedReducer,
  category: marginCategoryReducer,
  poolData: poolReducer,
  tab: tabReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
