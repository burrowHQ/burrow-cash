import { useState, createContext, useEffect } from "react";
import { Modal as MUIModal, Box, useTheme } from "@mui/material";
import { BeatLoader } from "react-spinners";
import { useDispatch } from "react-redux";
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
import DataSource from "../../../data/datasource";
import { shrinkToken } from "../../../store";
import { showChangeCollateralPosition } from "../../../components/HashResultModal";
import { handleTransactionHash } from "../../../services/transaction";
import { useRouterQuery } from "../../../utils/txhashContract";
import { setActiveTab } from "../../../redux/marginTabSlice";
import { getSymbolById } from "../../../transformers/nearSymbolTrans";
import { nearTokenId } from "../../../utils";

export const ModalContext = createContext(null) as any;
const ChangeCollateralMobile = ({ open, onClose, rowData, collateralTotal }) => {
  const { query } = useRouterQuery();
  const dispatch = useDispatch();
  const account = useAppSelector((state) => state.account);
  const { marginConfigTokens, getPositionType } = useMarginConfigToken();
  const { parseTokenValue, getAssetDetails, getAssetById, calculateLeverage } = useMarginAccount();
  const theme = useTheme();
  const [selectedCollateralType, setSelectedCollateralType] = useState(DEFAULT_POSITION);
  const [ChangeCollateralTab, setChangeCollateralTab] = useState("Add");
  const [inputValue, setInputValue] = useState("");
  const [addedValue, setAddedValue] = useState(0);
  const [addLeverage, setAddLeverage] = useState(0);
  const [addPnl, setAddPnl] = useState(0);
  const balance = useAppSelector(getAccountBalance);
  const [selectedLever, setSelectedLever] = useState(null);
  const [isAddCollateralLoading, setIsAddCollateralLoading] = useState(false);
  const [isDeleteCollateralLoading, setIsDeleteCollateralLoading] = useState(false);
  const handleChangeCollateralTabClick = (tab) => {
    setChangeCollateralTab(tab);
    setInputValue("");
    setAddedValue(0);
    setAddLeverage(0);
    setAddPnl(0);
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
    let newLiqPrice = 0;
    if (positionType.label === "Long") {
      const k1 = Number(newNetValue) * newLeverage * priceC;
      const k2 = 1 - marginConfigTokens.min_safety_buffer / 10000;
      newLiqPrice = (k1 / k2 - Number(newNetValue)) / sizeValueLong;
      if (Number.isNaN(newLiqPrice) || !Number.isFinite(newLiqPrice)) newLiqPrice = 0;
    } else {
      newLiqPrice =
        ((newNetValue + sizeValueLong) *
          priceC *
          (1 - marginConfigTokens.min_safety_buffer / 10000)) /
        sizeValueShort;
      if (Number.isNaN(newLiqPrice) || !Number.isFinite(newLiqPrice)) newLiqPrice = 0;
    }
    return { newNetValue, newLeverage, newLiqPrice };
  };

  const handleCollateralChange = (event, isAddition) => {
    const value = parseFloat(event.target.value);
    const tokenCInfoBalance = parseTokenValue(rowData.data.token_c_info.balance, decimalsC);
    const tokenDInfoBalance = parseTokenValue(rowData.data.token_d_info.balance, decimalsD);
    const leverage = parseTokenValue(rowData.data.token_c_info.balance, decimalsC);
    const { newNetValue, newLeverage, newLiqPrice } = calculateChange(
      value,
      isAddition,
      tokenCInfoBalance,
      tokenDInfoBalance,
      priceC,
      priceD,
    );
    setAddedValue(newNetValue);
    setAddLeverage(newLeverage);
    setAddPnl(newLiqPrice);
    if (event.target.value === "") {
      setAddedValue(0);
      setAddLeverage(0);
      setAddPnl(0);
    }
  };
  const handleAddChange = (event) => {
    const { value } = event.target;
    if (value === "" || Number(value) < 0) {
      setInputValue("");
      setAddedValue(0);
      setAddLeverage(0);
      setAddPnl(0);
      return;
    }
    if (selectedLever !== null && value !== "") {
      setSelectedLever(null);
    }
    const regex = /^\d*\.?\d*$/;
    if (!regex.test(value)) return;
    const maxAmount = getMaxAvailableAmount();
    if (value > maxAmount) {
      setInputValue(String(maxAmount));
      const syntheticEvent = {
        target: { value: String(maxAmount) },
      };
      handleCollateralChange(syntheticEvent, true);
      return;
    }
    setInputValue(value);
    handleCollateralChange(event, true);
  };
  const handleDeleteChange = (event) => {
    const { value } = event.target;
    if (value === "" || Number(value) < 0) {
      setInputValue("");
      setAddedValue(0);
      setAddLeverage(0);
      setAddPnl(0);
      return;
    }
    if (selectedLever !== null && value !== "") {
      setSelectedLever(null);
    }
    const regex = /^\d*\.?\d*$/;
    if (!regex.test(value)) return;
    const tokenCInfoBalance = parseTokenValue(rowData.data.token_c_info.balance, decimalsC);
    const maxRemovable = calculateMaxRemovable();
    const actualMaxRemovable = Math.min(tokenCInfoBalance, maxRemovable);
    if (value > actualMaxRemovable) {
      setInputValue(String(actualMaxRemovable));
      const syntheticEvent = {
        target: { value: String(actualMaxRemovable) },
      };
      handleCollateralChange(syntheticEvent, false);
      return;
    }
    setInputValue(value);
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
  const debt_assets_d = rowData.assets.find(
    (asset) => asset.token_id === rowData.data.token_d_info.token_id,
  );
  const total_cap = leverageC * priceC + sizeValueLong * priceP;
  let LiqPrice = 0;
  if (leverage > 1) {
    if (positionType.label === "Long") {
      const k1 = Number(netValue) * leverage * priceC;
      const k2 = 1 - marginConfigTokens.min_safety_buffer / 10000;
      LiqPrice = (k1 / k2 - Number(netValue) * priceC) / sizeValueLong;
      if (Number.isNaN(LiqPrice) || !Number.isFinite(LiqPrice)) LiqPrice = 0;
    } else {
      LiqPrice =
        ((netValue + sizeValueLong) * priceC * (1 - marginConfigTokens.min_safety_buffer / 10000)) /
        sizeValueShort;
      if (Number.isNaN(LiqPrice) || !Number.isFinite(LiqPrice)) LiqPrice = 0;
    }
  }
  const { pos_id } = rowData;
  const token_c_id = rowData.data.token_c_info.token_id;
  const amount = `${inputValue}`;
  const getAssetsdata = useAppSelector(getAssets);
  const assets = getAssetsdata.data;
  const handleAddCollateralClick = async () => {
    try {
      setIsAddCollateralLoading(true);
      const res = await increaseCollateral({ pos_id, token_c_id, amount, assets });
      const collateralInfo = {
        positionType: positionType.label,
        icon: iconC,
        symbol: symbolC,
        addedValue: String(addedValue),
      };
      localStorage.setItem("marginTradingTab", "my");
      localStorage.setItem("marginTransactionType", "changeCollateral");
      localStorage.setItem("collateralInfo", JSON.stringify(collateralInfo));
      onClose();
      if (res !== undefined && res !== null) {
        showChangeCollateralPosition({
          title: "Change Collateral",
          icon: iconC,
          type: positionType.label === "Long" ? "Long" : "Short",
          symbol: symbolC,
          collateral: String(addedValue),
        });
      }
    } catch (error) {
      console.error("Error adding collateral:", error);
    } finally {
      setIsAddCollateralLoading(false);
    }
  };
  const handleDeleteCollateralClick = async () => {
    try {
      setIsDeleteCollateralLoading(true);
      const res = await decreaseCollateral({ pos_id, token_c_id, amount, assets });
      const collateralInfo = {
        positionType: positionType.label,
        icon: iconC,
        symbol: symbolC,
        addedValue: String(addedValue),
      };
      dispatch(setActiveTab("my"));
      localStorage.setItem("marginTransactionType", "changeCollateral");
      localStorage.setItem("collateralInfo", JSON.stringify(collateralInfo));
      onClose();
      if (res !== undefined && res !== null) {
        showChangeCollateralPosition({
          title: "Change Collateral",
          type: positionType.label === "Long" ? "Long" : "Short",
          icon: iconC,
          symbol: symbolC,
          collateral: String(addedValue),
        });
      }
    } catch (error) {
      console.error("Error deleted collateral:", error);
    } finally {
      setIsDeleteCollateralLoading(false);
    }
  };
  const getMaxAvailableAmount = () => {
    // const currentLeverage = leverage || 1;
    const targetMinLeverage = 1;
    const assetCbalances = shrinkToken(
      account.balances[rowData.data.token_c_info.token_id],
      assetC.metadata.decimals,
    );
    const rawMaxAmount = Number(balance) / priceC;
    const getNewLeverageAfterAdd = (addAmount: number) => {
      const tokenCInfoBalance = parseTokenValue(rowData.data.token_c_info.balance, decimalsC);
      const tokenDInfoBalance = parseTokenValue(rowData.data.token_d_info.balance, decimalsD);
      const newCollateral = tokenCInfoBalance + addAmount;
      return calculateLeverage(tokenDInfoBalance, priceD, newCollateral, priceC);
    };
    let left = 0;
    let right = rawMaxAmount;
    let result = 0;
    while (left <= right) {
      const mid = (left + right) / 2;
      const newLeverage = getNewLeverageAfterAdd(mid);
      if (newLeverage >= targetMinLeverage) {
        result = mid;
        left = mid + 0.0001;
      } else {
        right = mid - 0.0001;
      }
    }
    const maxAmount = Math.min(rawMaxAmount, result);
    return Math.min(maxAmount, Number(assetCbalances));
  };
  const calculateMaxRemovable = () => {
    const tokenCInfoBalance = parseTokenValue(rowData.data.token_c_info.balance, decimalsC);
    const tokenDInfoBalance = parseTokenValue(rowData.data.token_d_info.balance, decimalsD);
    const maxLeverage = marginConfigTokens["max_leverage_rate"];
    let left = 0;
    let right = tokenCInfoBalance;
    let result = 0;
    while (left <= right) {
      const mid = (left + right) / 2;
      const remainingCollateral = tokenCInfoBalance - mid;
      const newLeverage = calculateLeverage(tokenDInfoBalance, priceD, remainingCollateral, priceC);
      if (newLeverage <= maxLeverage) {
        result = mid;
        left = mid + 0.0001;
      } else {
        right = mid - 0.0001;
      }
    }
    return result;
  };
  const handleLeverAddClick = (value) => {
    if (selectedLever === value) {
      setSelectedLever(null);
      setInputValue("");
      setAddedValue(0);
      setAddLeverage(0);
      setAddPnl(0);
      return;
    }
    setSelectedLever(value);
    const maxAmount = getMaxAvailableAmount();
    let newInputValue;
    if (value === "Max") {
      newInputValue = maxAmount;
    } else {
      const percentage = parseFloat(value);
      newInputValue = (maxAmount * percentage) / 100;
    }
    setInputValue(newInputValue);
    handleCollateralChange({ target: { value: newInputValue } }, true);
  };
  const handleLeverDeleteClick = (value) => {
    if (selectedLever === value) {
      setSelectedLever(null);
      setInputValue("");
      setAddedValue(0);
      setAddLeverage(0);
      setAddPnl(0);
      return;
    }
    setSelectedLever(value);
    const maxRemovable = calculateMaxRemovable();
    const tokenCInfoBalance = parseTokenValue(rowData.data.token_c_info.balance, decimalsC);
    const actualMaxRemovable = Math.min(tokenCInfoBalance, maxRemovable);
    let newInputValue;
    if (value === "Max") {
      newInputValue = actualMaxRemovable;
    } else {
      const percentage = parseFloat(value);
      newInputValue = (actualMaxRemovable * percentage) / 100;
    }
    setInputValue(newInputValue);
    handleCollateralChange({ target: { value: newInputValue } }, false);
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
                      ? getSymbolById(assetP.token_id, assetP.metadata?.symbol)
                      : getSymbolById(assetD.token_id, assetD.metadata?.symbol)}
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
                className={`py-2 w-1/2 text-center cursor-pointer text-gray-300 text-lg ${
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
                        type="text"
                        value={inputValue}
                        onChange={handleAddChange}
                        placeholder="0"
                      />
                      <p className="text-gray-300 text-xs mt-1.5">
                        ${inputValue === "" ? 0 : Number(inputValue) * priceC}
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
                          {" "}
                          ${toInternationalCurrencySystem_number(getMaxAvailableAmount() * priceC)}
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
                          ? getSymbolById(assetP.token_id, assetP.metadata?.symbol)
                          : getSymbolById(assetD.token_id, assetD.metadata?.symbol)}
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
                    <div>${toInternationalCurrencySystem_number(rowData.entryPrice)}</div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="text-gray-300">Liq. Price</div>
                    <div className="flex items-center justify-center">
                      {addPnl ? (
                        <>
                          <span className="text-gray-300 mr-2 line-through">
                            ${toInternationalCurrencySystem_number(LiqPrice)}
                          </span>
                          <RightArrow />
                          <p className="ml-2">${toInternationalCurrencySystem_number(addPnl)}</p>
                        </>
                      ) : (
                        <p>${toInternationalCurrencySystem_number(LiqPrice)}</p>
                      )}
                    </div>
                  </div>
                  <div
                    className={`flex items-center bg-primary justify-between text-dark-200 text-base rounded-md h-12 text-center  ${
                      Number(inputValue) === 0 || Number.isNaN(inputValue) || isAddCollateralLoading
                        ? "opacity-50 cursor-not-allowed"
                        : "opacity-100 cursor-pointer"
                    }`}
                    onClick={() => {
                      if (
                        !isAddCollateralLoading &&
                        Number(inputValue) !== 0 &&
                        !Number.isNaN(inputValue)
                      ) {
                        handleAddCollateralClick();
                      }
                    }}
                  >
                    <div className="flex-grow">
                      {isAddCollateralLoading ? (
                        <BeatLoader size={5} color="#14162B" />
                      ) : (
                        "Add Collateral"
                      )}
                    </div>
                  </div>
                </div>
              )}
              {ChangeCollateralTab === "Remove" && (
                <div className="py-2">
                  <div className=" bg-dark-600 border border-dark-500 pt-3 pb-2.5 pr-3 pl-2.5 rounded-md flex items-center justify-between mb-1.5">
                    <div>
                      <input
                        type="text"
                        value={inputValue}
                        onChange={handleDeleteChange}
                        placeholder="0"
                      />
                      <p className="text-gray-300 text-xs mt-1.5">
                        ${inputValue === "" ? 0 : Number(inputValue) * priceC}
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
                          ${toInternationalCurrencySystem_number(calculateMaxRemovable() * priceC)}
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
                          ? getSymbolById(assetP.token_id, assetP.metadata?.symbol)
                          : getSymbolById(assetD.token_id, assetD.metadata?.symbol)}
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
                    <div>${toInternationalCurrencySystem_number(rowData.entryPrice)}</div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="text-gray-300">Liq. Price</div>
                    <div className="flex items-center justify-center">
                      {addPnl ? (
                        <>
                          <span className="text-gray-300 mr-2 line-through">
                            ${toInternationalCurrencySystem_number(LiqPrice)}
                          </span>
                          <RightArrow />
                          <p className="ml-2">${toInternationalCurrencySystem_number(addPnl)}</p>
                        </>
                      ) : (
                        <p>${toInternationalCurrencySystem_number(LiqPrice)}</p>
                      )}
                    </div>
                  </div>
                  <div
                    className={`flex items-center bg-red-50 justify-between text-dark-200 text-base rounded-md h-12 text-center  ${
                      Number(inputValue) === 0 ||
                      Number.isNaN(inputValue) ||
                      isDeleteCollateralLoading
                        ? "opacity-50 cursor-not-allowed"
                        : "opacity-100 cursor-pointer"
                    }`}
                    onClick={() => {
                      if (
                        !isDeleteCollateralLoading &&
                        Number(inputValue) !== 0 &&
                        !Number.isNaN(inputValue)
                      ) {
                        handleDeleteCollateralClick();
                      }
                    }}
                  >
                    <div className="flex-grow">
                      {isDeleteCollateralLoading ? (
                        <BeatLoader size={5} color="#14162B" />
                      ) : (
                        " Remove Collateral"
                      )}
                    </div>
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
