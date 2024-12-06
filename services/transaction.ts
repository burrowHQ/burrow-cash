import { shrinkToken } from "../store";
import { getTransactionResult, parsedArgs } from "../utils/txhashContract";
import {
  showPositionResult,
  showPositionClose,
  showPositionFailure,
} from "../components/HashResultModal";
import { useMarginConfigToken } from "../hooks/useMarginConfig";

interface TransactionResult {
  txHash: string;
  result: any;
  hasStorageDeposit: boolean;
}

export const handleTransactionResults = async (
  transactionHashes: string | string[] | undefined,
  errorMessage?: string | string[],
  cate1?: Array<string>,
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

      const shouldShowClose = results.some(({ result, hasStorageDeposit }: TransactionResult) => {
        if (hasStorageDeposit) {
          const args = parsedArgs(result?.transaction?.actions?.[0]?.FunctionCall?.args || "");
          const { actions } = JSON.parse(args || "");
          return actions[0]?.CloseMTPosition;
        }
        return false;
      });

      if (shouldShowClose) {
        const marginPopType = localStorage.getItem("marginPopType") as "Long" | "Short" | undefined;
        showPositionClose({ type: marginPopType || "Long" });
        return;
      }

      results.forEach(({ result, hasStorageDeposit }: TransactionResult) => {
        if (hasStorageDeposit) {
          const args = parsedArgs(result?.transaction?.actions?.[0]?.FunctionCall?.args || "");
          const { actions } = JSON.parse(args || "");
          console.log(actions, "actions....");
          const isLong = cate1?.includes(actions[0]?.OpenPosition?.token_p_id);
          const cateSymbolAndDecimals = JSON.parse(
            localStorage.getItem("cateSymbolAndDecimals") || "{}",
          );
          showPositionResult({
            title: "Open Position",
            type: isLong ? "Long" : "Short",
            price: (isLong
              ? Number(shrinkToken(actions[0]?.OpenPosition?.token_d_amount, 18)) /
                Number(
                  shrinkToken(
                    actions[0]?.OpenPosition?.min_token_p_amount,
                    cateSymbolAndDecimals?.decimals || 24,
                  ),
                )
              : Number(shrinkToken(actions[0]?.OpenPosition?.min_token_p_amount, 18)) /
                Number(
                  shrinkToken(
                    actions[0]?.OpenPosition?.token_d_amount,
                    cateSymbolAndDecimals?.decimals || 24,
                  ),
                )
            ).toString(),
            transactionHashes: txhash[0],
            positionSize: {
              amount: isLong
                ? shrinkToken(
                    actions[0]?.OpenPosition?.min_token_p_amount,
                    cateSymbolAndDecimals?.decimals || 24,
                    6,
                  )
                : shrinkToken(actions[0]?.OpenPosition?.token_d_amount, 24, 6),
              symbol: cateSymbolAndDecimals?.cateSymbol || "NEAR",
              usdValue: "1000",
            },
          });
        }
      });
    } catch (error) {
      console.error("Error processing transactions:", error);
    }
  }

  if (errorMessage) {
    showPositionFailure({
      title: "Transactions error",
      errorMessage: decodeURIComponent(errorMessage as string),
    });
  }
};

export const handleTransactionHash = async (
  transactionHashes: string | string[] | undefined,
  errorMessage?: string | string[],
): Promise<TransactionResult[]> => {
  if (transactionHashes) {
    try {
      const txhash = Array.isArray(transactionHashes)
        ? transactionHashes
        : transactionHashes.split(",");

      const results = await Promise.all(
        txhash.map(async (txHash: string): Promise<TransactionResult> => {
          const result: any = await getTransactionResult(txHash);
          let hasStorageDeposit = false;

          const isMarginExecute = result.transaction.actions.some(
            (action: any) => action?.FunctionCall?.method_name === "margin_execute_with_pyth",
          );

          if (isMarginExecute) {
            const args = parsedArgs(result?.transaction?.actions?.[0]?.FunctionCall?.args || "");
            const { actions } = JSON.parse(args || "");
            hasStorageDeposit = !actions[0]?.CloseMTPosition;
          }

          return { txHash, result, hasStorageDeposit };
        }),
      );

      // 检查是否有任何一个交易的 hasStorageDeposit 为 false
      const hasAnyFalseStorageDeposit = results.some((result) => !result.hasStorageDeposit);

      // 如果有任何一个为 false，则所有结果的 hasStorageDeposit 都设为 false
      if (hasAnyFalseStorageDeposit) {
        return results.map((result) => ({
          ...result,
          hasStorageDeposit: false,
        }));
      }

      return results;
    } catch (error) {
      console.error("Error processing transactions:", error);
      return [];
    }
  }
  return [];
};
