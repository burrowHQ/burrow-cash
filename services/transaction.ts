import { getTransactionResult, parsedArgs } from "../utils/txhashContract";
import {
  showPositionResult,
  showPositionClose,
  showChangeCollateralPosition,
} from "../components/HashResultModal";
import { store } from "../redux/store";
import DataSource from "../data/datasource";

interface ITransactionResult {
  txHash: string;
  result: any;
  isOpenPosition?: boolean;
  isCloseMTPosition?: boolean;
  isDecreaseCollateral?: boolean;
  isIncreaseCollateral?: boolean;
  action?: Record<string, string>;
}
export const handleTransactionHash = async (
  transactionHashes: string | string[] | undefined,
): Promise<ITransactionResult[]> => {
  if (transactionHashes) {
    try {
      // Parsing transactions
      const txhash = Array.isArray(transactionHashes)
        ? transactionHashes
        : transactionHashes.split(",");
      const results = await Promise.all(
        txhash.map(async (txHash: string): Promise<ITransactionResult> => {
          const result: any = await getTransactionResult(txHash);
          const targetReceipt_pyth = result?.receipts?.find((receipt) => {
            return (
              receipt?.receipt?.Action?.actions?.[0]?.FunctionCall?.method_name ==
              "margin_execute_with_pyth"
            );
          });
          const targetReceipt_oracle = result?.receipts?.find((receipt) => {
            return (
              receipt?.receipt?.Action?.actions?.[0]?.FunctionCall?.method_name == "oracle_call"
            );
          });
          if (targetReceipt_pyth || targetReceipt_oracle) {
            const actions = (targetReceipt_pyth || targetReceipt_oracle)?.receipt?.Action?.actions;
            const args = parsedArgs(actions?.[0]?.FunctionCall?.args || "");
            const parsed_Args = JSON.parse(args || "");
            const action = targetReceipt_pyth
              ? parsed_Args.actions[0]
              : JSON.parse(parsed_Args.msg)?.MarginExecute?.actions?.[0];
            return {
              txHash,
              result,
              isOpenPosition: Reflect.has(action, "OpenPosition"),
              isCloseMTPosition: Reflect.has(action, "CloseMTPosition"),
              isDecreaseCollateral: Reflect.has(action, "DecreaseCollateral"),
              isIncreaseCollateral: Reflect.has(action, "IncreaseCollateral"),
              action,
            };
          }
          return {
            txHash,
            result,
            isOpenPosition: false,
            isCloseMTPosition: false,
            isDecreaseCollateral: false,
            isIncreaseCollateral: false,
            action: undefined,
          };
        }),
      );
      const targetPositionTx = results.find(
        (item) => item.isOpenPosition || item.isCloseMTPosition,
      );
      const targetCollateralTx = results.find(
        (item) => item.isDecreaseCollateral || item.isIncreaseCollateral,
      );
      // Reporting transactions
      if (targetPositionTx) {
        const currentState = store.getState();
        await DataSource.shared.postMarginTradingPosition({
          addr: currentState?.account?.accountId,
          process_type: targetPositionTx.isOpenPosition ? "open" : "close",
          tx_hash: targetPositionTx.txHash,
        });
      }
      // Show transactions pop
      if (targetPositionTx?.isCloseMTPosition) {
        // close position
        const marginPopType = localStorage.getItem("marginPopType") as "Long" | "Short" | undefined;
        showPositionClose({ type: marginPopType || "Long" });
      } else if (targetPositionTx?.isOpenPosition) {
        const cateSymbolAndDecimals = JSON.parse(
          localStorage.getItem("cateSymbolAndDecimals") || "{}",
        );
        const { token_c_id, token_d_id } = targetPositionTx?.action?.OpenPosition || ({} as any);
        const isLong = token_c_id == token_d_id;
        showPositionResultWrapper(isLong, txhash[0], cateSymbolAndDecimals);
      } else if (targetCollateralTx) {
        // adjust collateral
        const collateralInfo = JSON.parse(localStorage.getItem("collateralInfo") || "{}");
        showChangeCollateralPosition({
          title: "Change Collateral",
          icon: collateralInfo.iconC,
          type: collateralInfo.positionType,
          symbol: collateralInfo.symbol,
          collateral: collateralInfo.addedValue,
        });
      }
    } catch (error) {
      console.error("Error processing transactions:", error);
    }
  }
  return [];
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
