import { useState, createContext } from "react";
import { Modal as MUIModal, Box, useTheme } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { Wrapper } from "../../../components/Modal/style";
import { DEFAULT_POSITION } from "../../../utils/config";
import { CloseIcon } from "../../../components/Modal/svg";
import { RefLogoIcon, RightArrow, RightShoulder } from "./TradingIcon";
import { toInternationalCurrencySystem_number, toDecimal } from "../../../utils/uiNumber";
import { closePosition } from "../../../store/marginActions/closePosition";
import { useEstimateSwap } from "../../../hooks/useEstimateSwap";
import { useAccountId } from "../../../hooks/hooks";
import { usePoolsData } from "../../../hooks/useGetPoolsData";
import { shrinkToken } from "../../../store/helper";

export const ModalContext = createContext(null) as any;
const ClosePositionMobile = ({ open, onClose, extraProps }) => {
  const { ReduxSlippageTolerance } = useAppSelector((state) => state.category);
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
  } = extraProps;
  //
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
  const entryPrice =
    positionType.label === "Long"
      ? sizeValueLong === 0
        ? 0
        : (leverageD * priceD) / sizeValueLong
      : sizeValueShort === 0
      ? 0
      : netValue / sizeValueShort;
  const indexPrice = positionType.label === "Long" ? priceP : priceD;
  const rowData = {
    pos_id: itemKey,
    data: item,
  };

  const dispatch = useAppDispatch();
  const theme = useTheme();
  const [selectedCollateralType, setSelectedCollateralType] = useState(DEFAULT_POSITION);
  const actionShowRedColor = positionType.label === "Long";

  const estimateData = useEstimateSwap({
    tokenIn_id: item.token_p_id,
    tokenOut_id: item.token_d_info.token_id,
    tokenIn_amount:
      item.token_p_id == item.token_c_info.token_id
        ? shrinkToken(Number(item.token_p_amount) + Number(item.token_c_info.balance), decimalsP)
        : shrinkToken(item.token_p_amount, decimalsP),
    account_id: accountId,
    simplePools,
    stablePools,
    stablePoolsDetail,
    slippageTolerance: ReduxSlippageTolerance / 100,
  });
  console.log(estimateData, "85>>>");

  const handleCloseOpsitionEvt = async () => {
    console.log(extraProps, "extraProps....");
    try {
      const res = await closePosition({
        isLong: positionType.label === "Long",
        swap_indication: estimateData.swap_indication,
        min_token_d_amount: estimateData.min_amount_out,
        pos_id: itemKey,
        token_p_id: item.token_p_id,
        token_d_id: item.token_d_info.token_id,
        token_p_amount:
          item.token_p_id == item.token_c_info.token_id
            ? toDecimal(Number(item.token_p_amount) + Number(item.token_c_info.balance))
            : item.token_p_amount,
      });
    } catch (error) {
      console.log(error);
    }
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
                  ${toInternationalCurrencySystem_number(sizeValue)}{" "}
                  {positionType.label === "Long" ? `${symbolP}` : `${symbolD}`}
                </p>
                <span className="text-xs text-gray-300">Close amount</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="text-gray-300">Entry & Index Price</div>
              <div>
                ${entryPrice} / ${indexPrice}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mb-4">
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
            </div>
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
                <span className="text-xs text-gray-300 ml-1.5">-</span>
              </div>
            </div>
            <div
              className={`flex items-center justify-between text-dark-200 text-base rounded-md h-12 text-center cursor-pointer ${
                actionShowRedColor ? "bg-primary" : "bg-red-50"
              }`}
              onClick={handleCloseOpsitionEvt}
            >
              <div className="flex-grow">Close</div>
            </div>
          </Box>
        </ModalContext.Provider>
      </Wrapper>
    </MUIModal>
  );
};

export default ClosePositionMobile;
