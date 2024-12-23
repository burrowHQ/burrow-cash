import { useState, createContext, useEffect, useMemo, useRef } from "react";
import { Modal as MUIModal, Box, useTheme } from "@mui/material";
import { BeatLoader } from "react-spinners";
import Decimal from "decimal.js";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { Wrapper } from "../../../components/Modal/style";
import { DEFAULT_POSITION } from "../../../utils/config";
import { CloseIcon } from "../../../components/Modal/svg";
import { RefLogoIcon, RightArrow, RightShoulder } from "./TradingIcon";
import { toInternationalCurrencySystem_number, toDecimal } from "../../../utils/uiNumber";
import { closePosition } from "../../../store/marginActions/closePosition";
import { useEstimateSwap } from "../../../hooks/useEstimateSwap";
import { useAccountId, useAvailableAssets } from "../../../hooks/hooks";
import { usePoolsData } from "../../../hooks/useGetPoolsData";
import {
  expandToken,
  shrinkToken,
  shrinkTokenDecimal,
  expandTokenDecimal,
} from "../../../store/helper";
import {
  YellowSolidSubmitButton as YellowSolidButton,
  RedSolidSubmitButton as RedSolidButton,
} from "../../../components/Modal/button";
import { showPositionClose } from "../../../components/HashResultModal";
import { beautifyPrice } from "../../../utils/beautyNumbet";
import { findPathReserve } from "../../../api/get-swap-path";
import { getMarginConfig } from "../../../redux/marginConfigSelectors";
import { getAssets } from "../../../redux/assetsSelectors";
import { useMarginAccount } from "../../../hooks/useMarginAccount";

export const ModalContext = createContext(null) as any;
const ClosePositionMobile = ({ open, onClose, extraProps }) => {
  const {
    itemKey,
    index,
    item,
    getAssetById,
    getPositionType,
    getAssetDetails,
    parseTokenValue,
    calculateLeverage,
    LiqPrice,
    entryPrice,
  } = extraProps;
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [selectedCollateralType, setSelectedCollateralType] = useState(DEFAULT_POSITION);
  const [tokenInAmount, setTokenInAmount] = useState<string | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  const theme = useTheme();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const assets = useAppSelector(getAssets);
  const { marginAccountList } = useMarginAccount();
  const {
    ReduxcategoryAssets1,
    ReduxcategoryAssets2,
    ReduxcategoryCurrentBalance1,
    ReduxcategoryCurrentBalance2,
    ReduxSlippageTolerance,
  } = useAppSelector((state) => state.category);
  const marginAccount = useAppSelector((state) => state.marginAccount);
  const accountId = useAccountId();
  const { simplePools, stablePools, stablePoolsDetail } = usePoolsData();

  const assetD = getAssetById(item.token_d_info.token_id);
  const assetC = getAssetById(item.token_c_info.token_id);
  const assetP = getAssetById(item.token_p_id);
  const { price: priceD, symbol: symbolD, decimals: decimalsD } = getAssetDetails(assetD);
  const { price: priceC, symbol: symbolC, decimals: decimalsC } = getAssetDetails(assetC);
  const { price: priceP, symbol: symbolP, decimals: decimalsP } = getAssetDetails(assetP);
  const leverageD = parseTokenValue(item.token_d_info.balance, decimalsD);
  const leverageC = parseTokenValue(item.token_c_info.balance, decimalsC);
  const leverage = calculateLeverage(leverageD, priceD, leverageC, priceC);
  const positionType = getPositionType(item.token_d_info.token_id);
  const sizeValueLong = parseTokenValue(item.token_p_amount, decimalsP);
  const sizeValueShort = parseTokenValue(item.token_d_info.balance, decimalsD);
  const sizeValue =
    positionType.label === "Long" ? sizeValueLong * (priceP || 0) : sizeValueShort * (priceD || 0);
  const netValue = parseTokenValue(item.token_c_info.balance, decimalsC) * (priceC || 0);
  const collateral = parseTokenValue(item.token_c_info.balance, decimalsC);
  const indexPrice = positionType.label === "Long" ? priceP : priceD;
  // console.log("-----------------assetD", assetD);
  // console.log("-----------------assetC", assetC);
  // console.log("-----------------assetP", assetP);
  // console.log("-----------------item", item);
  const actionShowRedColor = positionType.label === "Long";

  // get estimate token in amount
  useEffect(() => {
    if (positionType.label === "Short") {
      // quote to get how much p is needed to pay off the debt
      getMinRequiredPAmount().then((res) => {
        setTokenInAmount(res || "0");
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
  const estimateData = useEstimateSwap({
    tokenIn_id: item.token_p_id,
    tokenOut_id: item.token_d_info.token_id,
    tokenIn_amount: shrinkToken(tokenInAmount || "0", assetP.metadata.decimals),
    account_id: accountId,
    simplePools,
    stablePools,
    stablePoolsDetail,
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
    setIsDisabled(!estimateData?.swap_indication || !estimateData?.min_amount_out);
  }, [estimateData]);
  const Fee = useMemo(() => {
    const uahpi: any = shrinkToken((assets as any).data[item.token_p_id]?.uahpi, 18) ?? 0;
    const uahpi_at_open: any = shrinkToken(marginAccountList[itemKey]?.uahpi_at_open ?? 0, 18) ?? 0;
    const { debt_cap } = item;
    return {
      HPFee: +shrinkToken(debt_cap, decimalsD) * priceD * (uahpi * 1 - uahpi_at_open * 1),
      swapFee:
        ((estimateData?.fee ?? 0) / 10000) *
        +shrinkToken(tokenInAmount || "0", assetP.metadata.decimals) *
        (actionShowRedColor ? 1 : priceD || 0),
    };
  }, [collateral, ReduxcategoryAssets1, estimateData]);

  // close position action
  const handleCloseOpsitionEvt = async () => {
    setIsDisabled(true);
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
      });

      onClose();
      if (res !== undefined && res !== null) {
        showPositionClose({
          type: positionType.label,
        });
      }
    } catch (error) {
      console.error("Failed to close position:", error);
    } finally {
      setIsDisabled(false);
    }
  };
  async function getMinRequiredPAmount() {
    const mins = 5;
    const dAmount = shrinkTokenDecimal(
      item.token_d_info.balance,
      assetD.config.extra_decimals,
    ).toFixed(0, Decimal.ROUND_UP);
    const accruedInterest = new Decimal(assetD.borrow_apr).mul(dAmount).div(365 * 24 * 60 * mins);
    const totalHpFee = get_total_hp_fee();
    const slippage = Number(ReduxSlippageTolerance) / 100;
    const min_amount_out = accruedInterest.plus(totalHpFee).plus(dAmount);
    const amountOut = min_amount_out.div(1 - slippage);
    const res = await findPathReserve({
      amountOut: amountOut.toFixed(0, Decimal.ROUND_UP),
      tokenIn: item.token_p_id,
      tokenOut: item.token_d_info.token_id,
      slippage: Number(ReduxSlippageTolerance) / 100,
    });
    const requiredPAmount = res.result_data.amount_in;
    const token_p_amount = shrinkTokenDecimal(
      item.token_p_amount,
      assetP.config.extra_decimals,
    ).toFixed(0, Decimal.ROUND_UP);
    const balance_c_plus_p = shrinkTokenDecimal(
      new Decimal(item?.token_c_info?.balance || 0).plus(item.token_p_amount || 0).toFixed(0),
      assetP.config.extra_decimals,
    ).toFixed(0, Decimal.ROUND_DOWN);
    const requiredPAmountOnShort = Decimal.min(
      balance_c_plus_p,
      Decimal.max(requiredPAmount, token_p_amount),
    ).toFixed(0);
    return requiredPAmountOnShort;
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
                    actionShowRedColor ? "bg-primary text-primary" : "bg-red-50 text-red-50"
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
            <div className="pt-10 pb-8 flex items-center justify-around  border-b border-dark-700 -mx-5 px-5 mb-5">
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
              <div>{entryPrice ? `$${entryPrice.toFixed(2)}` : "-"}</div>
            </div>
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="text-gray-300">Index Price</div>
              <div>${indexPrice}</div>
            </div>

            {/* <div className="flex items-center justify-between text-sm mb-4">
              <div className="text-gray-300">Leverage</div>
              <div className="flex items-center justify-center">
                <span className="text-gray-300 mr-2 line-through">{leverage.toFixed(2)}X</span>
                <RightArrow />
                <p className="ml-2"> 0.0X</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="text-gray-300">Liq. Price</div>
              <div className="flex items-center justify-center">
                <span className="text-gray-300 mr-2 line-through">
                  ${toInternationalCurrencySystem_number(LiqPrice)}
                </span>
                <RightArrow />
                <p className="ml-2"> $0.00</p>
              </div>
            </div> */}
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
              <div className="text-gray-300">Current Total PNL</div>
              <div className="flex items-center justify-center">
                {/* <span className="text-red-50">-$0.0689</span> */}
                {/* <span className="text-xs text-gray-300 ml-1.5">(-2.01%)</span> */}
                <span className="text-xs text-gray-300 ml-1.5">
                  {entryPrice !== null
                    ? `$${toInternationalCurrencySystem_number(entryPrice)}`
                    : "-"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm mb-4">
              <div className="text-gray-300">Fee</div>
              <div className="flex items-center justify-center relative">
                <p
                  className="border-b border-dashed border-dark-800 cursor-pointer"
                  onMouseEnter={() => setShowFeeModal(true)}
                  onMouseLeave={() => setShowFeeModal(false)}
                >
                  ${beautifyPrice(Number(formatDecimal(Fee.swapFee + Fee.HPFee)))}
                </p>

                {showFeeModal && (
                  <div className="absolute bg-[#14162B] text-white h-[50px] p-2 rounded text-xs top-[30px] left-[-66px] flex flex-col items-start justify-between z-[1] w-auto">
                    <p>
                      <span className="mr-1 whitespace-nowrap">Hold Fee:</span>$
                      {beautifyPrice(Fee.HPFee)}
                    </p>
                    <p>
                      <span className="mr-1 whitespace-nowrap">Trade Fee:</span>$
                      {beautifyPrice(Fee.swapFee)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* <div
              className={`flex items-center justify-between text-dark-200 text-base rounded-md h-12 text-center cursor-pointer ${
                actionShowRedColor ? "bg-primary" : "bg-red-50"
              }`}
              onClick={handleCloseOpsitionEvt}
            >
              <div className="flex-grow">Close</div>
            </div> */}

            {actionShowRedColor ? (
              <YellowSolidButton
                className="w-full"
                disabled={isDisabled}
                onClick={() => {
                  localStorage.setItem("marginPopType", "Long");
                  handleCloseOpsitionEvt();
                }}
              >
                {isDisabled ? <BeatLoader size={5} color="#14162B" /> : `Close`}
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
                {isDisabled ? <BeatLoader size={5} color="#14162B" /> : `Close`}
              </RedSolidButton>
            )}
          </Box>
        </ModalContext.Provider>
      </Wrapper>
    </MUIModal>
  );
};

export default ClosePositionMobile;
