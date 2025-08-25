import { getAssets, getAssetsMEME } from "../redux/assetsSelectors";
import { useAppSelector } from "../redux/hooks";
import { getMarginConfig, getMarginConfigMEME } from "../redux/marginConfigSelectors";
import { Asset } from "../redux/assetState";

export function useMarginConfigToken() {
  const assets = useAppSelector(getAssets);
  const assetsMEME = useAppSelector(getAssetsMEME);
  const marginConfigTokens = useAppSelector(getMarginConfig);
  const marginConfigTokensMEME = useAppSelector(getMarginConfigMEME);

  const categoryAssets1: Asset[] = [];
  const categoryAssets2: Asset[] = [];
  const categoryAssets1MEME: Asset[] = [];
  const categoryAssets2MEME: Asset[] = [];

  const filterTokens = (tokens, value) =>
    Object.entries(tokens.registered_tokens)
      .filter(
        ([_, v]) =>
          v === value && _ !== "6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near",
      )
      .map(([token]) => token);

  const filteredMarginConfigTokens1 = filterTokens(marginConfigTokens, 1);
  const filteredMarginConfigTokens1MEME = filterTokens(marginConfigTokensMEME, 1);
  const filteredMarginConfigTokens2 = filterTokens(marginConfigTokens, 2);
  const filteredMarginConfigTokens2MEME = filterTokens(marginConfigTokensMEME, 2);

  const createFilteredMarginConfigList = (tokens, categoryAssets, assetsData) =>
    tokens.reduce((item, token) => {
      if (assetsData[token]) {
        item[token] = assetsData[token];
        categoryAssets.push({ ...assetsData[token] });
      }
      return item;
    }, {});
  // get category 1 assets Array and Map
  const categoryAssets1Map = createFilteredMarginConfigList(
    filteredMarginConfigTokens1,
    categoryAssets1,
    assets.data,
  );
  // get category 1 assets MEME Array and Map
  const categoryAssets1MEMEMap =
    Object.entries(assetsMEME.data).length > 0
      ? createFilteredMarginConfigList(
          filteredMarginConfigTokens1MEME,
          categoryAssets1MEME,
          assetsMEME.data,
        )
      : null;

  const processTokens = (tokens, categoryAssets, isMEME?: boolean) => {
    tokens.forEach((item: string) => {
      let assetsData;
      if (isMEME) {
        assetsData = assetsMEME.data;
      } else {
        assetsData = assets.data;
      }
      if (assetsData[item]?.metadata) {
        categoryAssets.push({ ...assetsData[item] });
      }
    });
    return categoryAssets;
  };
  // get category 2 assets
  processTokens(filteredMarginConfigTokens2, categoryAssets2, false);
  processTokens(filteredMarginConfigTokens2MEME, categoryAssets2MEME, true);
  // get category 2 assets MEME
  const getPositionType = (token_c_id: string, token_d_id: string) => {
    if (token_c_id == token_d_id) {
      return {
        label: "Long",
        class: "text-primary",
      };
    } else {
      return {
        label: "Short",
        class: "text-orange",
      };
    }
  };
  return {
    filterMarginConfigList: { ...categoryAssets1Map },
    marginConfigTokens,
    marginConfigTokensMEME,
    categoryAssets1,
    categoryAssets2,
    categoryAssets1MEME,
    categoryAssets2MEME,
    getPositionType,
  };
}
