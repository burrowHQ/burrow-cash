import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { defaultNetwork, missingPriceTokens, BRRR_TOKEN } from "../utils/config";
import { transformAssets, transformFarms } from "../transformers/asstets";
import getAssetsMEME from "../api/get-assets-meme";
import getFarmMEME, { getAllFarmsMEME } from "../api/get-farm-meme";
import { initialState } from "./assetState";

export const fetchAssetsMEME = createAsyncThunk("assetsMEME/fetchAssets", async () => {
  const assets = await getAssetsMEME().then(transformAssets);
  const netTvlFarm = await getFarmMEME("NetTvl");
  const allFarms = await getAllFarmsMEME().then(transformFarms);
  return { assets, netTvlFarm, allFarms };
});

export const fetchRefPrices = createAsyncThunk("assetsMEME/fetchRefPrices", async () => {
  const prices = await fetch(
    "https://raw.githubusercontent.com/NearDeFi/token-prices/main/ref-prices.json",
  ).then((r) => r.json());

  return prices;
});
export const assetSliceMEME = createSlice({
  name: "assetsMEME",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchAssetsMEME.pending, (state) => {
      state.status = "fetching";
    });
    builder.addCase(fetchAssetsMEME.fulfilled, (state, action) => {
      state.data = action.payload.assets;
      state.netTvlFarm = action.payload.netTvlFarm?.rewards || {};
      state.allFarms = action.payload.allFarms || [];
      state.status = action.meta.requestStatus;
      state.fetchedAt = new Date().toString();
    });
    builder.addCase(fetchAssetsMEME.rejected, (state, action) => {
      state.status = action.meta.requestStatus;
      console.error(action.payload);
      throw new Error("Failed to fetch assets and metadata");
    });
    builder.addCase(fetchRefPrices.fulfilled, (state, action) => {
      missingPriceTokens.forEach((missingToken) => {
        const missingTokenId = missingToken[defaultNetwork];
        if (missingTokenId && state.data[missingTokenId] && !state.data[missingTokenId]["price"]) {
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
      throw new Error("Failed to fetch REF prices");
    });
  },
});

export default assetSliceMEME.reducer;
