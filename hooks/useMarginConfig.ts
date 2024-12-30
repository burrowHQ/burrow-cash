import { getAssets, getAssetsMEME } from "../redux/assetsSelectors";
import { useAppSelector } from "../redux/hooks";
import { getMarginConfig, getMarginConfigMEME } from "../redux/marginConfigSelectors";
import { Asset } from "../redux/assetState";

export function useMarginConfigToken() {
  const assets = useAppSelector(getAssets);
  const assetsMEME = useAppSelector(getAssetsMEME);
  const marginConfigTokens = useAppSelector(getMarginConfig);
  const marginConfigTokensMEME = useAppSelector(getMarginConfigMEME);
  const combinedAssetsData = { ...assets.data, ...assetsMEME.data };

  // Define a more specific type for category assets if possible

  const categoryAssets1: Asset[] = [];
  const categoryAssets2: Asset[] = [];
  const categoryAssets1MEME: Asset[] = [];
  const categoryAssets2MEME: Asset[] = [];

  const filterTokens = (tokens, value) =>
    Object.entries(tokens.registered_tokens)
      .filter(([_, v]) => v === value)
      .map(([token]) => token);

  const filteredMarginConfigTokens1 = filterTokens(marginConfigTokens, 1);
  const filteredMarginConfigTokens1MEME = filterTokens(marginConfigTokensMEME, 1);
  const filteredMarginConfigTokens2 = filterTokens(marginConfigTokens, 2);
  const filteredMarginConfigTokens2MEME = filterTokens(marginConfigTokensMEME, 2);

  const createFilteredMarginConfigList = (tokens, categoryAssets) =>
    tokens.reduce((item, token) => {
      if (combinedAssetsData[token]) {
        item[token] = combinedAssetsData[token];
        categoryAssets.push({ ...assets.data[token] });
      }
      return item;
    }, {});
  const filterMarginConfigList = createFilteredMarginConfigList(
    filteredMarginConfigTokens1,
    categoryAssets1,
  );
  const filterMarginConfigListMEME =
    Object.entries(assetsMEME.data).length > 0
      ? createFilteredMarginConfigList(filteredMarginConfigTokens1MEME, categoryAssets1MEME)
      : {};

  const processTokens = (tokens, categoryAssets) => {
    tokens.forEach((item: string) => {
      if (combinedAssetsData[item]?.metadata) {
        categoryAssets.push({ ...assets.data[item] });
      }
    });
  };

  processTokens(filteredMarginConfigTokens2, categoryAssets2);
  processTokens(filteredMarginConfigTokens2MEME, categoryAssets2MEME);

  const getPositionType = (token_id) => {
    const type = marginConfigTokens.registered_tokens[token_id];
    return {
      label: type === 1 ? "Short" : "Long",
      class: type === 1 ? "text-red-50" : "text-primary",
    };
  };

  return {
    filterMarginConfigList: { ...filterMarginConfigList, ...filterMarginConfigListMEME },
    marginConfigTokens,
    marginConfigTokensMEME,
    categoryAssets1,
    categoryAssets2,
    categoryAssets1MEME,
    categoryAssets2MEME,
    getPositionType,
  };
}
