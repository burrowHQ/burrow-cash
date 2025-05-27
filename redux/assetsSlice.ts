import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { defaultNetwork, missingPriceTokens, BRRR_TOKEN } from "../utils/config";
import { transformAssets, transformFarms } from "../transformers/asstets";
import getAssets from "../api/get-assets";
import getFarm, { getAllFarms } from "../api/get-farm";
import { initialState } from "./assetState";

export const fetchAssets = createAsyncThunk("assets/fetchAssets", async () => {
  const assets = await getAssets().then(transformAssets);
  const netTvlFarm = await getFarm("NetTvl");
  const allFarms = await getAllFarms().then(transformFarms);
  return { assets, netTvlFarm, allFarms };
});

export const fetchRefPrices = createAsyncThunk("assets/fetchRefPrices", async () => {
  const prices = await fetch("https://api.ref.finance/list-token-price").then((r) => r.json());

  return prices;
});
export const assetSlice = createSlice({
  name: "assets",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchAssets.pending, (state) => {
      state.status = "fetching";
    });
    builder.addCase(fetchAssets.fulfilled, (state, action) => {
      state.data = action.payload.assets;
      state.netTvlFarm = action.payload.netTvlFarm?.rewards || {};
      state.allFarms = action.payload.allFarms || [];
      state.status = action.meta.requestStatus;
      state.fetchedAt = new Date().toString();
    });
    builder.addCase(fetchAssets.rejected, (state, action) => {
      state.status = action.meta.requestStatus;
      console.error(action.payload);
      throw new Error("Failed to fetch assets and metadata");
    });
    builder.addCase(fetchRefPrices.fulfilled, (state, action) => {
      missingPriceTokens.forEach((missingToken) => {
        const missingTokenId = missingToken[defaultNetwork];
        if (
          missingTokenId &&
          state.data[missingTokenId] &&
          !+(state.data[missingTokenId]["price"]?.usd || 0)
        ) {
          if (missingTokenId === "brrr.ft.ref-labs.testnet") {
            // for pubtestnet env
            state.data[missingTokenId]["price"] = {
              decimals: action.payload[BRRR_TOKEN.mainnet].decimal,
              usd: Number(action.payload[BRRR_TOKEN.mainnet].price),
              multiplier: "1",
            };
          } else {
            state.data[missingTokenId]["price"] = {
              decimals: action.payload[missingToken.mainnet].decimal,
              usd: Number(action.payload[missingToken.mainnet].price),
              multiplier: "1",
            };
          }
        }
      });
    });
    builder.addCase(fetchRefPrices.pending, (state) => {
      state.status = "fetching";
    });
    builder.addCase(fetchRefPrices.rejected, (state, action) => {
      state.status = action.meta.requestStatus;
      console.error(action.payload);
      throw new Error("Failed to fetch RHEA prices");
    });
  },
});

export default assetSlice.reducer;
