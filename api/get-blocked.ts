import getConfig, { defaultNetwork } from "../utils/config";

const config = getConfig(defaultNetwork) as any;
const { blockedApiUrl } = config;

export async function get_blocked() {
  let response;
  const initResponse = [];
  try {
    response = (await fetch(`${blockedApiUrl}/api/is-blocked`)).json();
  } catch (err) {
    return initResponse;
  }
  return response;
}
