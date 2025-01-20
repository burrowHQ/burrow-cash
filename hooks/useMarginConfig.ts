import { getAssets, getAssetsMEME } from "../redux/assetsSelectors";
import { useAppSelector } from "../redux/hooks";
import { getMarginConfig, getMarginConfigMEME } from "../redux/marginConfigSelectors";
import { Asset } from "../redux/assetState";
import { useRegisterTokenType } from "./useRegisterTokenType";

export function useMarginConfigToken() {
  const { filteredTokenTypeMap } = useRegisterTokenType();
  const assets = useAppSelector(getAssets);
  const assetsMEME = useAppSelector(getAssetsMEME);
  const marginConfigTokens = useAppSelector(getMarginConfig);
  const marginConfigTokensMEME = useAppSelector(getMarginConfigMEME);
  const combinedAssetsData = { ...assets.data, ...assetsMEME.data };

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

  const createFilteredMarginConfigList = (tokens, categoryAssets, assetsData) =>
    tokens.reduce((item, token) => {
      if (assetsData[token]) {
        item[token] = assetsData[token];
        categoryAssets.push({ ...assetsData[token] });
      }
      return item;
    }, {});
  const filterMarginConfigList = createFilteredMarginConfigList(
    filteredMarginConfigTokens1,
    categoryAssets1,
    assets.data,
  );
  const filterMarginConfigListMEME =
    Object.entries(assetsMEME.data).length > 0
      ? createFilteredMarginConfigList(
          filteredMarginConfigTokens1MEME,
          categoryAssets1MEME,
          assetsMEME.data,
        )
      : null;

  const processTokens = (tokens, categoryAssets) => {
    tokens.forEach((item: string) => {
      if (combinedAssetsData[item]?.metadata) {
        categoryAssets.push({ ...combinedAssetsData[item] });
      }
    });
  };

  processTokens(filteredMarginConfigTokens2, categoryAssets2);
  processTokens(filteredMarginConfigTokens2MEME, categoryAssets2MEME);
  const getPositionType = (token_c_id: string, token_d_id: string) => {
    if (token_c_id == token_d_id) {
      return {
        label: "Long",
        class: "text-primary",
      };
    } else {
      return {
        label: "Short",
        class: "text-red-50",
      };
    }
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
