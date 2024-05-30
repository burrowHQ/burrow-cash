import { getAssets } from "../redux/assetsSelectors";
import { useAppSelector } from "../redux/hooks";
import { getMarginAccount, getMarginAccountPositions } from "../redux/marginAccountSelectors";
import { shrinkToken } from "../store/helper";

export function useMarginAccount() {
  const assets = useAppSelector(getAssets);
  const marginAccountList = useAppSelector(getMarginAccountPositions);

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
    const symbol = replaceSymbol(asset.metadata?.symbol);
    const decimals = (asset.metadata?.decimals ?? 0) + (asset.config?.extra_decimals ?? 0);
    return { price, symbol, decimals, icon };
  };
  const getAssetById = (id) => {
    const assetsData = assets.data;
    return assetsData[id];
  };
  const calculateLeverage = (leverageD, priceD, leverageC, priceC) => {
    return (priceD ? leverageD * priceD : 0) / (priceC ? leverageC * priceC : 0);
  };
  return {
    marginAccountList,
    assets,
    parseTokenValue,
    getAssetDetails,
    getAssetById,
    calculateLeverage,
  };
}
