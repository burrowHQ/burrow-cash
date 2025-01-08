import Decimal from "decimal.js";
import { getAllMetadata, getAssetsDetailed, getPrices, getUnitLptAssets } from "../store";
import { shrinkToken } from "../store/helper";
import { lpTokenPrefix } from "../utils/config";
import { IToken, IUnitLptAssetDetail, IMetadata } from "../interfaces/asset";
import { standardizeAsset } from "../utils";

const getPrice = (tokenId, priceResponse, metadata) => {
  const price = priceResponse.prices.find((p) => p.asset_id === tokenId)?.price || undefined;
  if (!price) return 0;
  const usd = Number(price.multiplier) / 10 ** (price.decimals - metadata.decimals);
  return { ...price, usd };
};
const getUnitLptPrice = (tokens: IToken[], priceMap, metadataMap) => {
  const lpPrice = tokens.reduce((acc, cur) => {
    const { token_id, amount } = cur;
    const metadata = metadataMap[token_id];
    const price = priceMap[token_id].usd || "0";
    const p = new Decimal(shrinkToken(amount, metadata.decimals)).mul(price).plus(acc);
    return p.toFixed(8);
  }, "0");
  return { multiplier: null, decimals: null, usd: lpPrice };
};
const getLptMetadata = (lp_token_details: IUnitLptAssetDetail, priceMap, metadataMap) => {
  const new_tokens = lp_token_details.tokens.reduce(
    (acc: (IToken & { price: any; metadata: IMetadata })[], cur) => {
      acc.push({
        ...cur,
        price: priceMap[cur.token_id],
        metadata: standardizeAsset(metadataMap[cur.token_id]),
      });
      return acc;
    },
    [],
  );
  return {
    ...lp_token_details,
    tokens: new_tokens,
  };
};

const getAssets = async () => {
  const assetsPendng = await getAssetsDetailed();
  // TODO for satoshi
  const assets = assetsPendng.filter((asset) => asset.token_id.indexOf(lpTokenPrefix) === -1);
  const token_ids_from_regular = assets
    .filter((asset) => asset.token_id.indexOf(lpTokenPrefix) === -1)
    .map((asset) => asset.token_id);
  const lp_tokenIds = assets
    .filter((asset) => asset.token_id.indexOf(lpTokenPrefix) > -1)
    .map((asset) => asset.token_id);
  const pool_ids = lp_tokenIds.map((id) => +id.split("-")[1]);
  const lptAssets = await getUnitLptAssets(pool_ids);
  const token_ids_from_lp: string[] = [];
  Object.values(lptAssets).forEach((item) => {
    item.tokens.forEach((t) => token_ids_from_lp.push(t.token_id));
  });
  const tokenIds = Array.from(new Set(token_ids_from_regular.concat(token_ids_from_lp)));
  const metadata = await getAllMetadata(tokenIds);
  const metadataMap = metadata.reduce((acc, cur) => ({ ...acc, [cur.token_id]: cur }), {});
  const priceResponse = await getPrices();
  const priceMap = tokenIds.reduce(
    (acc, cur) => ({ ...acc, [cur]: getPrice(cur, priceResponse, metadataMap[cur]) }),
    {},
  );
  return {
    assets: assets.map((asset) => ({
      ...asset,
      ...(asset.token_id.indexOf(lpTokenPrefix) > -1
        ? { lptMetadata: getLptMetadata(lptAssets[asset.token_id], priceMap, metadataMap) }
        : {}),
      isLpToken: asset.token_id.indexOf(lpTokenPrefix) > -1,
      price:
        asset.token_id.indexOf(lpTokenPrefix) > -1
          ? getUnitLptPrice(lptAssets[asset.token_id].tokens, priceMap, metadataMap)
          : getPrice(
              asset.token_id,
              priceResponse,
              metadata.find((m) => m.token_id === asset.token_id),
            ),
    })),
    metadata,
  };
};
export default getAssets;
