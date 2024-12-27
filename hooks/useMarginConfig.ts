import { getAssets, getAssetsMEME } from "../redux/assetsSelectors";
import { useAppSelector } from "../redux/hooks";
import { getMarginConfig, getMarginConfigMEME } from "../redux/marginConfigSelectors";

export function useMarginConfigToken() {
  const assets = useAppSelector(getAssets);
  const assetsMEME = useAppSelector(getAssetsMEME);
  const marginConfigTokens = useAppSelector(getMarginConfig);
  const marginConfigTokensMEME = useAppSelector(getMarginConfigMEME);
  const assetsData = assets.data;
  const assetsDataMEME = assetsMEME.data;
  const combinedAssetsData = { ...assetsData, ...assetsDataMEME };
  // add by LuKe
  const categoryAssets1: Array<any> = [];
  const categoryAssets2: Array<any> = [];

  const filteredMarginConfigTokens1 = Object.entries(marginConfigTokens.registered_tokens)
    .concat(Object.entries(marginConfigTokensMEME.registered_tokens))
    .filter(([token, value]) => value === 1)
    .map(([token]) => token);

  const filteredMarginConfigTokens2 = Object.entries(marginConfigTokens.registered_tokens)
    .filter(([token, value]) => value === 2)
    .map(([token]) => token);

  const filterMarginConfigList = filteredMarginConfigTokens1.reduce((item, token) => {
    if (combinedAssetsData[token]) {
      item[token] = combinedAssetsData[token];
      // get categoryAssets1
      categoryAssets1.push({
        ...combinedAssetsData[token],
      });
    }
    return item;
  }, {});
  filteredMarginConfigTokens2.forEach((item: string) => {
    // security check
    if (combinedAssetsData[item]?.metadata) {
      // get categoryAssets2
      categoryAssets2.push({
        ...assets.data[item],
      });
    }
  });

  const getPositionType = (token_id) => {
    const type = marginConfigTokens.registered_tokens[token_id];
    return {
      label: type === 1 ? "Short" : "Long",
      class: type === 1 ? "text-red-50" : "text-primary",
    };
  };

  return {
    filterMarginConfigList,
    marginConfigTokens,
    categoryAssets1,
    categoryAssets2,
    getPositionType,
  };
}
