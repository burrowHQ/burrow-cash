import getConfig, { defaultNetwork } from "../utils/config";
import { getAuthenticationHeaders } from "../utils/signature";

const config = getConfig(defaultNetwork) as any;
const { dataServiceUrl } = config;

export async function get_token_detail(tokenId: string, isMemeCategory) {
  let response;
  const initResponse = [];
  try {
    const path = isMemeCategory ? "burrow/get_meme_token_detail" : "burrow/get_token_detail";
    response = (
      await fetch(`${dataServiceUrl}/${path}/${tokenId}`, {
        method: "GET",
        headers: {
          Authentication: getAuthenticationHeaders(`/burrow/get_meme_token_detail/${tokenId}`),
        },
      })
    )
      .json()
      .catch(() => {
        return initResponse;
      });
  } catch (err) {
    return initResponse;
  }
  return response;
}
