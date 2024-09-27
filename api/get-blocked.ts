import getConfig, { defaultNetwork } from "../utils/config";

const config = getConfig(defaultNetwork) as any;

export async function get_blocked() {
  let response;
  const initResponse = [];
  try {
    response = (await fetch(`https://geo.deltarpc.com/api/is-blocked`)).json();
  } catch (err) {
    return initResponse;
  }
  return response;
}
