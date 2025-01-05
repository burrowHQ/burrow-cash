import getConfig, { defaultNetwork } from "../utils/config";
import { getAuthenticationHeaders } from "../utils/signature";

const config = getConfig(defaultNetwork) as any;
const { liquidationUrl } = config;

export async function get_token_detail(tokenId: string) {
  let response;
  const initResponse = [];
  try {
    response = (
      await fetch(`${liquidationUrl}/burrow/get_token_detail/${tokenId}`, {
        method: "GET",
        headers: {
          Authentication: getAuthenticationHeaders(`/burrow/get_token_detail/${tokenId}`),
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
