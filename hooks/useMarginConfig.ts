import { getAssets } from "../redux/assetsSelectors";
import { useAppSelector } from "../redux/hooks";
import { getMarginConfig } from "../redux/marginConfigSelectors";

export function useMarginConfigToken() {
  const assets = useAppSelector(getAssets);
  const marginConfigTokens = useAppSelector(getMarginConfig);
  const assetsData = assets.data;

  // add by LuKe
  const categoryAssets1: Array<any> = [];
  const categoryAssets2: Array<any> = [];

  const filteredMarginConfigTokens1 = Object.entries(marginConfigTokens.registered_tokens)
    .filter(([token, value]) => value === 1)
    .map(([token]) => token);

  const filteredMarginConfigTokens2 = Object.entries(marginConfigTokens.registered_tokens)
    .filter(([token, value]) => value === 2)
    .map(([token]) => token);

  const filterMarginConfigList = filteredMarginConfigTokens1.reduce((item, token) => {
    if (assetsData[token]) {
      item[token] = assetsData[token];
      // get categoryAssets1
      categoryAssets1.push({
        ...assetsData[token],
      });
    }
    return item;
  }, {});

  filteredMarginConfigTokens2.forEach((item: string) => {
    // security check
    if (assets && assets.data && assets.data[item] && assets.data[item].metadata) {
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
