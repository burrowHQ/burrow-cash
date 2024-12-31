import { shrinkToken } from "../store";
import { getTransactionResult, parsedArgs } from "../utils/txhashContract";
import {
  showPositionResult,
  showPositionClose,
  showPositionFailure,
  showChangeCollateralPosition,
} from "../components/HashResultModal";
import { useMarginConfigToken } from "../hooks/useMarginConfig";
import { LOGIC_MEMECONTRACT_NAME } from "../utils/config";

interface TransactionResult {
  txHash: string;
  result: any;
  hasStorageDeposit: boolean;
  hasStorageDepositClosePosition?: boolean;
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
          let hasStorageDeposit = false;
          let hasStorageDepositClosePosition = false;

          const args = parsedArgs(result?.transaction?.actions?.[0]?.FunctionCall?.args || "");
          const parsed_Args = JSON.parse(args || "");
          const { actions } = parsed_Args;
          if (actions) {
            hasStorageDeposit = Reflect.has(parsed_Args.actions[0], "OpenPosition");
            hasStorageDepositClosePosition = Reflect.has(parsed_Args.actions[0], "CloseMTPosition");
          } else {
            const msg = JSON.parse(parsed_Args.msg);
            if (typeof msg != "string") {
              hasStorageDeposit = Reflect.has(msg?.MarginExecute?.actions?.[0], "OpenPosition");
              hasStorageDepositClosePosition = Reflect.has(
                msg?.MarginExecute?.actions?.[0],
                "CloseMTPosition",
              );
            }
          }
          return { txHash, result, hasStorageDeposit, hasStorageDepositClosePosition };
        }),
      );

      const shouldShowClose = results.some(
        ({ hasStorageDepositClosePosition }: TransactionResult) => {
          return hasStorageDepositClosePosition;
        },
      );

      if (shouldShowClose) {
        const marginPopType = localStorage.getItem("marginPopType") as "Long" | "Short" | undefined;
        showPositionClose({ type: marginPopType || "Long" });
        return;
      }

      results.forEach(({ result, hasStorageDeposit }: TransactionResult) => {
        const marginTransactionType = localStorage.getItem("marginTransactionType");
        if (marginTransactionType === "changeCollateral") {
          const collateralInfo = JSON.parse(localStorage.getItem("collateralInfo") || "{}");
          showChangeCollateralPosition({
            title: "Change Collateral",
            icon: collateralInfo.iconC,
            type: collateralInfo.positionType,
            symbol: collateralInfo.symbol,
            collateral: collateralInfo.addedValue,
          });
          return;
        }
        if (hasStorageDeposit) {
          const args = parsedArgs(result?.transaction?.actions?.[0]?.FunctionCall?.args || "");
          const { actions } = JSON.parse(args || "");
          const cateSymbolAndDecimals = JSON.parse(
            localStorage.getItem("cateSymbolAndDecimals") || "{}",
          );

          if (actions) {
            const isLong = cate1?.includes(actions[0]?.OpenPosition?.token_p_id);
            showPositionResultWrapper(isLong, txhash[0], cateSymbolAndDecimals);
          } else {
            const msg = JSON.parse(
              parsedArgs(result?.transaction?.actions?.[0]?.FunctionCall?.args || ""),
            );
            const msg_ = JSON.parse(msg.msg);
            const isLong = cate1?.includes(
              msg_?.MarginExecute?.actions?.[0]?.OpenPosition?.token_p_id,
            );
            showPositionResultWrapper(isLong, txhash[0], cateSymbolAndDecimals);
          }
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

function showPositionResultWrapper(
  isLong: boolean | undefined,
  txhash: string,
  cateSymbolAndDecimals: any,
) {
  showPositionResult({
    title: "Open Position",
    type: isLong ? "Long" : "Short",
    transactionHashes: txhash,
    positionSize: {
      amount: cateSymbolAndDecimals?.amount || "",
      totalPrice: cateSymbolAndDecimals?.totalPrice || "",
      symbol: cateSymbolAndDecimals?.cateSymbol || "NEAR",
      entryPrice: cateSymbolAndDecimals?.entryPrice || "0",
    },
  });
}

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
          let hasStorageDepositClosePosition = false;

          // const isMarginExecute = result.transaction.actions.some(
          //   (action: any) => action?.FunctionCall?.method_name === "margin_execute_with_pyth",
          // );
          const args = parsedArgs(result?.transaction?.actions?.[0]?.FunctionCall?.args || "");
          const parsed_Args = JSON.parse(args || "");
          const { actions } = parsed_Args;
          if (actions) {
            hasStorageDeposit = Reflect.has(parsed_Args.actions[0], "OpenPosition");
            hasStorageDepositClosePosition = Reflect.has(parsed_Args.actions[0], "CloseMTPosition");
          } else {
            const msg = JSON.parse(parsed_Args.msg);
            if (typeof msg != "string") {
              hasStorageDeposit = Reflect.has(msg?.MarginExecute?.actions?.[0], "OpenPosition");
              hasStorageDepositClosePosition = Reflect.has(
                msg?.MarginExecute?.actions?.[0],
                "CloseMTPosition",
              );
            }
          }
          return { txHash, result, hasStorageDeposit, hasStorageDepositClosePosition };
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
