import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AddCollateral, Export } from "../../MarginTrading/components/Icon";
import ClosePositionMobile from "./ClosePositionMobile";
import ChangeCollateralMobile from "./ChangeCollateralMobile";
import { useMarginAccount } from "../../../hooks/useMarginAccount";
import { useMarginConfigToken } from "../../../hooks/useMarginConfig";
import { toInternationalCurrencySystem_number } from "../../../utils/uiNumber";
import { getAssets } from "../../../store/assets";
import { IAssetEntry } from "../../../interfaces";

const TradingTable = ({ positionsList }) => {
  const [selectedTab, setSelectedTab] = useState("positions");
  const [isClosePositionModalOpen, setIsClosePositionMobileOpen] = useState(false);
  const [isChangeCollateralMobileOpen, setIsChangeCollateralMobileOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [assets, setAssets] = useState<IAssetEntry[]>([]);
  const [closePositionModalProps, setClosePositionModalProps] = useState(null);
  const [totalCollateral, setTotalCollateral] = useState(0);
  const { marginAccountList, parseTokenValue, getAssetDetails, getAssetById, calculateLeverage } =
    useMarginAccount();
  const { getPositionType, marginConfigTokens } = useMarginConfigToken();
  const handleTabClick = (tabNumber) => {
    setSelectedTab(tabNumber);
  };
  const handleClosePositionButtonClick = (key) => {
    setClosePositionModalProps(key);
    setIsClosePositionMobileOpen(true);
  };
  const handleChangeCollateralButtonClick = (rowData) => {
    setSelectedRowData(rowData);
    setIsChangeCollateralMobileOpen(true);
  };
  const fetchAssets = async () => {
    try {
      const fetchedAssets = await getAssets();
      setAssets(fetchedAssets);
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };
  useEffect(() => {
    fetchAssets();
  }, []);
  const calculateTotalSizeValues = () => {
    let collateralTotal = 0;
    Object.values(marginAccountList).forEach((item) => {
      const assetC = getAssetById(item.token_c_info.token_id);
      const { price: priceC, symbol: symbolC, decimals: decimalsC } = getAssetDetails(assetC);
      const netValue = parseTokenValue(item.token_c_info.balance, decimalsC) * (priceC || 0);
      collateralTotal += netValue;
    });
    setTotalCollateral(collateralTotal);
  };
  useEffect(() => {
    calculateTotalSizeValues();
  }, [marginAccountList]);
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="w-full border border-dark-50 bg-gray-800 rounded-md">
        <div className="w-full border-b border-dark-50 flex">
          <Tab
            tabName="Positions"
            isSelected={selectedTab === "positions"}
            onClick={() => handleTabClick("positions")}
          />
          <Tab
            tabName="History"
            isSelected={selectedTab === "history"}
            onClick={() => handleTabClick("history")}
          />
        </div>
        <div className="py-4">
          {selectedTab === "positions" && (
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-300 text-sm font-normal">
                  <th className="pl-5">Market</th>
                  <th>Size</th>
                  <th>Net Value</th>
                  <th>Collateral</th>
                  <th>Entry Price</th>
                  <th>Index Price</th>
                  <th>Liq. Price</th>
                  <th>PLN & ROE</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {positionsList &&
                  Object.entries(positionsList).map(([key, item], index) => (
                    <PositionRow
                      index={index}
                      key={key}
                      item={item}
                      itemKey={key}
                      getAssetById={getAssetById}
                      getPositionType={getPositionType}
                      handleChangeCollateralButtonClick={handleChangeCollateralButtonClick}
                      handleClosePositionButtonClick={handleClosePositionButtonClick}
                      getAssetDetails={getAssetDetails}
                      parseTokenValue={parseTokenValue}
                      calculateLeverage={calculateLeverage}
                      marginConfigTokens={marginConfigTokens}
                      assets={assets}
                    />
                  ))}
                {isChangeCollateralMobileOpen && (
                  <ChangeCollateralMobile
                    open={isChangeCollateralMobileOpen}
                    onClose={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsChangeCollateralMobileOpen(false);
                    }}
                    rowData={selectedRowData}
                    collateralTotal={totalCollateral}
                  />
                )}
                {isClosePositionModalOpen && (
                  <ClosePositionMobile
                    open={isClosePositionModalOpen}
                    onClose={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsClosePositionMobileOpen(false);
                    }}
                    extraProps={closePositionModalProps}
                  />
                )}
              </tbody>
            </table>
          )}
          {selectedTab === "history" && (
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-300 text-sm font-normal">
                  <th className="pl-5">Market</th>
                  <th>Operation</th>
                  <th>Side</th>
                  <th>Price</th>
                  <th>Amount</th>
                  <th>Fee</th>
                  <th>Realized PNL & ROE</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                <Link href="/trading">
                  <tr className="text-base hover:bg-dark-100 cursor-pointer font-normal">
                    <td className="py-5 pl-5 ">-/-</td>
                    <td>-</td>
                    <td className="text-red-50">-</td>
                    <td>$-</td>
                    <td>100 NEAR</td>
                    <td>$1.80</td>
                    <td>--</td>
                    <td className="pr-5">
                      <div>
                        2024-01-16, 13:23
                        {/* <Export /> */}
                      </div>
                    </td>
                  </tr>
                </Link>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
const Tab = ({ tabName, isSelected, onClick }) => (
  <div
    className={`pt-6 pl-10 pb-4 pr-7 text-gray-300 text-lg cursor-pointer ${
      isSelected ? "border-b-2 border-primary text-white" : ""
    }`}
    onClick={onClick}
  >
    {tabName}
  </div>
);

const PositionRow = ({
  itemKey,
  index,
  item,
  getAssetById,
  getPositionType,
  handleChangeCollateralButtonClick,
  handleClosePositionButtonClick,
  getAssetDetails,
  parseTokenValue,
  calculateLeverage,
  assets,
  marginConfigTokens,
}) => {
  // console.log(itemKey, item, index);
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
  const marketTitle =
    positionType.label === "Long" ? `${symbolP}/${symbolC}` : `${symbolD}/${symbolC}`;

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
  const debt_assets_d = assets.find((asset) => asset.token_id === item.token_d_info.token_id);
  // const total_cap = leverageC * priceC + sizeValueLong * priceP;
  const total_debt = leverageD * priceD;
  const total_hp_fee =
    (item.debt_cap * ((debt_assets_d?.unit_acc_hp_interest ?? 0) - item.uahpi_at_open)) / 10 ** 18;
  // const decrease_cap = total_cap * (marginConfigTokens.min_safety_buffer / 10000);
  const denominator = sizeValueLong * (1 - marginConfigTokens.min_safety_buffer / 10000);
  // total_cap - decrease_cap === total_debt + total_hp_fee;
  const LiqPrice =
    denominator !== 0
      ? (total_debt +
          total_hp_fee +
          (priceC * leverageC * marginConfigTokens.min_safety_buffer) / 10000 -
          priceC * leverageC) /
        denominator
      : 0;
  const rowData = {
    pos_id: itemKey,
    data: item,
    assets,
    marginConfigTokens,
  };
  return (
    <tr className="text-base hover:bg-dark-100 cursor-pointer font-normal">
      <td className="py-5 pl-5 ">
        {marketTitle}
        <span className={`text-xs ml-1.5 ${getPositionType(item.token_d_info.token_id).class}`}>
          {getPositionType(item.token_d_info.token_id).label}
          <span className="ml-1.5">{toInternationalCurrencySystem_number(leverage)}x</span>
        </span>
      </td>
      <td>${toInternationalCurrencySystem_number(sizeValue)}</td>
      <td>${toInternationalCurrencySystem_number(netValue)}</td>
      <td>
        <div className="flex items-center">
          <p className="mr-2.5">
            {toInternationalCurrencySystem_number(collateral)}
            <span className="ml-1">{symbolC}</span>
          </p>
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleChangeCollateralButtonClick(rowData);
            }}
          >
            <AddCollateral />
          </div>
        </div>
      </td>
      <td>${toInternationalCurrencySystem_number(entryPrice)}</td>
      <td>${toInternationalCurrencySystem_number(indexPrice)}</td>
      <td>${toInternationalCurrencySystem_number(LiqPrice)}</td>
      <td>
        <div className="flex items-center">
          <p className="text-gray-1000"> -</p>
          {/* <span className="text-gray-400 text-xs">-</span> */}
        </div>
      </td>
      <td className="pr-5">
        <div
          className="text-gray-300 text-sm border border-dark-300 text-center h-6 rounded flex justify-center items-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClosePositionButtonClick({
              itemKey,
              index,
              item,
              getAssetById,
              getPositionType,
              getAssetDetails,
              parseTokenValue,
              calculateLeverage,
              LiqPrice,
            });
          }}
        >
          Close
        </div>
      </td>
    </tr>
  );
};

export default TradingTable;
