import getConfig from "../utils/config";
import { getAuthenticationHeaders } from "../utils/signature";

const { BURROW_API_URL, indexUrl } = getConfig();

export async function get_storage_balance_of({
  contractId,
  accountId,
}: {
  contractId: string;
  accountId;
}) {
  const result = await fetch(`${BURROW_API_URL}/storage_balance_of`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token_id: contractId,
      account_id: accountId,
    }),
  }).then((res) => res.json());
  return result?.data;
}

export const addUserWallet = async (params: any) => {
  const result = await fetch(indexUrl + "/add-user-wallet", {
    method: "POST",
    headers: {
      Authentication: getAuthenticationHeaders(`/add-user-wallet`),
    },
    body: JSON.stringify(params),
  }).catch(async (res) => {
    return res;
  });
  return result;
};
