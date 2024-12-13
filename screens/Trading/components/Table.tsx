import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BeatLoader } from "react-spinners";
import { AddCollateral, Export } from "../../MarginTrading/components/Icon";
import ClosePositionMobile from "./ClosePositionMobile";
import ChangeCollateralMobile from "./ChangeCollateralMobile";
import { useMarginAccount } from "../../../hooks/useMarginAccount";
import { useMarginConfigToken } from "../../../hooks/useMarginConfig";
import { toInternationalCurrencySystem_number } from "../../../utils/uiNumber";
import { getAssets } from "../../../store/assets";
import { IAssetEntry } from "../../../interfaces";
import DataSource from "../../../data/datasource";
import { useAccountId } from "../../../hooks/hooks";
import { useAppSelector } from "../../../redux/hooks";
import { getMarginAccountSupplied } from "../../../redux/marginAccountSelectors";
import { withdrawActionsAll } from "../../../store/marginActions/withdrawAll";
import { showPositionResult } from "../../../components/HashResultModal";

const TradingTable = ({
  positionsList,
  filterTitle = "",
  onTotalPLNChange,
}: {
  positionsList: any;
  filterTitle?: string;
  onTotalPLNChange?: (totalPLN: number) => void;
}) => {
  const [selectedTab, setSelectedTab] = useState("positions");
  const [isClosePositionModalOpen, setIsClosePositionMobileOpen] = useState(false);
  const [isChangeCollateralMobileOpen, setIsChangeCollateralMobileOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [assets, setAssets] = useState<IAssetEntry[]>([]);
  const [closePositionModalProps, setClosePositionModalProps] = useState(null);
  const [totalCollateral, setTotalCollateral] = useState(0);
  const [positionHistory, setPositionHistory] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPLN, setTotalPLN] = useState(0);
  const accountId = useAccountId();
  const { marginAccountList, parseTokenValue, getAssetDetails, getAssetById, calculateLeverage } =
    useMarginAccount();
  const { getPositionType, marginConfigTokens } = useMarginConfigToken();
  const accountSupplied = useAppSelector(getMarginAccountSupplied);
  const [isLoadingWithdraw, setIsLoadingWithdraw] = useState(false);
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
  const fetchPositionHistory = async () => {
    try {
      setIsLoading(true);
      const response = await DataSource.shared.getMarginTradingPositionHistory({
        address: accountId,
        // next_page_token: nextPageToken,
      });
      setPositionHistory((prev) =>
        nextPageToken ? [...prev, ...response.records] : response.records,
      );
      setNextPageToken(response.next_page_token);
    } catch (error) {
      console.error("获取历史仓位记录失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTab === "history") {
      fetchPositionHistory();
    }
  }, [selectedTab]);
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
  const handlePLNChange = (pln: number) => {
    setTotalPLN((prev) => prev + pln);
  };
  useEffect(() => {
    if (onTotalPLNChange) {
      onTotalPLNChange(totalPLN);
    }
  }, [totalPLN]);
  const handleWithdrawAllClick = async () => {
    setIsLoadingWithdraw(true);
    const accountSuppliedIds = accountSupplied.map((asset) => asset.token_id);
    try {
      await withdrawActionsAll(accountSuppliedIds);
    } catch (error) {
      console.error("Withdraw failed:", error);
    } finally {
      setIsLoadingWithdraw(false);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center lg:w-full xsm:mx-2">
      <div className="w-full border border-dark-50 bg-gray-800 rounded-md">
        <div className="w-full border-b border-dark-50 flex justify-between items-center">
          <div className="flex">
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
            <Tab
              tabName="Liquidation"
              isSelected={selectedTab === "liquidation"}
              onClick={() => handleTabClick("liquidation")}
            />
            {!filterTitle && (
              <Tab
                tabName="Account"
                isSelected={selectedTab === "account"}
                onClick={() => handleTabClick("account")}
              />
            )}
          </div>
          {selectedTab === "account" && accountSupplied.length > 0 && (
            <div
              className="mr-11 px-1.5 py-1 bg-primary bg-opacity-5 border border-primary rounded-md text-primary text-sm cursor-pointer"
              onClick={handleWithdrawAllClick}
            >
              {isLoadingWithdraw ? <BeatLoader size={5} color="#C0C4E9" /> : "Withdraw all"}
            </div>
          )}
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
                {positionsList && Object.keys(positionsList).length > 0 ? (
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
                      filterTitle={filterTitle}
                      onPLNChange={handlePLNChange}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={100}>
                      <div className="h-32 flex items-center justify-center w-full text-base text-gray-400">
                        Your open positions will appear here
                      </div>
                    </td>
                  </tr>
                )}
                {isChangeCollateralMobileOpen && (
                  <ChangeCollateralMobile
                    open={isChangeCollateralMobileOpen}
                    onClose={(e) => {
                      // e.preventDefault();
                      // e.stopPropagation();
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
                      // e.preventDefault();
                      // e.stopPropagation();
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
                {/* {positionHistory.length > 0 ? (
                  positionHistory.map((record, index) => (
                    <tr
                      key={index}
                      className="text-base hover:bg-dark-100 cursor-pointer font-normal"
                    >
                      <td className="py-5 pl-5">{record.market}</td>
                      <td>{record.operation}</td>
                      <td className={record.side === "Long" ? "text-green-500" : "text-red-500"}>
                        {record.side}
                      </td>
                      <td>${toInternationalCurrencySystem_number(record.price)}</td>
                      <td>{record.amount}</td>
                      <td>${toInternationalCurrencySystem_number(record.fee)}</td>
                      <td>
                        <div className="flex items-center">
                          <span className={record.pnl >= 0 ? "text-green-500" : "text-red-500"}>
                            ${toInternationalCurrencySystem_number(record.pnl)}
                          </span>
                          <span className="text-gray-400 text-xs ml-1">({record.roe}%)</span>
                        </div>
                      </td>
                      <td className="pr-5">
                        <div>{new Date(record.timestamp).toLocaleString()}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8}>
                      <div className="h-32 flex items-center justify-center w-full text-base text-gray-400">
                        暂无历史记录
                      </div>
                    </td>
                  </tr>
                )} */}
              </tbody>
            </table>
          )}
          {selectedTab === "liquidation" && <div>Liquidation</div>}
          {selectedTab === "account" && (
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-300 text-sm font-normal">
                  <th className="pl-5">Token</th>
                  <th>Balance</th>
                  <th>Price</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {accountSupplied.length > 0 ? (
                  accountSupplied.map((token, index) => {
                    const assetDetails = getAssetDetails(getAssetById(token.token_id));
                    return (
                      <tr
                        key={index}
                        className="text-base hover:bg-dark-100 cursor-pointer font-normal"
                      >
                        <td className="py-5 pl-5">
                          <div className="flex items-center">
                            <img src={assetDetails.icon} alt="" className="w-4 h-4 rounded-2xl" />
                            <p className="ml-1"> {assetDetails.symbol}</p>
                          </div>
                        </td>
                        <td>
                          $
                          {toInternationalCurrencySystem_number(parseTokenValue(token.balance, 18))}
                        </td>
                        <td>
                          {assetDetails.price
                            ? `$${toInternationalCurrencySystem_number(assetDetails.price)}`
                            : "/"}
                        </td>
                        <td>
                          {assetDetails.price
                            ? `$${toInternationalCurrencySystem_number(
                                parseTokenValue(token.balance, 18) * assetDetails.price,
                              )}`
                            : "/"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4}>
                      <div className="h-32 flex items-center justify-center w-full text-base text-gray-400">
                        No data
                      </div>
                    </td>
                  </tr>
                )}
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
  filterTitle,
  onPLNChange,
}) => {
  // console.log(itemKey, item, index);
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  useEffect(() => {
    const fetchEntryPrice = async () => {
      try {
        const response = await DataSource.shared.getMarginTradingRecordEntryPrice(itemKey);
        if (response?.code === 0 && response?.data?.[0]?.entry_price) {
          const price = parseFloat(response.data[0].entry_price);
          setEntryPrice(price);
        } else {
          setEntryPrice(null);
        }
      } catch (error) {
        console.error("Failed to fetch entry price:", error);
        setEntryPrice(null);
      }
    };
    fetchEntryPrice();
  }, [itemKey]);
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
  if (filterTitle && marketTitle !== filterTitle) {
    return null;
  }
  const sizeValueLong = parseTokenValue(item.token_p_amount, decimalsP);
  const sizeValueShort = parseTokenValue(item.token_d_info.balance, decimalsD);
  const sizeValue =
    positionType.label === "Long" ? sizeValueLong * (priceP || 0) : sizeValueShort * (priceD || 0);

  const netValue = parseTokenValue(item.token_c_info.balance, decimalsC) * (priceC || 0);
  const collateral = parseTokenValue(item.token_c_info.balance, decimalsC);
  // const entryPrice =
  //   positionType.label === "Long"
  //     ? sizeValueLong === 0
  //       ? 0
  //       : (leverageD * priceD) / sizeValueLong
  //     : sizeValueShort === 0
  //     ? 0
  //     : netValue / sizeValueShort;
  const indexPrice = positionType.label === "Long" ? priceP : priceD;
  const debt_assets_d = assets.find((asset) => asset.token_id === item.token_d_info.token_id);
  let LiqPrice = 0;
  if (leverage > 1) {
    if (positionType.label === "Long") {
      const k1 = Number(netValue) * leverage * priceC;
      const k2 = 1 - marginConfigTokens.min_safety_buffer / 10000;
      LiqPrice = (k1 / k2 - Number(netValue)) / sizeValueLong;
      if (Number.isNaN(LiqPrice) || !Number.isFinite(LiqPrice)) LiqPrice = 0;
    } else {
      LiqPrice =
        ((netValue + sizeValueLong) * priceC * (1 - marginConfigTokens.min_safety_buffer / 10000)) /
        sizeValueShort;
      if (Number.isNaN(LiqPrice) || !Number.isFinite(LiqPrice)) LiqPrice = 0;
    }
  }
  const rowData = {
    pos_id: itemKey,
    data: item,
    assets,
    marginConfigTokens,
  };
  const debtCap = parseFloat(item.debt_cap);
  const unitAccHpInterest = parseFloat(debt_assets_d?.unit_acc_hp_interest ?? 0);
  const uahpiAtOpen = parseFloat(item.uahpi_at_open);
  const interestDifference = unitAccHpInterest - uahpiAtOpen;
  const totalHpFee = (debtCap * interestDifference) / 10 ** 18;
  const profitOrLoss = entryPrice !== null ? (indexPrice - entryPrice) * sizeValue : 0;
  const openTime = new Date(Number(item.open_ts) / 1e6);
  const currentTime = new Date();
  const holdingDurationInHours =
    Math.abs(currentTime.getTime() - openTime.getTime()) / (1000 * 60 * 60);
  const holdingFee = totalHpFee * holdingDurationInHours;
  const pnl = profitOrLoss - holdingFee;
  if (onPLNChange) {
    onPLNChange(pnl);
  }
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
      <td>
        {entryPrice !== null ? (
          `$${toInternationalCurrencySystem_number(entryPrice)}`
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </td>
      <td>${toInternationalCurrencySystem_number(indexPrice)}</td>
      <td>${toInternationalCurrencySystem_number(LiqPrice)}</td>
      <td>
        {entryPrice !== null ? (
          `$${toInternationalCurrencySystem_number(pnl)}`
        ) : (
          <span className="text-gray-500">-</span>
        )}
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
              entryPrice,
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
