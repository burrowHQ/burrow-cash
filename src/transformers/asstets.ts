import { IAssetDetailed, IMetadata } from "../interfaces/asset";
import { transformAssetFarms } from "./farms";
import { Assets } from "../redux/assetState";

export function transformAssets({
  assets,
  metadata,
}: {
  assets: IAssetDetailed[];
  metadata: IMetadata[];
}): Assets {
  const data = assets.reduce((map, asset) => {
    map[asset.token_id] = {
      metadata: metadata.find((m) => m.token_id === asset.token_id) as IMetadata,
      ...asset,
      farms: transformAssetFarms(asset.farms),
    };
    return map;
  }, {});

  return data;
}
