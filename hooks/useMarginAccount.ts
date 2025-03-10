import { getAssets, getAssetsMEME } from "../redux/assetsSelectors";
import { useAppSelector } from "../redux/hooks";
import {
  getMarginAccount,
  getMarginAccountPositions,
  getMarginAccountPositionsMEME,
} from "../redux/marginAccountSelectors";
import { shrinkToken } from "../store/helper";
import { checkIfMeme } from "../utils/margin";
import { useRegisterTokenType } from "./useRegisterTokenType";
import { IAsset } from "../interfaces";

export interface TokenInfo {
  open_ts: string;
  uahpi_at_open: string;
  debt_cap: string;
  token_c_info: IAsset;
  token_d_info: IAsset;
  token_p_id: any;
  token_p_amount: string;
  is_locking: boolean;
}

export function useMarginAccount() {
  const assets = useAppSelector(getAssets);
  const assetsMEME = useAppSelector(getAssetsMEME);
  const marginAccountList = useAppSelector(getMarginAccountPositions);
  const marginAccountListMEME = useAppSelector(getMarginAccountPositionsMEME);
  const parseTokenValue = (tokenAmount, decimals) => {
    if (!tokenAmount || !decimals) return 0;
    return Number(shrinkToken(tokenAmount, decimals));
  };
  const replaceSymbol = (symbol) => {
    return symbol === "wNEAR" ? "NEAR" : symbol;
  };
  const getAssetDetails = (asset) => {
    const icon = asset?.metadata?.icon;
    const price = asset?.price?.usd;
    const symbol = replaceSymbol(asset?.metadata?.symbol);
    const decimals = (asset?.metadata?.decimals ?? 0) + (asset?.config?.extra_decimals ?? 0);
    return { price, symbol, decimals, icon };
  };
  const getAssetById = (id, tokenInfo: TokenInfo | undefined = undefined) => {
    if (tokenInfo) {
      const isMeme = checkIfMeme({
        debt_id: tokenInfo.token_d_info.token_id,
        pos_id: tokenInfo.token_p_id,
      });
      if (isMeme) {
        return getAssetByIdMEME(id);
      }
    }
    const assetsData = assets.data;
    return assetsData[id];
  };

  const getAssetByIdMEME = (id) => {
    const assetsData = assetsMEME.data;
    return assetsData[id];
  };

  const calculateLeverage = (leverageD, priceD, leverageC, priceC) => {
    return (priceD ? leverageD * priceD : 0) / (priceC ? leverageC * priceC : 0);
  };
  return {
    marginAccountList,
    marginAccountListMEME,
    assets,
    parseTokenValue,
    getAssetDetails,
    getAssetById,
    getAssetByIdMEME,
    calculateLeverage,
  };
}
