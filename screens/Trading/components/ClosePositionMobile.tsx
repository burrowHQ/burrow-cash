import { useState, createContext, useEffect, useMemo, useRef } from "react";
import { Modal as MUIModal, Box, useTheme } from "@mui/material";
import { BeatLoader } from "react-spinners";
import Decimal from "decimal.js";
import { useAppSelector, useAppDispatch } from "../../../redux/hooks";
import { Wrapper } from "../../../components/Modal/style";
import { DEFAULT_POSITION } from "../../../utils/config";
import { CloseIcon } from "../../../components/Modal/svg";
import { RightArrow, MaxPositionIcon } from "./TradingIcon";
import { toInternationalCurrencySystem_number, toDecimal } from "../../../utils/uiNumber";
import { closePosition } from "../../../store/marginActions/closePosition";
import { useEstimateSwap } from "../../../hooks/useEstimateSwap";
import { useAccountId } from "../../../hooks/hooks";
import { expandToken, shrinkToken, shrinkTokenDecimal } from "../../../store/helper";
import {
  YellowSolidSubmitButton as YellowSolidButton,
  RedSolidSubmitButton as RedSolidButton,
} from "../../../components/Modal/button";
import { beautifyPrice } from "../../../utils/beautyNumber";
import { findPathReserve } from "../../../api/get-swap-path";
import { getAssets, getAssetsMEME } from "../../../redux/assetsSelectors";
import { useMarginAccount } from "../../../hooks/useMarginAccount";
import { IClosePositionMobileProps } from "../comInterface";
import { getMarginConfig, getMarginConfigMEME } from "../../../redux/marginConfigSelectors";
import { handleTransactionHash } from "../../../services/transaction";
import { showPositionFailure } from "../../../components/HashResultModal";
import { useRegisterTokenType } from "../../../hooks/useRegisterTokenType";
import { getAppRefreshNumber } from "../../../redux/appSelectors";
import { setRefreshNumber } from "../../../redux/appSlice";
import { TagToolTip } from "../../../components/ToolTip";
import { FeeContainer } from "../../../components/Modal/components";

export const ModalContext = createContext(null) as any;
const ClosePositionMobile: React.FC<IClosePositionMobileProps> = ({
  open,
  onClose,
  extraProps,
}) => {
  const {
    itemKey,
    item,
    getAssetById,
    getPositionType,
    getAssetDetails,
    parseTokenValue,
    calculateLeverage,
    entryPrice,
    pnl,
  } = extraProps;

  const { filteredTokenTypeMap } = useRegisterTokenType();
  const [showFeeModal, setShowFeeModal] = useState<boolean>(false);
  const [selectedCollateralType, setSelectedCollateralType] = useState<string>(DEFAULT_POSITION);
  const [tokenInAmount, setTokenInAmount] = useState<string | null>(null);
  const [tokenInAmountPnl, setTokenInAmountPnl] = useState<string | null>(null);
  const [isProcessingTx, setIsProcessingTx] = useState<boolean>(false);
  const [isEstimating, setIsEstimating] = useState<boolean>(false);
  const [forceUpdate, setForceUpdate] = useState<number>(0);
  const [swapUnSecurity, setSwapUnSecurity] = useState<boolean>(false);
  const positionType = getPositionType(item.token_c_info.token_id, item.token_d_info.token_id);
  const isMainStream = filteredTokenTypeMap.mainStream.includes(
    positionType.label === "Long" ? item.token_p_id : item.token_d_info.token_id,
  );
  const isMemeStream = filteredTokenTypeMap.memeStream.includes(
    positionType.label === "Long" ? item.token_p_id : item.token_d_info.token_id,
  );
  const theme = useTheme();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const assets = useAppSelector(isMainStream ? getAssets : getAssetsMEME);
  const { marginAccountList, marginAccountListMEME } = useMarginAccount();
  const { ReduxcategoryAssets1, ReduxSlippageTolerance } = useAppSelector(
    (state) => state.category,
  );
  const accountId = useAccountId();
  const assetD = getAssetById(item.token_d_info.token_id, item);
  const assetC = getAssetById(item.token_c_info.token_id, item);
  const assetP = getAssetById(item.token_p_id, item);
  const baseTokenId = positionType.label === "Long" ? item.token_p_id : item.token_d_info.token_id;
  const { price: priceD, symbol: symbolD, decimals: decimalsD } = getAssetDetails(assetD);
  const { price: priceC, symbol: symbolC, decimals: decimalsC } = getAssetDetails(assetC);
  const { price: priceP, symbol: symbolP, decimals: decimalsP } = getAssetDetails(assetP);

  const leverageD = parseTokenValue(item.token_d_info.balance, decimalsD);
  const leverageC = parseTokenValue(item.token_c_info.balance, decimalsC);
  const leverage = calculateLeverage(leverageD, priceD, leverageC, priceC);

  const sizeValueLong = parseTokenValue(item.token_p_amount, decimalsP);
  const sizeValueShort = parseTokenValue(item.token_d_info.balance, decimalsD);
  const sizeValue =
    positionType.label === "Long" ? sizeValueLong * (priceP || 0) : sizeValueShort * (priceD || 0);

  const netValue = parseTokenValue(item.token_c_info.balance, decimalsC) * (priceC || 0);
  const collateral = parseTokenValue(item.token_c_info.balance, decimalsC);
  const indexPrice =
    positionType.label === "Long"
      ? new Decimal(priceP || 0).div(priceD || 1).toFixed()
      : new Decimal(priceD || 0).div(priceP || 1).toFixed();

  const actionShowRedColor = positionType.label === "Long";
  const marginConfig = useAppSelector(isMainStream ? getMarginConfig : getMarginConfigMEME);
  const appRefreshNumber = useAppSelector(getAppRefreshNumber);
  const dispatch = useAppDispatch();

  // get estimate token in amount
  useEffect(() => {
    if (positionType.label === "Short") {
      getMinRequiredPAmount().then((res: any) => {
        const { requiredPAmountOnShort, requiredPAmountOnShort_pnl } = res;
        setTokenInAmount(requiredPAmountOnShort || "0");
        setTokenInAmountPnl(requiredPAmountOnShort_pnl || "0");
      });
    } else {
      setTokenInAmount(
        shrinkTokenDecimal(item.token_p_amount, assetP.config.extra_decimals).toFixed(
          0,
          Decimal.ROUND_DOWN,
        ),
      );
    }
  }, [positionType.label]);

  // estimate
  const { estimateResult: estimateData } = useEstimateSwap({
    tokenIn_id: item.token_p_id,
    tokenOut_id: item.token_d_info.token_id,
    tokenIn_amount: shrinkToken(tokenInAmount || "0", assetP.metadata.decimals),
    account_id: accountId,
    slippageTolerance: ReduxSlippageTolerance / 100,
    forceUpdate,
  });

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setForceUpdate((prev) => prev + 1);
    }, 20_000);
    return () => clearInterval(intervalRef.current);
  }, []);
  useEffect(() => {
    setIsEstimating(!estimateData?.min_amount_out);
  }, [estimateData]);
  const Fee = useMemo(() => {
    const uahpi: any =
      shrinkToken((assets as any).data[item.token_d_info.token_id]?.uahpi, 18) ?? 0;
    const uahpi_at_open: any = isMainStream
      ? shrinkToken(marginAccountList[itemKey]?.uahpi_at_open ?? 0, 18)
      : shrinkToken(marginAccountListMEME[itemKey]?.uahpi_at_open ?? 0, 18);
    const { debt_cap } = item;
    const HPFeeAmount = new Decimal(shrinkToken(debt_cap, decimalsD) || 0).mul(
      uahpi - uahpi_at_open,
    );
    const HPFeeValue = HPFeeAmount.mul(priceD);
    return {
      HPFee: HPFeeValue.toNumber(),
      HPFeeAmount: HPFeeValue.toFixed(),
    };
  }, [assets, isMainStream, item, marginAccountList, marginAccountListMEME]);
  const pnlAfterSwap = useMemo(() => {
    if (new Decimal(estimateData?.amount_out || 0).gt(0) && new Decimal(tokenInAmount || 0).gt(0)) {
      if (positionType.label == "Long") {
        const d_balance = parseTokenValue(item.token_d_info.balance, decimalsD);
        const due_amount = new Decimal(Fee.HPFeeAmount || 0).plus(d_balance);
        const repay_amount = estimateData?.amount_out || "0";
        const pnlAfterSwap = new Decimal(repay_amount || 0).minus(due_amount).mul(priceC);
        return pnlAfterSwap.toFixed();
      } else {
        const repay_amount = shrinkToken(tokenInAmountPnl || "0", assetP.metadata.decimals);
        const p_amount = parseTokenValue(item.token_p_amount, decimalsP);
        const pnlAfterSwap = new Decimal(p_amount || 0).minus(repay_amount || 0).mul(priceC);
        return pnlAfterSwap.toFixed();
      }
    }
  }, [
    estimateData?.amount_out,
    positionType.label,
    tokenInAmount,
    tokenInAmountPnl,
    item,
    Fee.HPFeeAmount,
    assetP,
    assetD,
    decimalsP,
    priceC,
  ]);

  // Methods
  const handleCloseOpsitionEvt = async () => {
    // Swap Out Trial Calculation Result Verification
    const regular_p_value = new Decimal(
      shrinkToken(tokenInAmount || "0", assetP.metadata.decimals),
    ).mul(assetP.price?.usd || 0);

    const regular_d_min_value = new Decimal(
      shrinkToken(estimateData!.min_amount_out || 0, assetD.metadata.decimals),
    ).mul(assetD.price?.usd || 0);
    const max_slippage_rate =
      marginConfig.listBaseTokenConfig[baseTokenId]?.max_common_slippage_rate ||
      marginConfig.defaultBaseTokenConfig.max_common_slippage_rate;
    const saft_p_value = regular_p_value.mul(1 - max_slippage_rate / 10000);
    if (regular_d_min_value.lte(saft_p_value)) {
      setIsProcessingTx(false);
      setSwapUnSecurity(true);
      return;
    }
    setIsProcessingTx(true);
    setSwapUnSecurity(false);

    try {
      const res = await closePosition({
        isLong: positionType.label === "Long",
        swap_indication: estimateData!.swap_indication,
        min_token_d_amount: expandToken(
          estimateData!.min_amount_out,
          assetD.config.extra_decimals || 0,
          0,
        ),
        pos_id: itemKey,
        token_p_id: item.token_p_id,
        token_d_id: item.token_d_info.token_id,
        token_p_amount: expandToken(tokenInAmount || "0", assetP.config.extra_decimals, 0),
        isMeme: isMemeStream,
      });
      onClose();
      if (res) {
        const transactionHashes = res.map((item) => {
          if (!item?.transaction?.hash) {
            throw new Error("Invalid transaction hash");
          }
          return item.transaction.hash;
        });
        await handleTransactionHash(transactionHashes);
        dispatch(setRefreshNumber(appRefreshNumber + 1));
      }
    } catch (error) {
      showPositionFailure({
        title: "Transactions error",
        errorMessage: error instanceof Error ? error.message : JSON.stringify(error),
      });
    } finally {
      setIsProcessingTx(false);
    }
  };

  async function getMinRequiredPAmount() {
    const mins = 5;
    const dAmount = shrinkTokenDecimal(
      item.token_d_info.balance,
      assetD.config.extra_decimals,
    ).toFixed(0, Decimal.ROUND_UP);
    const accruedInterest = new Decimal(assetD.borrow_apr).mul(dAmount).div(365 * 24 * 60 * mins);
    const totalHpFeePending = get_total_hp_fee();
    const totalHpFee = shrinkTokenDecimal(totalHpFeePending, assetD.config.extra_decimals).toFixed(
      0,
      Decimal.ROUND_UP,
    );
    const slippage = Number(ReduxSlippageTolerance) / 100;
    const min_amount_out = accruedInterest.plus(totalHpFee).plus(dAmount);
    const amountOut = min_amount_out.div(1 - slippage);
    const res = await findPathReserve({
      amountOut: amountOut.toFixed(0, Decimal.ROUND_UP),
      tokenIn: item.token_p_id,
      tokenOut: item.token_d_info.token_id,
      slippage: Number(ReduxSlippageTolerance) / 100,
    });
    const res_pnl = await findPathReserve({
      amountOut: min_amount_out.toFixed(0, Decimal.ROUND_UP),
      tokenIn: item.token_p_id,
      tokenOut: item.token_d_info.token_id,
      slippage: 0,
    });
    const requiredPAmount = res.result_data.amount_in;
    const requiredPAmount_pnl = res_pnl.result_data.amount_in;
    const token_p_amount = shrinkTokenDecimal(
      item.token_p_amount,
      assetP.config.extra_decimals,
    ).toFixed(0, Decimal.ROUND_UP);
    const balance_c_plus_p = shrinkTokenDecimal(
      new Decimal(item?.token_c_info?.balance || 0).plus(item.token_p_amount || 0).toFixed(0),
      assetP.config.extra_decimals,
    ).toFixed(0, Decimal.ROUND_DOWN);
    // no path from findPathExactOut api
    if (new Decimal(requiredPAmount || 0).eq(0)) {
      return {
        requiredPAmountOnShort: balance_c_plus_p,
        requiredPAmountOnShort_pnl: balance_c_plus_p,
      };
    }
    const requiredPAmountOnShort = Decimal.min(balance_c_plus_p, requiredPAmount).toFixed(0);
    const requiredPAmountOnShort_pnl = Decimal.min(balance_c_plus_p, requiredPAmount_pnl).toFixed(
      0,
    );
    return {
      requiredPAmountOnShort,
      requiredPAmountOnShort_pnl,
    };
  }

  function get_total_hp_fee() {
    const uahpi = assetD.uahpi;
    const { uahpi_at_open, debt_cap } = item;
    return shrinkTokenDecimal(
      new Decimal(uahpi).minus(uahpi_at_open).mul(debt_cap).toFixed(0, Decimal.ROUND_UP),
      18,
    ).toFixed(0, Decimal.ROUND_UP);
  }

  // for js decimal issue TODO
  function calculateUnitAccHpInterest(holdingPositionFeeRate: string, timeDiffMs: number) {
    const UNIT = new Decimal(10).pow(18);
    const DIVISOR = new Decimal(10).pow(27);
    const HALF_DIVISOR = DIVISOR.div(2);
    const realRate = new Decimal(holdingPositionFeeRate).div(DIVISOR);
    const hp_rate = realRate.pow(timeDiffMs);
    const round_mul_u128 = UNIT.plus(HALF_DIVISOR).div(DIVISOR);
    const result = hp_rate.mul(round_mul_u128).minus(UNIT);
    return result;
  }
  const formatDecimal = (value: number) => {
    if (!value) return "0";
    return value.toFixed(6).replace(/\.?0+$/, "");
  };
  const isLoading = isEstimating || isProcessingTx;
  const isDisabled = isLoading || swapUnSecurity;
  return (
    <MUIModal open={open} onClose={onClose}>
      <Wrapper
        sx={{
          "& *::-webkit-scrollbar": {
            backgroundColor: theme.custom.scrollbarBg,
          },
        }}
      >
        <ModalContext.Provider
          value={{
            position: selectedCollateralType,
          }}
        >
          <Box sx={{ p: ["20px", "20px"] }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center">
                <p className="text-lg mr-2">Close Position</p>
                <div
                  className={`bg-opacity-10  text-xs py-0.5 pl-2.5 pr-1.5 rounded ${
                    actionShowRedColor ? "bg-primary text-primary" : "bg-orange text-orange"
                  }`}
                >
                  {positionType.label} {positionType.label === "Long" ? `${symbolP}` : `${symbolD}`}{" "}
                  {leverage.toFixed(2)}X
                </div>
              </div>
              <div className="cursor-pointer">
                <CloseIcon onClick={onClose} />
              </div>
            </div>
            <div className="pt-10 pb-8 flex items-center justify-around   -mx-5 px-5 mb-5">
              <div className="text-center leading-3">
                <p className="text-lg">
                  {positionType.label === "Long"
                    ? beautifyPrice(Number(sizeValueLong))
                    : beautifyPrice(Number(sizeValueShort))}{" "}
                  {positionType.label === "Long" ? `${symbolP}` : `${symbolD}`}
                </p>
                <span className="text-xs text-gray-300">Close amount</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="text-gray-300">Entry Price</div>
              <div>
                {entryPrice != "-" ? beautifyPrice(entryPrice) : "-"}
                <span className="text-xs text-gray-300 ml-1">({symbolC})</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="text-gray-300">Index Price</div>
              <div>
                {beautifyPrice(indexPrice)}
                <span className="text-xs text-gray-300 ml-1">({symbolC})</span>
              </div>
            </div>
            {/*  */}
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="text-gray-300">Collateral</div>
              <div className="flex items-center justify-center">
                <span className="mr-2 line-through">
                  {toInternationalCurrencySystem_number(collateral)}
                  {symbolC}
                </span>
                <RightArrow />
                <p className="ml-2"> $0.00</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="flex items-center gap-1  text-gray-300">
                Current Total PnL
                <TagToolTip title="Closing a position requires a swap to repay debt, which will incur a swap fee and price impact, ultimately affecting the final P&L." />
              </div>
              <div className="flex items-center justify-center">
                {!pnl ? (
                  <span className="text-sm text-gray-160 ml-1.5">-</span>
                ) : (
                  <span className={`text-sm ${pnl > 0 ? "text-primary" : "text-danger"} ml-1.5`}>
                    {pnl > 0 ? `+$` : `-$`}
                    {beautifyPrice(Math.abs(pnl))}
                  </span>
                )}
                <RightArrow className="mx-2" />
                {pnlAfterSwap ? (
                  <span
                    className={`text-sm ${
                      new Decimal(pnlAfterSwap).gt(0) ? "text-primary" : "text-danger"
                    }`}
                  >
                    {new Decimal(pnlAfterSwap).gt(0) ? `+$` : `-$`}
                    {beautifyPrice(Math.abs(new Decimal(pnlAfterSwap).toNumber()))}
                  </span>
                ) : (
                  <span className="text-sm text-gray-160">-</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm mb-4">
              <div className="text-gray-300">Fee</div>
              <div className="flex items-center justify-center relative">
                <p>${beautifyPrice(Number(formatDecimal(Fee.HPFee)))}</p>
              </div>
            </div>
            <FeeContainer
              loading={false}
              transactionsGasOnNear={positionType.label === "Long" ? 650 : 950}
              transactionsNumOnNear={positionType.label === "Long" ? 3 : 4}
              className="my-3"
              storage={{
                contractId: positionType.label === "Short" ? assetD.token_id : "",
                amount: "0.00125",
              }}
            />
            {swapUnSecurity && (
              <div className=" text-[#EA3F68] text-sm font-normal flex items-start mb-1">
                <MaxPositionIcon />
                <span className="ml-1">
                  Unable to close order, Oracle is abnormal or dex liquidity is insufficient.
                </span>
              </div>
            )}
            {actionShowRedColor ? (
              <YellowSolidButton
                className="w-full"
                disabled={isDisabled}
                onClick={() => {
                  localStorage.setItem("marginPopType", "Long");
                  handleCloseOpsitionEvt();
                }}
              >
                {isLoading ? <BeatLoader size={5} color="#14162B" /> : `Close`}
              </YellowSolidButton>
            ) : (
              <RedSolidButton
                className="w-full"
                disabled={isDisabled}
                onClick={() => {
                  localStorage.setItem("marginPopType", "Short");
                  handleCloseOpsitionEvt();
                }}
              >
                {isLoading ? <BeatLoader size={5} color="#14162B" /> : `Close`}
              </RedSolidButton>
            )}
          </Box>
        </ModalContext.Provider>
      </Wrapper>
    </MUIModal>
  );
};

export default ClosePositionMobile;
