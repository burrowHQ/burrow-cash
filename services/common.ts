import getConfig from "../utils/config";

const { BURROW_API_URL } = getConfig();

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
