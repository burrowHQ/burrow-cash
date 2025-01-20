export const ERROR_PATTERN = {
  slippageErrorPattern: /ERR_MIN_AMOUNT|slippage error/i,
  invaliParamsErrorPattern: /invalid params/i,
  ratesExpiredErrorPattern: /Rates expired/i,
  integerOverflowErrorPattern: /Integer overflow/i,
  ShareSupplyOverflowErrorPattern: /shares_total_supply overflow/i,
  tokenFrozenErrorPattern: /token frozen/i,
  poolBalanceLessPattern: /pool reserved token balance less than MIN_RESERVE/i,
  nethErrorPattern: /Smart contract panicked: explicit guest panic/i,
};
export enum TRANSACTION_ERROR_TYPE {
  SLIPPAGE_VIOLATION = "Slippage Violation",
  INVALID_PARAMS = "Invalid Params",
  RATES_EXPIRED = "Rates Expired",
  INTEGEROVERFLOW = "Integer Overflow",
  SHARESUPPLYOVERFLOW = "Share Supply Overflow",
  TOKEN_FROZEN = "Token Frozen",
  POOL_BALANCE_LESS = "Pool Balance Less Than MIN_RESERVE",
  NETH_ERROR = "Smart contract panicked",
  UNKNOWN_ERROR = "Smart contract panicked",
}

export const getErrorMessage = (receipts_outcome: any) => {
  const isSlippageError = receipts_outcome.some((outcome: any) => {
    return ERROR_PATTERN.slippageErrorPattern.test(
      outcome?.outcome?.status?.Failure?.ActionError?.kind?.FunctionCallError?.ExecutionError,
    );
  });

  const isInvalidAmountError = receipts_outcome.some((outcome: any) => {
    return ERROR_PATTERN.invaliParamsErrorPattern.test(
      outcome?.outcome?.status?.Failure?.ActionError?.kind?.FunctionCallError?.ExecutionError,
    );
  });

  const isRatesExpiredError = receipts_outcome.some((outcome: any) => {
    return ERROR_PATTERN.ratesExpiredErrorPattern.test(
      outcome?.outcome?.status?.Failure?.ActionError?.kind?.FunctionCallError?.ExecutionError,
    );
  });

  const isIntegerOverFlowError = receipts_outcome.some((outcome: any) => {
    return ERROR_PATTERN.integerOverflowErrorPattern.test(
      outcome?.outcome?.status?.Failure?.ActionError?.kind?.FunctionCallError?.ExecutionError,
    );
  });

  const isShareSupplyOerflowError = receipts_outcome.some((outcome: any) => {
    return ERROR_PATTERN.ShareSupplyOverflowErrorPattern.test(
      outcome?.outcome?.status?.Failure?.ActionError?.kind?.FunctionCallError?.ExecutionError,
    );
  });

  const isTokenFrozen = receipts_outcome.some((outcome: any) => {
    return ERROR_PATTERN.tokenFrozenErrorPattern.test(
      outcome?.outcome?.status?.Failure?.ActionError?.kind?.FunctionCallError?.ExecutionError,
    );
  });

  const isPoolBalanceLess = receipts_outcome.some((outcome: any) => {
    return ERROR_PATTERN.poolBalanceLessPattern.test(
      outcome?.outcome?.status?.Failure?.ActionError?.kind?.FunctionCallError?.ExecutionError,
    );
  });

  const isNETHErrpr = receipts_outcome.some((outcome: any) => {
    return ERROR_PATTERN.nethErrorPattern.test(
      outcome?.outcome?.status?.Failure?.ActionError?.kind?.FunctionCallError?.ExecutionError,
    );
  });
  const isOtherError = receipts_outcome.some((outcome: any) => {
    return outcome?.outcome?.status?.Failure;
  });

  if (isSlippageError) {
    return TRANSACTION_ERROR_TYPE.SLIPPAGE_VIOLATION;
  } else if (isInvalidAmountError) {
    return TRANSACTION_ERROR_TYPE.INVALID_PARAMS;
  } else if (isRatesExpiredError) {
    return TRANSACTION_ERROR_TYPE.RATES_EXPIRED;
  } else if (isIntegerOverFlowError) {
    return TRANSACTION_ERROR_TYPE.INTEGEROVERFLOW;
  } else if (isShareSupplyOerflowError) {
    return TRANSACTION_ERROR_TYPE.SHARESUPPLYOVERFLOW;
  } else if (isTokenFrozen) {
    return TRANSACTION_ERROR_TYPE.TOKEN_FROZEN;
  } else if (isPoolBalanceLess) {
    return TRANSACTION_ERROR_TYPE.POOL_BALANCE_LESS;
  } else if (isNETHErrpr) {
    return TRANSACTION_ERROR_TYPE.NETH_ERROR;
  } else if (isOtherError) {
    return TRANSACTION_ERROR_TYPE.UNKNOWN_ERROR;
  } else {
    return null;
  }
};
