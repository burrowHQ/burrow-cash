import { useState, createContext, useEffect } from "react";
import { Modal as MUIModal, Box, useTheme } from "@mui/material";
import { Wrapper } from "../../../components/Modal/style";
import { DEFAULT_POSITION } from "../../../utils/config";
import { CloseIcon } from "../../../components/Modal/svg";
import { useMarginAccount } from "../../../hooks/useMarginAccount";
import { toInternationalCurrencySystem_number } from "../../../utils/uiNumber";
import { useMarginConfigToken } from "../../../hooks/useMarginConfig";
import { RightArrow } from "./TradingIcon";
import { increaseCollateral } from "../../../store/marginActions/increaseCollateral";
import { useAppSelector } from "../../../redux/hooks";
import { getAssets } from "../../../redux/assetsSelectors";
import { decreaseCollateral } from "../../../store/marginActions/decreaseCollateral";
import { getAccountBalance } from "../../../redux/accountSelectors";

export const ModalContext = createContext(null) as any;
const ChangeCollateralMobile = ({ open, onClose, rowData, collateralTotal }) => {
  // console.log(rowData);
  const { marginConfigTokens, getPositionType } = useMarginConfigToken();
  const { parseTokenValue, getAssetDetails, getAssetById, calculateLeverage } = useMarginAccount();
  const theme = useTheme();
  const [selectedCollateralType, setSelectedCollateralType] = useState(DEFAULT_POSITION);
  const [ChangeCollateralTab, setChangeCollateralTab] = useState("Add");
  const [inputValue, setInputValue] = useState(0);
  const [addedValue, setAddedValue] = useState(0);
  const [addLeverage, setAddLeverage] = useState(0);
  const balance = useAppSelector(getAccountBalance);
  const [selectedLever, setSelectedLever] = useState(null);
  const handleChangeCollateralTabClick = (tab) => {
    setChangeCollateralTab(tab);
    setInputValue(NaN);
    setSelectedLever(null);
  };
  const leverData = [
    { label: "25%", value: "25" },
    { label: "50%", value: "50" },
    { label: "75%", value: "75" },
    { label: "Max", value: "Max" },
  ];
  const calculateChange = (
    value,
    isAddition,
    tokenCInfoBalance,
    tokenDInfoBalance,
    priceC,
    priceD,
  ) => {
    const newValue = isAddition ? tokenCInfoBalance + value : tokenCInfoBalance - value;
    const newNetValue = newValue * priceC;
    const newLeverage = calculateLeverage(tokenDInfoBalance, priceD, newValue, priceC);
    return { newNetValue, newLeverage };
  };

  const handleCollateralChange = (event, isAddition) => {
    const value = parseFloat(event.target.value);
    const tokenCInfoBalance = parseTokenValue(rowData.data.token_c_info.balance, decimalsC);
    const tokenDInfoBalance = parseTokenValue(rowData.data.token_d_info.balance, decimalsD);
    const leverage = parseTokenValue(rowData.data.token_c_info.balance, decimalsC);
    const { newNetValue, newLeverage } = calculateChange(
      value,
      isAddition,
      tokenCInfoBalance,
      tokenDInfoBalance,
      priceC,
      priceD,
    );

    setAddedValue(newNetValue);
    setAddLeverage(newLeverage);
    setInputValue(value);
    if (event.target.value === "") {
      setAddedValue(0);
      setAddLeverage(0);
    }
  };

  const handleAddChange = (event) => {
    handleCollateralChange(event, true);
  };

  const handleDeleteChange = (event) => {
    handleCollateralChange(event, false);
  };

  const assetD = getAssetById(rowData.data.token_d_info.token_id);
  const assetC = getAssetById(rowData.data.token_c_info.token_id);
  const assetP = getAssetById(rowData.data.token_p_id);
  const { price: priceD, symbol: symbolD, decimals: decimalsD } = getAssetDetails(assetD);
  const {
    price: priceC,
    symbol: symbolC,
    icon: iconC,
    decimals: decimalsC,
  } = getAssetDetails(assetC);
  const { price: priceP, symbol: symbolP, decimals: decimalsP } = getAssetDetails(assetP);
  const leverageD = parseTokenValue(rowData.data.token_d_info.balance, decimalsD);
  const leverageC = parseTokenValue(rowData.data.token_c_info.balance, decimalsC);
  const leverage = calculateLeverage(leverageD, priceD, leverageC, priceC);
  const positionType = getPositionType(rowData.data.token_d_info.token_id);
  const sizeValueLong = parseTokenValue(rowData.data.token_p_amount, decimalsP);
  const sizeValueShort = parseTokenValue(rowData.data.token_d_info.balance, decimalsD);
  const sizeValue =
    positionType.label === "Long" ? sizeValueLong * (priceP || 0) : sizeValueShort * (priceD || 0);
  const netValue = parseTokenValue(rowData.data.token_c_info.balance, decimalsC) * (priceC || 0);
  const entryPrice =
    positionType.label === "Long"
      ? sizeValueLong === 0
        ? 0
        : (leverageD * priceD) / sizeValueLong
      : sizeValueShort === 0
      ? 0
      : netValue / sizeValueShort;
  const debt_assets_d = rowData.assets.find(
    (asset) => asset.token_id === rowData.data.token_d_info.token_id,
  );
  const total_cap = leverageC * priceC + sizeValueLong * priceP;
  const total_debt = leverageD * priceD;
  const total_hp_fee =
    (rowData.data.debt_cap *
      ((debt_assets_d?.unit_acc_hp_interest ?? 0) - rowData.data.uahpi_at_open)) /
    10 ** 18;
  const decrease_cap = total_cap * (marginConfigTokens.min_safety_buffer / 10000);
  const denominator = sizeValueLong * (1 - marginConfigTokens.min_safety_buffer / 10000);
  const LiqPrice =
    denominator !== 0
      ? (total_debt +
          total_hp_fee +
          (priceC * leverageC * marginConfigTokens.min_safety_buffer) / 10000 -
          priceC * leverageC) /
        denominator
      : 0;
  const { pos_id } = rowData;
  const token_c_id = rowData.data.token_c_info.token_id;
  const amount = `${inputValue}`;
  const getAssetsdata = useAppSelector(getAssets);
  const assets = getAssetsdata.data;
  const handleAddCollateralClick = async () => {
    try {
      await increaseCollateral({ pos_id, token_c_id, amount, assets });
    } catch (error) {
      console.error("Error adding collateral:", error);
    }
  };
  const handleDeleteCollateralClick = async () => {
    try {
      await decreaseCollateral({ pos_id, token_c_id, amount, assets });
    } catch (error) {
      console.error("Error deleted collateral:", error);
    }
  };
  const handleLeverAddClick = (value) => {
    if (selectedLever === value) {
      setSelectedLever(null);
      setInputValue(NaN);
      return;
    }
    setSelectedLever(value);
    if (value === "Max") {
      const maxPercentage = Number(balance) / priceC;
      setInputValue(Number(maxPercentage.toFixed(2)));
    } else {
      const percentage = parseFloat(value);
      const selectedPercentage = (Number(balance) * percentage) / 100 / priceC;
      setInputValue(Number(selectedPercentage.toFixed(2)));
    }
  };
  const handleLeverDeleteClick = (value) => {
    if (selectedLever === value) {
      setSelectedLever(null);
      setInputValue(NaN);
      return;
    }
    setSelectedLever(value);
    if (value === "Max") {
      const maxPercentage = collateralTotal / priceC;
      setInputValue(Number(maxPercentage.toFixed(2)));
    } else {
      const percentage = parseFloat(value);
      const selectedPercentage = (collateralTotal * percentage) / 100 / priceC;
      setInputValue(Number(selectedPercentage.toFixed(2)));
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
                <p className="text-lg mr-2">Change Collateral</p>
                <div
                  className={`bg-opacity-10  text-xs py-0.5 pl-2.5 pr-1.5 rounded text-primary ${
                    positionType.class
                  } ${positionType.label === "Long" ? "bg-primary" : "bg-red-50"}`}
                >
                  {positionType.label}
                  <span className="ml-1.5">
                    {positionType.label === "Long"
                      ? assetP.metadata?.symbol === "wNEAR"
                        ? "NEAR"
                        : assetP.metadata?.symbol
                      : assetD.metadata?.symbol === "wNEAR"
                      ? "NEAR"
                      : assetD.metadata?.symbol}
                  </span>
                </div>
              </div>
              <div className="cursor-pointer">
                <CloseIcon onClick={onClose} />
              </div>
            </div>
            <div className="flex justify-center items-center border-b border-dark-700 -mx-5 -px-5 mt-6 px-5">
              <div
                className={`py-2 w-1/2 text-center cursor-pointer text-gray-300 text-lg ${
                  ChangeCollateralTab === "Add" ? "text-primary border-b border-primary" : ""
                }`}
                onClick={() => handleChangeCollateralTabClick("Add")}
              >
                Add
              </div>
              <div
                className={`pb-3.5 w-1/2 text-center cursor-pointer text-gray-300 text-lg ${
                  ChangeCollateralTab === "Remove" ? "text-red-50 border-b border-red-50" : ""
                }`}
                onClick={() => handleChangeCollateralTabClick("Remove")}
              >
                Remove
              </div>
            </div>
            <div className="mt-4">
              {ChangeCollateralTab === "Add" && (
                <div className="py-2">
                  <div className=" bg-dark-600 border border-dark-500 pt-3 pb-2.5 pr-3 pl-2.5 rounded-md flex items-center justify-between mb-1.5">
                    <div>
                      <input
                        type="number"
                        step="any"
                        value={String(inputValue)}
                        onChange={handleAddChange}
                        placeholder="0"
                      />
                      <p className="text-gray-300 text-xs mt-1.5">
                        Add: ${Number.isNaN(inputValue) ? 0 : inputValue * priceC}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-end">
                        <img src={iconC} alt="" className="w-4 h-4" />
                        <p className="text-base ml-1">{symbolC}</p>
                      </div>
                      <p className="text-xs text-gray-300 mt-1.5">
                        Max Available: <span className="text-white"> ${balance}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end mb-7">
                    {leverData.map((item, index) => (
                      <div
                        key={index}
                        className={`bg-dark-600 border border-dark-500 py-1 px-2 rounded-md text-xs text-gray-300 mr-2 cursor-pointer hover:bg-gray-700 ${
                          selectedLever === item.value ? "bg-gray-700" : ""
                        }`}
                        onClick={() => handleLeverAddClick(item.value)}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="text-gray-300">Position Size</div>
                    <div>
                      {positionType.label === "Long"
                        ? toInternationalCurrencySystem_number(sizeValueLong)
                        : toInternationalCurrencySystem_number(leverageD)}
                      <span className="ml-1.5">
                        {positionType.label === "Long"
                          ? assetP.metadata?.symbol === "wNEAR"
                            ? "NEAR"
                            : assetP.metadata?.symbol
                          : assetD.metadata?.symbol === "wNEAR"
                          ? "NEAR"
                          : assetD.metadata?.symbol}
                      </span>
                      <span className="text-xs text-gray-300 ml-1.5">
                        (${toInternationalCurrencySystem_number(sizeValue)})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="text-gray-300">Collateral ({symbolC})</div>
                    <div className="flex items-center justify-center">
                      {addedValue ? (
                        <>
                          <span className="text-gray-300 mr-2 line-through">
                            ${toInternationalCurrencySystem_number(netValue)}
                          </span>
                          <RightArrow />
                          <p className="ml-2">
                            ${toInternationalCurrencySystem_number(addedValue)}
                          </p>
                        </>
                      ) : (
                        <p>${toInternationalCurrencySystem_number(netValue)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="text-gray-300">Leverage</div>
                    <div className="flex items-center justify-center">
                      {addLeverage ? (
                        <>
                          <span className="text-gray-300 mr-2 line-through">
                            {toInternationalCurrencySystem_number(leverage)}X
                          </span>
                          <RightArrow />
                          <p className="ml-2">
                            {toInternationalCurrencySystem_number(addLeverage)}X
                          </p>
                        </>
                      ) : (
                        <p>{toInternationalCurrencySystem_number(leverage)}X</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="text-gray-300">Entry Price</div>
                    <div>${toInternationalCurrencySystem_number(entryPrice)}</div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="text-gray-300">Liq. Price</div>
                    <div>${toInternationalCurrencySystem_number(LiqPrice)}</div>
                  </div>
                  <div
                    className={`flex items-center bg-primary justify-between text-dark-200 text-base rounded-md h-12 text-center cursor-pointer ${
                      inputValue === 0 || Number.isNaN(inputValue)
                        ? "opacity-50 pointer-events-none"
                        : "opacity-100"
                    }`}
                    onClick={handleAddCollateralClick}
                  >
                    <div className="flex-grow">Add Collateral</div>
                  </div>
                </div>
              )}
              {ChangeCollateralTab === "Remove" && (
                <div className="py-2">
                  <div className=" bg-dark-600 border border-dark-500 pt-3 pb-2.5 pr-3 pl-2.5 rounded-md flex items-center justify-between mb-1.5">
                    <div>
                      <input
                        type="number"
                        step="any"
                        value={String(inputValue)}
                        onChange={handleDeleteChange}
                        placeholder="0"
                      />
                      <p className="text-gray-300 text-xs mt-1.5">
                        Delete: ${Number.isNaN(inputValue) ? 0 : inputValue * priceC}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-end">
                        <img src={iconC} alt="" className="w-4 h-4" />
                        <p className="text-base ml-1">{symbolC}</p>
                      </div>
                      <p className="text-xs text-gray-300 mt-1.5">
                        Max Available:{" "}
                        <span className="text-white">
                          ${toInternationalCurrencySystem_number(collateralTotal)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end mb-7">
                    {leverData.map((item, index) => (
                      <div
                        key={index}
                        className={`bg-dark-600 border border-dark-500 py-1 px-2 rounded-md text-xs text-gray-300 mr-2 cursor-pointer hover:bg-gray-700 ${
                          selectedLever === item.value ? "bg-gray-700" : ""
                        }`}
                        onClick={() => handleLeverDeleteClick(item.value)}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="text-gray-300">Position Size</div>
                    <div>
                      {positionType.label === "Long"
                        ? toInternationalCurrencySystem_number(sizeValueLong)
                        : toInternationalCurrencySystem_number(leverageD)}
                      <span className="ml-1.5">
                        {positionType.label === "Long"
                          ? assetP.metadata?.symbol === "wNEAR"
                            ? "NEAR"
                            : assetP.metadata?.symbol
                          : assetD.metadata?.symbol === "wNEAR"
                          ? "NEAR"
                          : assetD.metadata?.symbol}
                      </span>
                      <span className="text-xs text-gray-300 ml-1.5">
                        (${toInternationalCurrencySystem_number(sizeValue)})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="text-gray-300">Collateral ({symbolC})</div>
                    <div className="flex items-center justify-center">
                      {addedValue ? (
                        <>
                          <span className="text-gray-300 mr-2 line-through">
                            ${toInternationalCurrencySystem_number(netValue)}
                          </span>
                          <RightArrow />
                          <p className="ml-2">
                            ${toInternationalCurrencySystem_number(addedValue)}
                          </p>
                        </>
                      ) : (
                        <p>${toInternationalCurrencySystem_number(netValue)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="text-gray-300">Leverage</div>
                    <div className="flex items-center justify-center">
                      {addLeverage ? (
                        <>
                          <span className="text-gray-300 mr-2 line-through">
                            {toInternationalCurrencySystem_number(leverage)}X
                          </span>
                          <RightArrow />
                          <p className="ml-2">
                            {toInternationalCurrencySystem_number(addLeverage)}X
                          </p>
                        </>
                      ) : (
                        <p>{toInternationalCurrencySystem_number(leverage)}X</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="text-gray-300">Entry Price</div>
                    <div>${toInternationalCurrencySystem_number(entryPrice)}</div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="text-gray-300">Liq. Price</div>
                    <div>${toInternationalCurrencySystem_number(LiqPrice)}</div>
                  </div>
                  <div
                    className={`flex items-center bg-red-50 justify-between text-dark-200 text-base rounded-md h-12 text-center cursor-pointer ${
                      inputValue === 0 || Number.isNaN(inputValue)
                        ? "opacity-50 pointer-events-none"
                        : "opacity-100"
                    }`}
                    onClick={handleDeleteCollateralClick}
                  >
                    <div className="flex-grow">Remove Collateral</div>
                  </div>
                </div>
              )}
            </div>
          </Box>
        </ModalContext.Provider>
      </Wrapper>
    </MUIModal>
  );
};

export default ChangeCollateralMobile;
