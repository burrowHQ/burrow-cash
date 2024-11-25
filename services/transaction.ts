import { shrinkToken } from "../store";
import { getTransactionResult, parsedArgs } from "../utils/txhashContract";
import {
  showPositionResult,
  showPositionClose,
  showPositionFailure,
} from "../components/HashResultModal";

interface TransactionResult {
  txHash: string;
  result: any;
  hasStorageDeposit: boolean;
}

export const handleTransactionResults = async (
  transactionHashes: string | string[] | undefined,
  errorMessage?: string | string[],
) => {
  if (transactionHashes) {
    try {
      const txhash = Array.isArray(transactionHashes)
        ? transactionHashes
        : transactionHashes.split(",");

      const results = await Promise.all(
        txhash.map(async (txHash: string): Promise<TransactionResult> => {
          const result: any = await getTransactionResult(txHash);
          const hasStorageDeposit = result.transaction.actions.some(
            (action: any) => action?.FunctionCall?.method_name === "margin_execute_with_pyth",
          );
          return { txHash, result, hasStorageDeposit };
        }),
      );

      results.forEach(({ result, hasStorageDeposit }: TransactionResult) => {
        if (hasStorageDeposit) {
          const args = parsedArgs(result?.transaction?.actions?.[0]?.FunctionCall?.args || "");
          const { actions } = JSON.parse(args || "");
          const isLong = actions[0]?.OpenPosition?.token_p_id == "wrap.testnet";

          if (actions[0]?.CloseMTPosition) {
            showPositionClose({});
          } else {
            showPositionResult({
              title: "Open Position",
              type: isLong ? "Long" : "Short",
              price: (isLong
                ? Number(shrinkToken(actions[0]?.OpenPosition?.token_d_amount, 18)) /
                  Number(shrinkToken(actions[0]?.OpenPosition?.min_token_p_amount, 24))
                : Number(shrinkToken(actions[0]?.OpenPosition?.min_token_p_amount, 18)) /
                  Number(shrinkToken(actions[0]?.OpenPosition?.token_d_amount, 24))
              ).toString(),
              transactionHashes: txhash[0],
              positionSize: {
                amount: isLong
                  ? shrinkToken(actions[0]?.OpenPosition?.min_token_p_amount, 24, 6)
                  : shrinkToken(actions[0]?.OpenPosition?.token_d_amount, 24, 6),
                symbol: "NEAR",
                usdValue: "1000",
              },
            });
          }
        }
      });
    } catch (error) {
      console.error("Error processing transactions:", error);
    }
  }

  if (errorMessage) {
    showPositionFailure({
      title: "Open Position",
      errorMessage: decodeURIComponent(errorMessage as string),
    });
  }
};

export const handleTransactionHash = async (
  transactionHashes: string | string[] | undefined,
): Promise<TransactionResult[]> => {
  if (transactionHashes) {
    try {
      const txhash = Array.isArray(transactionHashes)
        ? transactionHashes
        : transactionHashes.split(",");

      const results = await Promise.all(
        txhash.map(async (txHash: string): Promise<TransactionResult> => {
          const result: any = await getTransactionResult(txHash);
          const hasStorageDeposit = result.transaction.actions.some(
            (action: any) => action?.FunctionCall?.method_name === "margin_execute_with_pyth",
          );
          return { txHash, result, hasStorageDeposit };
        }),
      );

      return results;
    } catch (error) {
      console.error("Error processing transactions:", error);
      return [];
    }
  }
  return [];
};
