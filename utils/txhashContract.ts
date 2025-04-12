import { JsonRpcProvider } from "near-api-js/lib/providers";
import { useRouter } from "next/router";
import { useMemo, useCallback } from "react";
import { base58 } from "ethers/lib/utils";
import { getNear } from "./near";
import { getAccount as getAccountWallet } from "./wallet-selector-compat";

export const handleTransactionResult = (outcome) => {
  if (Array.isArray(outcome)) {
    const errorMessage = outcome.find((o) => o.status?.Failure?.ActionError)?.status.Failure
      .ActionError as string;
    if (errorMessage) {
      throw new Error(JSON.stringify(errorMessage));
    }
    return outcome;
  } else {
    const errorMessage = outcome.status?.Failure?.ActionError as string;
    if (errorMessage) {
      throw new Error(JSON.stringify(errorMessage));
    }
    if (typeof outcome === "object") return outcome;
  }
};

export const getTransactionResult = async (txhash: string) => {
  const near = await getNear();
  const txHashArray = base58.decode(txhash);
  const result = await near.connection.provider.txStatusReceipts(txHashArray, "unnused", "FINAL");
  return handleTransactionResult(result);
};

// export const checkTransaction = async (txHash: string) => {
//   const account = await getAccountWallet();
//   const { accountId } = account;
//   const near = await getNear();
//   return (near.connection.provider as JsonRpcProvider).sendJsonRpc("EXPERIMENTAL_tx_status", [
//     txHash,
//     accountId,
//   ]);
// };

// export const checkTransactionStatus = async (txHash: string) => {
//   const near = await getNear();
//   const account = await getAccountWallet();
//   const { accountId } = account;
//   return near.connection.provider.txStatus(txHash, accountId);
// };

export function useRouterQuery() {
  const router = useRouter();
  const query = useMemo(() => router.query, [router.query]);

  const replaceQuery = useCallback(
    (q: Record<string, any>, options?: { shallow?: boolean }) => {
      const newQuery = { ...router.query };
      Object.entries(q).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          delete newQuery[key];
        } else {
          newQuery[key] = value;
        }
      });
      router.replace(
        {
          query: newQuery,
        },
        undefined,
        { shallow: options?.shallow ?? true },
      );
    },
    [router],
  );

  return { query, replaceQuery };
}

export const parsedArgs = (res: any) => {
  const buff = Buffer.from(res, "base64");
  const parsedData = buff.toString("ascii");
  return parsedData;
};
