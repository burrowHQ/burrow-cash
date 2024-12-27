import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BeatLoader } from "react-spinners";
import {
  AddCollateral,
  ArrowDownIcon,
  ArrowUpIcon,
  Export,
} from "../../MarginTrading/components/Icon";
import ClosePositionMobile from "./ClosePositionMobile";
import ChangeCollateralMobile from "./ChangeCollateralMobile";
import { useMarginAccount } from "../../../hooks/useMarginAccount";
import { useMarginConfigToken } from "../../../hooks/useMarginConfig";
import { toInternationalCurrencySystem_number } from "../../../utils/uiNumber";
import { IAssetEntry } from "../../../interfaces";
import DataSource from "../../../data/datasource";
import { useAccountId } from "../../../hooks/hooks";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { getMarginAccountSupplied } from "../../../redux/marginAccountSelectors";
import { withdrawActionsAll } from "../../../store/marginActions/withdrawAll";
import { MarginAccountDetailIcon, YellowBallIcon } from "../../TokenDetail/svg";
import { useRouterQuery } from "../../../utils/txhashContract";
import { handleTransactionHash, handleTransactionResults } from "../../../services/transaction";
import { setAccountDetailsOpen, setSelectedTab } from "../../../redux/marginTabSlice";
import { showCheckTxBeforeShowToast } from "../../../components/HashResultModal";
import { shrinkToken } from "../../../store/helper";
import { getAssets } from "../../../redux/assetsSelectors";
import { beautifyPrice } from "../../../utils/beautyNumbet";

const TradingTable = ({
  positionsList,
  filterTitle = "",
}: {
  positionsList: any;
  filterTitle?: string;
}) => {
  const { query } = useRouterQuery();
  const { filterMarginConfigList } = useMarginConfigToken();
  const storeSelectedTab = useAppSelector((state) => state.tab.selectedTab);

  const dispatch = useAppDispatch();
  const [selectedTab, setStateSelectedTab] = useState(filterTitle ? "positions" : storeSelectedTab);
  const [isClosePositionModalOpen, setIsClosePositionMobileOpen] = useState(false);
  const [isChangeCollateralMobileOpen, setIsChangeCollateralMobileOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const assets = useAppSelector(getAssets);
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
  const isAccountDetailsOpen = useAppSelector((state) => state.tab.isAccountDetailsOpen);
  const [sortBy, setSortBy] = useState<string | null>("open_ts");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isSelectedMobileTab, setSelectedMobileTab] = useState("positions");
  const [currentPage, setCurrentPage] = useState(1);
  const [inputPage, setInputPage] = useState<string>("");
  const itemsPerPage = 10;

  const handleTabClick = (tab: string) => {
    if (!filterTitle) {
      dispatch(setSelectedTab(tab));
    }
    setStateSelectedTab(tab);
  };

  const handleClosePositionButtonClick = (key) => {
    setClosePositionModalProps(key);
    setIsClosePositionMobileOpen(true);
  };
  const handleChangeCollateralButtonClick = (rowData) => {
    setSelectedRowData(rowData);
    setIsChangeCollateralMobileOpen(true);
  };

  // fix can not change tab after click claim
  useEffect(() => {
    if (!filterTitle) {
      setStateSelectedTab(storeSelectedTab);
    } else {
      setStateSelectedTab("positions");
    }
  }, [storeSelectedTab]);

  useEffect(() => {
    handleTransactionResults(
      query?.transactionHashes,
      query?.errorMessage,
      Object.keys(filterMarginConfigList || []),
    );
  }, [query?.transactionHashes, query?.errorMessage]);
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
      console.error("Napakyas sa pagkuha sa makasaysayanong mga rekord sa posisyon:", error);
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
  const filteredAccountSupplied = accountSupplied.filter((token) => {
    const assetDetails = getAssetById(token.token_id);
    return token.balance.toString().length >= assetDetails.config.extra_decimals;
  });
  const handleWithdrawAllClick = async () => {
    setIsLoadingWithdraw(true);
    const accountSuppliedIds = filteredAccountSupplied.map((asset) => asset.token_id);
    try {
      const result = await withdrawActionsAll(accountSuppliedIds);
      if (result !== undefined && result !== null) {
        showCheckTxBeforeShowToast({ txHash: result[0].transaction.hash });
      }
      localStorage.setItem("marginTransactionType", "claimRewards");
    } catch (error) {
      console.error("Withdraw failed:", error);
    } finally {
      setIsLoadingWithdraw(false);
    }
  };
  const handleAccountDetailsClick = () => {
    dispatch(setAccountDetailsOpen(!isAccountDetailsOpen));
  };
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };
  const sortedPositionsList = React.useMemo<any[]>(() => {
    if (!sortBy) return positionsList;

    // add itemKey
    const positionsArray = Object.entries(positionsList).map(([key, value]) => ({
      ...(value as Record<string, any>),
      itemKey: key,
    })) as any[];

    // if filterTitle
    const filteredArray = filterTitle
      ? positionsArray.filter((item) => {
          const assetD = getAssetById(item.token_d_info.token_id);
          const assetC = getAssetById(item.token_c_info.token_id);
          const assetP = getAssetById(item.token_p_id);
          const { symbol: symbolC } = getAssetDetails(assetC);
          const { symbol: symbolP } = getAssetDetails(assetP);
          const { symbol: symbolD } = getAssetDetails(assetD);
          const positionType = getPositionType(item.token_d_info.token_id);
          const marketTitle =
            positionType.label === "Long" ? `${symbolP}/${symbolC}` : `${symbolD}/${symbolC}`;
          return marketTitle === filterTitle;
        })
      : positionsArray;

    // sort
    return filteredArray.sort((a, b) => {
      const timeA = Number(a.open_ts);
      const timeB = Number(b.open_ts);
      return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
    });
  }, [positionsList, sortBy, sortDirection, filterTitle]);
  const totalPages = Math.ceil(sortedPositionsList.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedPositionsList.slice(indexOfFirstItem, indexOfLastItem);
  const handlePageJump = (newPage) => {
    const pageNumber = parseInt(newPage, 10);
    if (!Number.isNaN(pageNumber) && pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center lg:w-full xsm:w-[100vw] xsm:px-2">
      {/* pc */}
      <div className="w-full border border-dark-50 bg-gray-800 rounded-md  xsm:hidden">
        {/* title */}
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
            {!filterTitle && (
              <Tab
                tabName="Account"
                isSelected={selectedTab === "account"}
                onClick={() => handleTabClick("account")}
              />
            )}
          </div>
          {!filterTitle && selectedTab === "account" && filteredAccountSupplied.length > 0 && (
            <div
              className="w-[110px] h-6 px-1.5 mr-11 flex items-center justify-center bg-primary bg-opacity-5 border border-primary rounded-md text-primary text-sm cursor-pointer"
              onClick={handleWithdrawAllClick}
            >
              {isLoadingWithdraw ? <BeatLoader size={5} color="#C0C4E9" /> : "Withdraw all"}
            </div>
          )}
        </div>
        {/* content */}
        <div className="py-4">
          <div className={selectedTab === "positions" ? "" : "hidden"}>
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
                  <th>PNL & ROE</th>
                  <th>
                    <div
                      onClick={() => handleSort("open_ts")}
                      className="flex items-center cursor-pointer"
                    >
                      Opening time
                      <SortButton
                        activeColor="rgba(192, 196, 233, 1)"
                        inactiveColor="rgba(192, 196, 233, 0.5)"
                        sort={sortBy === "open_ts" ? sortDirection : null}
                      />
                    </div>
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(currentItems) && currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <PositionRow
                      index={index}
                      key={item.itemKey}
                      item={item}
                      itemKey={item.itemKey}
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
                      marginAccountList={marginAccountList}
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
                    onClose={() => setIsChangeCollateralMobileOpen(false)}
                    rowData={selectedRowData}
                    collateralTotal={totalCollateral}
                  />
                )}
                {isClosePositionModalOpen && closePositionModalProps && (
                  <ClosePositionMobile
                    open={isClosePositionModalOpen}
                    onClose={() => setIsClosePositionMobileOpen(false)}
                    extraProps={closePositionModalProps}
                  />
                )}
              </tbody>
            </table>
            {Array.isArray(currentItems) && currentItems.length > 0 ? (
              <div className="flex items-center justify-center mt-4">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        type="button"
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 py-1 text-gray-300 w-6 h-6 flex items-center justify-center rounded mr-2 ${
                          currentPage === page ? "font-bold bg-dark-1200 bg-opacity-30" : ""
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (page === 2 && currentPage > 3) {
                    return <span key={page}>...</span>;
                  }
                  if (page === totalPages - 1 && currentPage < totalPages - 2) {
                    return <span key={page}>...</span>;
                  }
                  return null;
                })}
                <p className="text-gray-1400 text-sm mr-1.5 ml-10">Go to</p>
                <input
                  className="w-[42px] h-[22px] bg-dark-100 border border-dark-1250 text-sm text-center border rounded"
                  type="text"
                  value={inputPage}
                  onChange={(e) => {
                    const { value } = e.target;
                    if (value === "" || (Number.isInteger(Number(value)) && !value.includes("."))) {
                      setInputPage(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const pageNumber = Number(inputPage);
                      handlePageJump(pageNumber);
                    }
                  }}
                />
              </div>
            ) : null}
          </div>
          <div className={selectedTab === "history" ? "" : "hidden"}>
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
                {positionHistory && positionHistory.length > 0 ? (
                  positionHistory.map((record, index) => <>111</>)
                ) : (
                  <tr>
                    <td colSpan={8}>
                      <div className="h-32 flex items-center justify-center w-full text-base text-gray-400">
                        No data
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className={selectedTab === "account" && !filterTitle ? "" : "hidden"}>
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
                {filteredAccountSupplied.length > 0 ? (
                  filteredAccountSupplied.map((token, index) => {
                    const assetDetails = getAssetById(token.token_id);
                    const marginAssetDetails = getAssetDetails(assetDetails);
                    return (
                      <tr key={index} className="text-base hover:bg-dark-100 font-normal">
                        <td className="py-5 pl-5">
                          <div className="flex items-center">
                            <img
                              src={assetDetails.metadata.icon}
                              alt=""
                              className="w-4 h-4 rounded-2xl"
                            />
                            <p className="ml-1"> {assetDetails.metadata.symbol}</p>
                          </div>
                        </td>
                        <td>
                          {toInternationalCurrencySystem_number(
                            parseTokenValue(token.balance, marginAssetDetails.decimals),
                          )}
                        </td>
                        <td>
                          {marginAssetDetails.price
                            ? `$${toInternationalCurrencySystem_number(marginAssetDetails.price)}`
                            : "/"}
                        </td>
                        <td>
                          {marginAssetDetails.price
                            ? `$${toInternationalCurrencySystem_number(
                                parseTokenValue(token.balance, marginAssetDetails.decimals) *
                                  marginAssetDetails.price,
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
            {filteredAccountSupplied.length > 0 ? (
              <div className="flex items-center justify-center mt-4">
                {Array.from(
                  { length: Math.ceil(filteredAccountSupplied.length / itemsPerPage) },
                  (_, index) => index + 1,
                ).map((page) => {
                  if (
                    page === 1 ||
                    page === Math.ceil(filteredAccountSupplied.length / itemsPerPage) ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        type="button"
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 py-1 text-gray-300 w-6 h-6 flex items-center justify-center rounded mr-2 ${
                          currentPage === page ? "font-bold bg-dark-1200 bg-opacity-30" : ""
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (page === 2 && currentPage > 3) {
                    return <span key={page}>...</span>;
                  }
                  if (
                    page === Math.ceil(filteredAccountSupplied.length / itemsPerPage) - 1 &&
                    currentPage < Math.ceil(filteredAccountSupplied.length / itemsPerPage) - 2
                  ) {
                    return <span key={page}>...</span>;
                  }
                  return null;
                })}
                <p className="text-gray-1400 text-sm mr-1.5 ml-10">Go to</p>
                <input
                  className="w-[42px] h-[22px] bg-dark-100 border border-dark-1250 text-sm text-center border rounded"
                  type="text"
                  value={inputPage}
                  onChange={(e) => {
                    const { value } = e.target;
                    if (value === "" || (Number.isInteger(Number(value)) && !value.includes("."))) {
                      setInputPage(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const pageNumber = Number(inputPage);
                      handlePageJump(pageNumber);
                    }
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {/* mobile */}
      <div className="md:hidden w-[100vw] px-2 pb-[150px]">
        {/* title */}
        <div className="grid grid-cols-2 bg-gray-800 rounded-md h-[42px] text-white text-base items-center justify-items-stretch mt-6 mb-6">
          <div className="relative flex items-center justify-center border-r border-dark-1000">
            <span
              onClick={() => {
                setSelectedMobileTab("positions");
              }}
              className={`relative z-10 text-center ${
                isSelectedMobileTab === "positions" ? "text-primary" : ""
              }`}
            >
              Positions
            </span>
            <div
              className={`absolute top-1 flex items-center justify-center  ${
                isSelectedMobileTab === "positions" ? "" : "hidden"
              }`}
            >
              <span className="flex w-10 h-10 bg-gray-800" style={{ borderRadius: "50%" }} />
              <YellowBallIcon className="absolute top-6" />
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <span
              onClick={() => {
                setSelectedMobileTab("history");
              }}
              className={`relative z-10 text-center ${
                isSelectedMobileTab === "history" ? "text-primary" : ""
              }`}
            >
              History
            </span>
            <div
              className={`absolute top-1 flex items-center justify-center ${
                isSelectedMobileTab === "history" ? "" : "hidden"
              }`}
            >
              <span className="flex w-10 h-10 bg-gray-800" style={{ borderRadius: "50%" }} />
              <YellowBallIcon className="absolute top-6" />
            </div>
          </div>
        </div>
        {/* content */}
        <div className={isSelectedMobileTab === "positions" ? "" : "hidden"}>
          {Array.isArray(currentItems) && currentItems.length > 0 ? (
            currentItems.map((item, index) => (
              <PositionMobileRow
                index={index}
                key={item.itemKey}
                item={item}
                itemKey={item.itemKey}
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
                marginAccountList={marginAccountList}
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
          {isClosePositionModalOpen && closePositionModalProps && (
            <ClosePositionMobile
              open={isClosePositionModalOpen}
              onClose={() => {
                // e.preventDefault();
                // e.stopPropagation();
                setIsClosePositionMobileOpen(false);
              }}
              extraProps={closePositionModalProps}
            />
          )}
          <div className="flex items-center justify-center mt-4">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    type="button"
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-2 py-1 text-gray-300 w-6 h-6 flex items-center justify-center rounded mr-2 ${
                      currentPage === page ? "font-bold bg-dark-1200 bg-opacity-30" : ""
                    }`}
                  >
                    {page}
                  </button>
                );
              }
              if (page === 2 && currentPage > 3) {
                return <span key={page}>...</span>;
              }
              if (page === totalPages - 1 && currentPage < totalPages - 2) {
                return <span key={page}>...</span>;
              }
              return null;
            })}
            <p className="text-gray-1400 text-sm mr-1.5 ml-10">Go to</p>
            <input
              className="w-[42px] h-[22px] bg-dark-100 border border-dark-1250 text-sm text-center border rounded"
              type="text"
              value={inputPage}
              onChange={(e) => {
                const { value } = e.target;
                if (value === "" || (Number.isInteger(Number(value)) && !value.includes("."))) {
                  setInputPage(value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const pageNumber = Number(inputPage);
                  handlePageJump(pageNumber);
                }
              }}
            />
          </div>
        </div>
        <div className={isSelectedMobileTab === "history" ? "" : "hidden"}>history</div>
        {!filterTitle && filteredAccountSupplied.length > 0 && (
          <div
            className="fixed rounded-t-xl bottom-0 left-0 right-0 z-50 bg-gray-1300 pt-[18px] px-[32px] pb-[52px] w-full"
            style={{
              boxShadow:
                "0px -5px 12px 0px #0000001A, 0px -21px 21px 0px #00000017, 0px -47px 28px 0px #0000000D, 0px -84px 33px 0px #00000003, 0px -131px 37px 0px #00000000",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg">Account</p>
              <div className="flex items-center" onClick={handleAccountDetailsClick}>
                <p className="text-base text-gray-300 mr-2">Detail</p>
                <MarginAccountDetailIcon
                  className={`transform ${isAccountDetailsOpen ? "rotate-180" : ""}`}
                />
              </div>
            </div>
            {isAccountDetailsOpen && (
              <div className="h-[50vh] overflow-y-auto -ml-[32px] -mr-[32px]">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-1350">
                    <tr className="text-gray-300 text-sm font-normal">
                      <th className="pb-[14px] pl-[30px]">Token</th>
                      <th className="pb-[14px]">Balance</th>
                      <th className="pb-[14px] text-right pr-[32px]">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccountSupplied.length > 0 ? (
                      filteredAccountSupplied.map((token, index) => {
                        const assetDetails = getAssetById(token.token_id);
                        const marginAssetDetails = getAssetDetails(assetDetails);
                        return (
                          <tr key={index} className="text-sm hover:bg-dark-100 font-normal ">
                            <td className="pb-[10px] pl-[30px] pt-[10px]">
                              <div className="flex items-center">
                                <img
                                  src={assetDetails.metadata.icon}
                                  alt=""
                                  className="w-[26px] h-[26px] rounded-2xl"
                                />
                                <div className="ml-2">
                                  <p className="text-sm"> {assetDetails.metadata.symbol}</p>
                                  <p className="text-xs text-gray-300 -mt-0.5">
                                    {marginAssetDetails.price
                                      ? `$${toInternationalCurrencySystem_number(
                                          marginAssetDetails.price,
                                        )}`
                                      : "/"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td>
                              {toInternationalCurrencySystem_number(
                                parseTokenValue(token.balance, marginAssetDetails.decimals),
                              )}
                            </td>
                            <td className="text-right pr-[32px]">
                              {marginAssetDetails.price
                                ? `$${toInternationalCurrencySystem_number(
                                    parseTokenValue(token.balance, marginAssetDetails.decimals) *
                                      marginAssetDetails.price,
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
              </div>
            )}
            <div
              className="w-full bg-primary bg-opacity-5 text-primary h-[36px] rounded-md border border-marginWithdrawAllBtn flex items-center justify-center"
              onClick={handleWithdrawAllClick}
            >
              {isLoadingWithdraw ? <BeatLoader size={5} color="#C0C4E9" /> : "Withdraw all"}
            </div>
          </div>
        )}
        {/* {isAccountDetailsOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 overflow-hidden"
            onClick={handleAccountDetailsClick}
          />
        )} */}
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
  marginAccountList,
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
  const size = positionType.label === "Long" ? sizeValueLong : sizeValueShort;
  const sizeValue =
    positionType.label === "Long" ? sizeValueLong * (priceP || 0) : sizeValueShort * (priceD || 0);

  const netValue = parseTokenValue(item.token_c_info.balance, decimalsC) * (priceC || 0);
  const collateral = parseTokenValue(item.token_c_info.balance, decimalsC);
  const indexPrice = positionType.label === "Long" ? priceP : priceD;
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
  const openTime = new Date(Number(item.open_ts) / 1e6);
  const uahpi: any = shrinkToken((assets as any).data[item.token_p_id]?.uahpi, 18) ?? 0;
  const uahpi_at_open: any = shrinkToken(marginAccountList[itemKey]?.uahpi_at_open ?? 0, 18) ?? 0;
  const holdingFee =
    +shrinkToken(item.debt_cap, decimalsD) * priceD * (uahpi * 1 - uahpi_at_open * 1);
  const profitOrLoss = entryPrice !== null ? (indexPrice - entryPrice) * size : 0;
  const pnl = profitOrLoss - holdingFee;
  let amplitude = 0;
  if (entryPrice !== null && entryPrice !== 0) {
    if (positionType.label === "Long") {
      amplitude = ((indexPrice - entryPrice) / entryPrice) * 100;
    } else if (positionType.label === "Short") {
      amplitude = ((entryPrice - indexPrice) / entryPrice) * 100;
    }
  }
  const rowData = {
    pos_id: itemKey,
    data: item,
    marginConfigTokens,
    entryPrice,
  };
  return (
    <tr className="text-base hover:bg-dark-100 font-normal">
      <td className="py-5 pl-5">
        <div className="-mb-1.5">{marketTitle}</div>
        <span className={`text-xs ${getPositionType(item.token_d_info.token_id).class}`}>
          {getPositionType(item.token_d_info.token_id).label}
          <span className="ml-1.5">{toInternationalCurrencySystem_number(leverage)}x</span>
        </span>
      </td>
      <td>
        <div className="flex mr-4 items-center">
          <p className="mr-2"> {toInternationalCurrencySystem_number(size)}</p>
          <span className="text-gray-300 text-sm">
            (${toInternationalCurrencySystem_number(sizeValue)})
          </span>
        </div>
      </td>
      <td>${toInternationalCurrencySystem_number(netValue)}</td>
      <td>
        <div className="flex items-center">
          <p className="mr-2.5">
            {toInternationalCurrencySystem_number(collateral)}
            <span className="ml-1">{symbolC}</span>
          </p>
          <div
            className="cursor-pointer"
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
      <td
        title={entryPrice !== null && entryPrice !== undefined ? `$${entryPrice}` : ""}
        className="cursor-default"
      >
        {entryPrice !== null && entryPrice !== undefined ? (
          `$${toInternationalCurrencySystem_number(entryPrice)}`
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </td>
      <td title={`$${indexPrice?.toString()}`} className="cursor-default">
        ${toInternationalCurrencySystem_number(indexPrice)}
      </td>
      <td title={`$${LiqPrice?.toString()}`} className="cursor-default">
        ${toInternationalCurrencySystem_number(LiqPrice)}
      </td>
      <td>
        <p className={`text-primary ${pnl < 0 ? "text-red-150" : "text-green-150"}`}>
          {pnl > 0 ? `+` : `-`}${beautifyPrice(pnl)}
          {/* <span className="text-gray-400 text-xs ml-0.5">({beautifyPrice(amplitude)}%)</span> */}
          <span className="text-gray-400 text-xs ml-0.5">(-%)</span>
        </p>
      </td>
      <td>
        <div className="text-sm">{new Date(openTime).toLocaleDateString()}</div>
        <div className="text-sm">{new Date(openTime).toLocaleTimeString()}</div>
      </td>
      <td className="pr-5">
        <div
          className="text-gray-300 text-sm border cursor-pointer  border-dark-300 text-center h-6 rounded flex justify-center items-center"
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
              pnl,
            });
          }}
        >
          Close
        </div>
      </td>
    </tr>
  );
};

const PositionMobileRow = ({
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
  marginAccountList,
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
  const marketIcon = positionType.label === "Long" ? assetP.metadata.icon : assetD.metadata.icon;
  const marketTitle =
    positionType.label === "Long" ? `${symbolP}/${symbolC}` : `${symbolD}/${symbolC}`;
  if (filterTitle && marketTitle !== filterTitle) {
    return null;
  }
  const sizeValueLong = parseTokenValue(item.token_p_amount, decimalsP);
  const sizeValueShort = parseTokenValue(item.token_d_info.balance, decimalsD);
  const size = positionType.label === "Long" ? sizeValueLong : sizeValueShort;
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
  const rowData = {
    pos_id: itemKey,
    data: item,
    marginConfigTokens,
  };
  const openTime = new Date(Number(item.open_ts) / 1e6);
  const uahpi: any = shrinkToken((assets as any).data[item.token_p_id]?.uahpi, 18) ?? 0;
  const uahpi_at_open: any = shrinkToken(marginAccountList[itemKey]?.uahpi_at_open ?? 0, 18) ?? 0;
  const holdingFee =
    +shrinkToken(item.debt_cap, decimalsD) * priceD * (uahpi * 1 - uahpi_at_open * 1);
  const profitOrLoss = entryPrice !== null ? (indexPrice - entryPrice) * size : 0;
  const pnl = profitOrLoss - holdingFee;
  let amplitude = 0;
  if (entryPrice !== null && entryPrice !== 0) {
    if (positionType.label === "Long") {
      amplitude = ((indexPrice - entryPrice) / entryPrice) * 100;
    } else if (positionType.label === "Short") {
      amplitude = ((entryPrice - indexPrice) / entryPrice) * 100;
    }
  }
  return (
    <div className="bg-gray-800 rounded-xl mb-4">
      <div className="pt-5 px-4 pb-4 border-b border-dark-950 flex justify-between">
        <div className="flex items-center">
          <div className="flex items-center justify-center mr-3.5">
            <img
              src={marketIcon}
              alt=""
              className="rounded-2xl border border-gray-800"
              style={{ width: "26px", height: "26px" }}
            />
            <img
              src={assetC.metadata.icon}
              alt=""
              className="rounded-2xl border border-gray-800"
              style={{ width: "26px", height: "26px", marginLeft: "-6px" }}
            />
          </div>
          <div>
            <p>{marketTitle}</p>
            <p className={`text-xs -mt-0 ${getPositionType(item.token_d_info.token_id).class}`}>
              {getPositionType(item.token_d_info.token_id).label}
              <span className="ml-1.5">{toInternationalCurrencySystem_number(leverage)}x</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center">
            <p className="mr-2"> {toInternationalCurrencySystem_number(size)}</p>
            <span className="text-gray-300 text-sm">
              (${toInternationalCurrencySystem_number(sizeValue)})
            </span>
          </div>
          <p className="text-xs text-gray-300">Size</p>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Net Value</p>
          <p>${toInternationalCurrencySystem_number(netValue)}</p>
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Collateral</p>
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
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Entry Price</p>
          <p title={entryPrice !== null && entryPrice !== undefined ? `$${entryPrice}` : ""}>
            {entryPrice !== null ? (
              `$${toInternationalCurrencySystem_number(entryPrice)}`
            ) : (
              <span className="text-gray-500">-</span>
            )}
          </p>
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Index Price</p>
          <p title={indexPrice?.toString()}>${toInternationalCurrencySystem_number(indexPrice)}</p>
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Liq. Price</p>
          <p title={LiqPrice?.toString()}>${toInternationalCurrencySystem_number(LiqPrice)}</p>
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Opening time</p>
          <p>{new Date(openTime).toLocaleString()}</p>
        </div>
        <div className="bg-dark-100 rounded-2xl flex items-center justify-center text-xs py-1 text-gray-300 mb-4">
          PNL & ROE{" "}
          <p className={`text-primary ${pnl < 0 ? "text-red-150" : "text-green-150"}`}>
            {pnl > 0 ? `+` : `-`}${beautifyPrice(pnl)}
            {/* <span className="text-gray-400 text-xs ml-0.5">({beautifyPrice(amplitude)}%)</span> */}
            <span className="text-gray-400 text-xs ml-0.5">(-%)</span>
          </p>
        </div>
        <div
          className="w-full rounded-md h-9 flex items-center justify-center border border-marginCloseBtn text-gray-300"
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
              pnl,
            });
          }}
        >
          Close
        </div>
      </div>
    </div>
  );
};

function SortButton({ sort, activeColor, inactiveColor }) {
  return (
    <div className="flex flex-col items-center gap-0.5 ml-1.5">
      <ArrowUpIcon fill={`${sort === "asc" ? activeColor : inactiveColor}`} />
      <ArrowDownIcon fill={`${sort === "desc" ? activeColor : inactiveColor}`} />
    </div>
  );
}

export default TradingTable;
