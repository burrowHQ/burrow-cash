import React, { useState, createContext, useEffect } from "react";
import Decimal from "decimal.js";
import { Modal as MUIModal, Box, useTheme } from "@mui/material";
import { BeatLoader } from "react-spinners";
import { useAppSelector } from "../../../redux/hooks";
import { Wrapper } from "../../../components/Modal/style";
import { DEFAULT_POSITION } from "../../../utils/config";
import { CloseIcon } from "../../../components/Modal/svg";
import { RightShoulder, MaxPositionIcon } from "./TradingIcon";
import { openPosition } from "../../../store/marginActions/openPosition";
import { useMarginConfigToken } from "../../../hooks/useMarginConfig";
import { useMarginAccount } from "../../../hooks/useMarginAccount";
import {
  YellowSolidSubmitButton as YellowSolidButton,
  RedSolidSubmitButton as RedSolidButton,
} from "../../../components/Modal/button";
import { shrinkToken, expandToken } from "../../../store";
import { beautifyPrice } from "../../../utils/beautyNumber";
import { handleTransactionHash } from "../../../services/transaction";
import { showPositionFailure } from "../../../components/HashResultModal";
import { getSymbolById } from "../../../transformers/nearSymbolTrans";
import { IConfirmMobileProps } from "../comInterface";
import { useRegisterTokenType } from "../../../hooks/useRegisterTokenType";

export const ModalContext = createContext(null) as any;
const ConfirmMobile: React.FC<IConfirmMobileProps | any> = ({
  open,
  onClose,
  action,
  confirmInfo,
}) => {
  const theme = useTheme();
  const [selectedCollateralType, setSelectedCollateralType] = useState(DEFAULT_POSITION);
  const { ReduxcategoryAssets1 } = useAppSelector((state) => state.category);
  const actionShowRedColor = action === "Long";
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [isMinTokenPAmount, setIsMinTokenPAmount] = useState<boolean>(false);
  const [hasLiquidationRisk, setHasLiquidationRisk] = useState<boolean>(false);
  const { filteredTokenTypeMap } = useRegisterTokenType();
  const isMainStream = filteredTokenTypeMap.mainStream.includes(
    confirmInfo.longOutputName?.token_id,
  );
  const isMemeStream = filteredTokenTypeMap.memeStream.includes(
    confirmInfo.longOutputName?.token_id,
  );
  const { marginConfigTokens, marginConfigTokensMEME, filterMarginConfigList } =
    useMarginConfigToken();
  const { max_slippage_rate, min_safety_buffer } = isMainStream
    ? marginConfigTokens
    : marginConfigTokensMEME;

  const { getAssetDetails, getAssetById, getAssetByIdMEME } = useMarginAccount();
  const assetP = isMainStream
    ? getAssetById(
        action === "Long"
          ? confirmInfo.longOutputName?.token_id
          : confirmInfo.longInputName?.token_id,
      )
    : getAssetByIdMEME(
        action === "Long"
          ? confirmInfo.longOutputName?.token_id
          : confirmInfo.longInputName?.token_id,
      );
  const assetD = isMainStream
    ? getAssetById(
        action === "Long"
          ? confirmInfo.longInputName?.token_id
          : confirmInfo.longOutputName?.token_id,
      )
    : getAssetByIdMEME(
        action === "Long"
          ? confirmInfo.longInputName?.token_id
          : confirmInfo.longOutputName?.token_id,
      );

  const assetC = action === "Long" ? assetD : assetP;
  const decimalsD = +assetD.config.extra_decimals + +assetD.metadata.decimals;
  const decimalsP = +assetP.config.extra_decimals + +assetP.metadata.decimals;
  const decimalsC = action === "Long" ? decimalsD : decimalsP;
  const cateSymbol = getSymbolById(
    ReduxcategoryAssets1?.token_id,
    ReduxcategoryAssets1?.metadata?.symbol,
  );
  const min_amount_out_estimate = confirmInfo.estimateData.min_amount_out;
  const expand_amount_in_estimate = confirmInfo.estimateData.expand_amount_in;
  const in_extra_decimals = confirmInfo?.longInputName?.config?.extra_decimals || 0;
  const out_extra_decimals = confirmInfo?.longOutputName?.config?.extra_decimals || 0;
  const openPositionParams = {
    token_c_amount: confirmInfo.longInput,
    token_c_id: confirmInfo.longInputName?.token_id,
    token_d_amount: expandToken(
      expand_amount_in_estimate,
      action === "Long" ? in_extra_decimals : out_extra_decimals,
      0,
    ),
    token_d_id:
      action === "Long"
        ? confirmInfo.longInputName?.token_id
        : confirmInfo.longOutputName?.token_id,
    token_p_id:
      action === "Long"
        ? confirmInfo.longOutputName?.token_id
        : confirmInfo.longInputName?.token_id,
    min_token_p_amount: expandToken(
      min_amount_out_estimate,
      action === "Long" ? out_extra_decimals : in_extra_decimals,
      0,
    ),
    swap_indication: confirmInfo.estimateData.swap_indication,
    assets: confirmInfo.assets.data,
    isMeme: isMemeStream,
  };
  const confirmOpenPosition = async () => {
    setIsDisabled(true);
    let hasError = false;
    try {
      const { decimals: localDecimals } = getAssetDetails(
        isMainStream
          ? getAssetById(
              action === "Long" ? openPositionParams.token_p_id : openPositionParams.token_d_id,
            )
          : getAssetByIdMEME(
              action === "Long" ? openPositionParams.token_p_id : openPositionParams.token_d_id,
            ),
      );

      // Swap Out Trial Calculation Result Verification
      const minTokenPAmount = Number(shrinkToken(openPositionParams.min_token_p_amount, decimalsP));
      const tokenDAmount = shrinkToken(openPositionParams.token_d_amount, decimalsD);
      const tokenDPrice = confirmInfo.assets.data[openPositionParams.token_d_id].price.usd;
      const tokenPPrice = confirmInfo.assets.data[openPositionParams.token_p_id].price.usd;
      const slippageRate = 1 - max_slippage_rate / 10000;
      const calculatedValue = ((+tokenDAmount * tokenDPrice) / tokenPPrice) * slippageRate;
      console.log(
        openPositionParams,
        decimalsP,
        tokenDAmount,
        tokenDPrice,
        tokenPPrice,
        slippageRate,
        calculatedValue,
        minTokenPAmount,
        "for nico confirmOpenPosition",
      );
      if (minTokenPAmount < calculatedValue) {
        setIsMinTokenPAmount(true);
        hasError = true;
        return;
      }

      // Position Verification
      const total_c_value = new Decimal(confirmInfo.longInput || 0).mul(assetC.price?.usd || 0);
      const total_p_value = new Decimal(minTokenPAmount || 0).mul(assetP.price?.usd || 0);
      const total_d_value = new Decimal(tokenDAmount || 0).mul(assetD.price?.usd || 0);
      const total_cap = total_c_value.plus(total_p_value);
      const saft_value = total_cap.mul(1 - min_safety_buffer / 10000);
      if (saft_value.lte(total_d_value)) {
        setHasLiquidationRisk(true);
        hasError = true;
        return;
      }

      // for pop up localstorage
      const minAmountOutForPopUp = Number(
        shrinkToken(confirmInfo.estimateData?.min_amount_out, assetP.metadata.decimals),
      );
      localStorage.setItem(
        "cateSymbolAndDecimals",
        JSON.stringify({
          cateSymbol,
          decimals: localDecimals,
          amount: confirmInfo.longOutput,
          totalPrice: confirmInfo.longOutputUsd,
          entryPrice:
            action === "Long"
              ? confirmInfo.tokenInAmount / minAmountOutForPopUp
              : minAmountOutForPopUp / confirmInfo.tokenInAmount,
        }),
      );
      const res: any = await openPosition(openPositionParams);
      if (res) {
        const transactionHashes = res.map((item) => {
          if (!item?.transaction?.hash) {
            throw new Error("Invalid transaction hash");
          }
          return item.transaction.hash;
        });
        await handleTransactionHash(transactionHashes);
      }
    } catch (error) {
      showPositionFailure({
        title: "Transactions error",
        errorMessage: error instanceof Error ? error.message : JSON.stringify(error),
        type: action,
      });
    } finally {
      setIsDisabled(false);
      if (!hasError) {
        onClose(); // Only close the modal if there was no error
      }
    }
  };

  // calculate collateral value
  const collateralValue = new Decimal(confirmInfo.longInput)
    .mul(new Decimal(assetC.price?.usd || 1))
    .minus(new Decimal(confirmInfo.Fee.openPFee))
    .div(new Decimal(assetC?.price?.usd || 1));

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
                <p className="text-lg mr-2">Confirm</p>
                <div
                  className={`bg-opacity-10  text-xs py-0.5 pl-2.5 pr-1.5 rounded ${
                    actionShowRedColor ? "bg-primary text-primary" : "bg-red-50 text-red-50"
                  }`}
                >
                  {action} {cateSymbol} {confirmInfo.rangeMount}X
                </div>
              </div>
              <div className="cursor-pointer">
                <CloseIcon onClick={onClose} />
              </div>
            </div>
            <div className="pt-10 pb-8 flex items-center justify-around  border-b border-dark-700 -mx-5 px-5 mb-5">
              <div className="text-center leading-3">
                <p className="text-lg">
                  {beautifyPrice(confirmInfo.longInput)}{" "}
                  {confirmInfo.longInputName?.metadata.symbol}
                </p>
                <span className="text-xs text-gray-300">
                  ${beautifyPrice(confirmInfo.longInputUsd)}
                </span>
              </div>
              <RightShoulder />
              <div className="text-center leading-3">
                <p className="text-lg">
                  {beautifyPrice(+confirmInfo.longOutput)}{" "}
                  {getSymbolById(
                    confirmInfo.longOutputName?.token_id,
                    confirmInfo.longOutputName?.metadata.symbol,
                  )}
                </p>
                <span className="text-xs text-gray-300">
                  {action} ${beautifyPrice(confirmInfo.longOutputUsd)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="text-gray-300">Entry Price</div>
              {/* <div>${confirmInfo.entryPrice || "-"}</div> */}
              <div>
                $
                {action === "Long"
                  ? beautifyPrice(
                      confirmInfo.tokenInAmount /
                        Number(
                          shrinkToken(
                            confirmInfo.estimateData?.min_amount_out,
                            assetP.metadata.decimals,
                          ),
                        ),
                    )
                  : beautifyPrice(
                      Number(
                        shrinkToken(
                          confirmInfo.estimateData?.min_amount_out,
                          assetP.metadata.decimals,
                        ),
                      ) / confirmInfo.tokenInAmount,
                    )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm mb-4">
              <div className="text-gray-300">Collateral</div>
              <div className="text-right flex">
                {beautifyPrice(collateralValue.toNumber())}
                {confirmInfo.longInputName?.metadata.symbol}
                <span className="text-xs text-gray-300 ml-1.5">
                  ($
                  {beautifyPrice(
                    new Decimal(confirmInfo.longInputUsd)
                      .minus(confirmInfo.Fee.openPFee)
                      .toNumber(),
                  )}
                  )
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="text-gray-300">Liq. Price</div>
              <div>${beautifyPrice(confirmInfo.LiqPrice)}</div>
            </div>

            {isMinTokenPAmount && (
              <div className=" text-[#EA3F68] text-sm font-normal flex items-start mb-1">
                <MaxPositionIcon />
                <span className="ml-1">
                  Unable to place order, Oracle is abnormal or Ref liquidity is insufficient.
                </span>
              </div>
            )}
            {hasLiquidationRisk && (
              <div className=" text-[#EA3F68] text-sm font-normal flex items-start mb-1">
                <MaxPositionIcon />
                <span className="ml-1">
                  The current price fluctuation is too high. Please try creating later.
                </span>
              </div>
            )}

            {actionShowRedColor ? (
              <YellowSolidButton
                className="w-full"
                disabled={isDisabled || isMinTokenPAmount || hasLiquidationRisk}
                onClick={confirmOpenPosition}
              >
                {isDisabled ? (
                  <BeatLoader size={5} color="#14162B" />
                ) : (
                  ` Confirm ${action} ${cateSymbol} ${confirmInfo.rangeMount}X`
                )}
              </YellowSolidButton>
            ) : (
              <RedSolidButton
                className="w-full"
                disabled={isDisabled || isMinTokenPAmount || hasLiquidationRisk}
                onClick={confirmOpenPosition}
              >
                {isDisabled ? (
                  <BeatLoader size={5} color="#14162B" />
                ) : (
                  ` Confirm ${action} ${cateSymbol} ${confirmInfo.rangeMount}X`
                )}
              </RedSolidButton>
            )}
          </Box>
        </ModalContext.Provider>
      </Wrapper>
    </MUIModal>
  );
};

export default ConfirmMobile;
