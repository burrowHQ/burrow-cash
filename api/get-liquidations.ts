import Datasource from "../data/datasource";

type AssetsProps = {
  data: unknown;
};

export async function getLiquidations(
  accountId: string,
  page?: number,
  pageSize?: number,
  assets?: AssetsProps,
  isMeme?: boolean,
) {
  const liquidationData = await Datasource.shared.getLiquidations(
    accountId,
    page || 1,
    pageSize || 10,
    isMeme,
  );
  const unreadIds: Array<string> = [];
  liquidationData?.record_list?.forEach((d) => {
    if (d.RepaidAssets) {
      d.RepaidAssets?.forEach((a) => {
        const tokenId = a.token_id;
        const asset = assets?.data?.[tokenId];
        a.data = asset;
      });
    }
    if (d.LiquidatedAssets) {
      d.LiquidatedAssets?.forEach((a) => {
        const tokenId = a.token_id;
        const asset = assets?.data?.[tokenId];
        a.data = asset;
      });
    }
    if (d.isRead === false) {
      unreadIds.push(d.receipt_id);
    }
  });

  return { liquidationData, unreadIds };
}
