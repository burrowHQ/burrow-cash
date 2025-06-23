import getConfig from "../utils/config";

const config = getConfig();
export async function get_all_tokens_metadata() {
  const data = await fetch(`${config.indexUrl}/list-burrow-asset-token`)
    .then((res) => res.json())
    .catch(() => {
      return {};
    });
  Object.keys(data).reduce((acc, cur) => {
    const tokenMetadata = data[cur];
    tokenMetadata.token_id = cur;
    acc[cur] = tokenMetadata;
    return acc;
  }, {});
  return data;
}
