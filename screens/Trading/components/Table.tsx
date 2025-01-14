import React, { useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";
import ClosePositionMobile from "./ClosePositionMobile";
import ChangeCollateralMobile from "./ChangeCollateralMobile";
import { useMarginAccount } from "../../../hooks/useMarginAccount";
import { useMarginConfigToken } from "../../../hooks/useMarginConfig";
import DataSource from "../../../data/datasource";
import { useAccountId } from "../../../hooks/hooks";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
  getMarginAccountSupplied,
  getMarginAccountSuppliedMEME,
} from "../../../redux/marginAccountSelectors";
import { withdrawActionsAll } from "../../../store/marginActions/withdrawAll";
import { MarginAccountDetailIcon, YellowBallIcon } from "../../TokenDetail/svg";
import { useRouterQuery } from "../../../utils/txhashContract";
import { handleTransactionHash } from "../../../services/transaction";
import { setAccountDetailsOpen, setSelectedTab } from "../../../redux/marginTabSlice";
import { showCheckTxBeforeShowToast } from "../../../components/HashResultModal";
import { getAssets, getAssetsMEME } from "../../../redux/assetsSelectors";
import { checkIfMeme } from "../../../utils/margin";
import { ArrowLineDownIcon, CheckIcon } from "../../Market/svg";
import { isMobileDevice } from "../../../helpers/helpers";
import { useRegisterTokenType } from "../../../hooks/useRegisterTokenType";
import PositionRow from "./Table/PositionRow";
import HistoryRow from "./Table/HistoryRow";
import AccountRow from "./Table/AccountRow";
import { SortButton, SortHistoryButton, Tab } from "./Table/SortButton";
import Pagination from "./Table/Pagination";

const TradingTable = ({
  positionsList,
  filterTitle = "",
  filterTokenMap = {},
}: {
  positionsList: any;
  filterTitle?: string;
  filterTokenMap?: {
    [key: string]: string;
  };
}) => {
  const { query } = useRouterQuery();
  const { filterMarginConfigList } = useMarginConfigToken();
  const storeSelectedTab = useAppSelector((state) => state.tab.selectedTab);
  const isMobile = isMobileDevice();
  const dispatch = useAppDispatch();
  const [selectedTab, setStateSelectedTab] = useState(filterTitle ? "positions" : storeSelectedTab);
  const [isClosePositionModalOpen, setIsClosePositionMobileOpen] = useState(false);
  const [isChangeCollateralMobileOpen, setIsChangeCollateralMobileOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const assets = useAppSelector(getAssets);
  const assetsMEME = useAppSelector(getAssetsMEME);
  const [closePositionModalProps, setClosePositionModalProps] = useState(null);
  const [totalCollateral, setTotalCollateral] = useState(0);
  const [positionHistory, setPositionHistory] = useState<any[]>([]);
  const [positionHistoryTotal, setPositionHistoryTotal] = useState(0);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [pageNum, setPageNum] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [orderColumn, setOrderColumn] = useState("close_timestamp");
  const [orderBy, setOrderBy] = useState("DESC");
  const [isLoading, setIsLoading] = useState(false);
  const accountId = useAccountId();
  const {
    marginAccountList,
    marginAccountListMEME,
    parseTokenValue,
    getAssetDetails,
    getAssetById,
    calculateLeverage,
    getAssetByIdMEME,
  } = useMarginAccount();
  const { filteredTokenTypeMap } = useRegisterTokenType();
  const { getPositionType, marginConfigTokens } = useMarginConfigToken();
  const accountSupplied = useAppSelector(getMarginAccountSupplied);
  const accountSuppliedMEME = useAppSelector(getMarginAccountSuppliedMEME);
  const combinedAccountSupplied = [
    ...accountSupplied.map((token) => ({ ...token, type: "main" })),
    ...accountSuppliedMEME.map((token) => ({ ...token, type: "meme" })),
  ];
  const [isLoadingWithdraw, setIsLoadingWithdraw] = useState(false);
  const isAccountDetailsOpen = useAppSelector((state) => state.tab.isAccountDetailsOpen);
  const [sortBy, setSortBy] = useState<string | null>("open_ts");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isSelectedMobileTab, setSelectedMobileTab] = useState("positions");
  const [currentPage, setCurrentPage] = useState(1);
  const [inputPage, setInputPage] = useState<string>("");
  const [showSelectBox, setShowSelectBox] = useState(false);
  const itemsPerPage = 10;
  const totalHistoryPages = Math.ceil(positionHistoryTotal / pageSize);
  const handleTabClick = (tab: string) => {
    if (!filterTitle) {
      dispatch(setSelectedTab(tab));
    }
    setStateSelectedTab(tab);
    setCurrentPage(1);
    setInputPage("");
    setPageNum(0);
  };

  const handleClosePositionButtonClick = (key) => {
    setClosePositionModalProps(key);
    setIsClosePositionMobileOpen(true);
  };
  const handleChangeCollateralButtonClick = (rowData) => {
    setSelectedRowData(rowData);
    setIsChangeCollateralMobileOpen(true);
  };

  useEffect(() => {
    dispatch(setAccountDetailsOpen(false));
    return () => {
      dispatch(setAccountDetailsOpen(false));
    };
  }, [dispatch]);

  // fix can not change tab after click claim
  useEffect(() => {
    if (!filterTitle) {
      setStateSelectedTab(storeSelectedTab);
    } else {
      setStateSelectedTab("positions");
    }
  }, [storeSelectedTab]);
  // TODOXX
  useEffect(() => {
    if (query?.transactionHashes && accountId) {
      handleTransactionHash(query?.transactionHashes);
    }
  }, [query?.transactionHashes, query?.errorMessage, accountId]);
  const fetchPositionHistory = async () => {
    try {
      setIsLoading(true);
      const params = {
        address: accountId,
        page_num: pageNum,
        page_size: pageSize,
        order_column: orderColumn,
        order_by: orderBy,
        tokens: Object.values(filterTokenMap).join("|"),
      };
      const response = await DataSource.shared.getMarginTradingPositionHistory(params);
      setPositionHistory(response.data.position_records);
      setNextPageToken(response.next_page_token);
      setPositionHistoryTotal(response.data.total);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (selectedTab === "history" || isSelectedMobileTab === "history") {
      fetchPositionHistory();
    }
  }, [
    accountId,
    pageNum,
    pageSize,
    orderColumn,
    orderBy,
    selectedTab,
    isSelectedMobileTab,
    JSON.stringify(filterTokenMap || {}),
  ]);
  const calculateTotalSizeValues = () => {
    let collateralTotal = 0;
    Object.values(marginAccountList).forEach((item) => {
      const assetC = getAssetById(item.token_c_info.token_id, item);
      const { price: priceC, symbol: symbolC, decimals: decimalsC } = getAssetDetails(assetC);
      const netValue = parseTokenValue(item.token_c_info.balance, decimalsC) * (priceC || 0);
      collateralTotal += netValue;
    });
    setTotalCollateral(collateralTotal);
  };
  useEffect(() => {
    calculateTotalSizeValues();
  }, [marginAccountList]);

  const filteredAccountSupplied = combinedAccountSupplied.filter((token) => {
    const assetDetails =
      token.type === "main" ? getAssetById(token.token_id) : getAssetByIdMEME(token.token_id);
    return assetDetails && token.balance.toString().length >= assetDetails.config.extra_decimals;
  });

  const handleWithdrawAllClick = async () => {
    setIsLoadingWithdraw(true);
    const accountSuppliedIds = filteredAccountSupplied.map((asset) => asset.token_id);
    const [memeAccountSuppliedIds, mainAccountSuppliedIds] = filteredAccountSupplied.reduce(
      (acc, cur) => {
        if (cur.type == "meme") {
          acc[0].push(cur.token_id);
        } else {
          acc[1].push(cur.token_id);
        }
        return acc;
      },
      [[], []] as string[][],
    );
    try {
      const result = await withdrawActionsAll({
        meme_token_ids: memeAccountSuppliedIds,
        main_token_ids: mainAccountSuppliedIds,
      });
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
          const assetD = getAssetById(item.token_d_info.token_id, item);
          const assetC = getAssetById(item.token_c_info.token_id, item);
          const assetP = getAssetById(item.token_p_id, item);
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
  }, [positionsList, positionsList.length, sortBy, sortDirection, filterTitle]);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [filterTitle]);

  const handleSortChange = (column) => {
    if (isMobile) {
      setOrderColumn(column);
      setOrderBy("DESC");
    } else {
      setOrderColumn(column);
      setOrderBy(orderBy === "ASC" ? "DESC" : "ASC");
    }
  };
  const handleSelectBox = () => {
    setShowSelectBox(!showSelectBox);
  };
  const closeSelectBox = () => {
    setShowSelectBox(false);
  };
  const sortList = {
    close_timestamp: "Close time",
    open_timestamp: "Opening time",
    pnl: "PNL & ROE",
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
                      assetsMEME={assetsMEME}
                      filterTitle={filterTitle}
                      marginAccountList={marginAccountList}
                      marginAccountListMEME={marginAccountListMEME}
                      filteredTokenTypeMap={filteredTokenTypeMap}
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
                    rowData={
                      selectedRowData || {
                        pos_id: "",
                        data: {},
                        marginConfigTokens: {},
                        entryPrice: null,
                      }
                    }
                    // collateralTotal={totalCollateral}
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
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                inputPage={inputPage}
                setInputPage={setInputPage}
                handlePageJump={handlePageJump}
              />
            ) : null}
          </div>
          <div className={selectedTab === "history" ? "" : "hidden"}>
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-300 text-sm font-normal">
                  <th className="pl-5">Market</th>
                  {/* <th>Side</th> */}
                  <th>Size</th>
                  <th>Net value</th>
                  <th>Collateral</th>
                  <th>Entry price</th>
                  <th>Close price</th>
                  <th>Fee</th>
                  <th onClick={() => handleSortChange("pnl")}>
                    <div className="flex items-center cursor-pointer">
                      PNL & ROE
                      <SortHistoryButton
                        activeColor="rgba(192, 196, 233, 1)"
                        inactiveColor="rgba(192, 196, 233, 0.5)"
                        sort={orderColumn === "pnl" ? orderBy : null}
                      />
                    </div>
                  </th>
                  <th onClick={() => handleSortChange("open_timestamp")}>
                    <div className="flex items-center cursor-pointer">
                      Opening time
                      <SortHistoryButton
                        activeColor="rgba(192, 196, 233, 1)"
                        inactiveColor="rgba(192, 196, 233, 0.5)"
                        sort={orderColumn === "open_timestamp" ? orderBy : null}
                      />
                    </div>
                  </th>
                  <th onClick={() => handleSortChange("close_timestamp")}>
                    <div className="flex items-center cursor-pointer">
                      Close time
                      <SortHistoryButton
                        activeColor="rgba(192, 196, 233, 1)"
                        inactiveColor="rgba(192, 196, 233, 0.5)"
                        sort={orderColumn === "close_timestamp" ? orderBy : null}
                      />
                    </div>
                  </th>
                  <th>Operation</th>
                </tr>
              </thead>
              <tbody>
                {positionHistory && positionHistory.length > 0 ? (
                  positionHistory.map((record, index) => {
                    const ifMeme = checkIfMeme({
                      debt_id: record.token_d,
                      pos_id: record.token_p,
                    });
                    const assetD = !ifMeme
                      ? getAssetById(record.token_d)
                      : getAssetByIdMEME(record.token_d);
                    const assetP = !ifMeme
                      ? getAssetById(record.token_p)
                      : getAssetByIdMEME(record.token_p);
                    const assetC = !ifMeme
                      ? getAssetById(record.token_c)
                      : getAssetByIdMEME(record.token_c);
                    if (!assetD || !assetP || !assetC) {
                      return null;
                    }
                    return (
                      <HistoryRow
                        key={index}
                        index={index}
                        record={record}
                        assetD={assetD}
                        assetP={assetP}
                        assetC={assetC}
                      />
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={100}>
                      <div className="h-32 flex items-center justify-center w-full text-base text-gray-400">
                        No data
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {totalHistoryPages !== 0 && (
              <Pagination
                currentPage={pageNum + 1}
                totalPages={totalHistoryPages}
                onPageChange={(page) => {
                  setPageNum(page - 1);
                }}
                inputPage={inputPage}
                setInputPage={setInputPage}
                handlePageJump={(pageNumber) => setPageNum(pageNumber - 1)}
              />
            )}
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
                    const assetDetails =
                      token.type === "main"
                        ? getAssetById(token.token_id)
                        : getAssetByIdMEME(token.token_id);
                    const marginAssetDetails = getAssetDetails(assetDetails);
                    return (
                      <AccountRow
                        key={index}
                        token={token}
                        assetDetails={assetDetails}
                        marginAssetDetails={marginAssetDetails}
                        parseTokenValue={parseTokenValue}
                      />
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
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredAccountSupplied.length / itemsPerPage)}
                onPageChange={setCurrentPage}
                inputPage={inputPage}
                setInputPage={setInputPage}
                handlePageJump={handlePageJump}
              />
            ) : null}
          </div>
        </div>
      </div>
      {/* mobile */}
      <div className="md:hidden w-[100vw] px-2 pb-[160px]">
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
                assetsMEME={assetsMEME}
                filterTitle={filterTitle}
                marginAccountList={marginAccountList}
                marginAccountListMEME={marginAccountListMEME}
                filteredTokenTypeMap={filteredTokenTypeMap}
              />
            ))
          ) : (
            <div className="h-32 flex items-center justify-center w-full text-base text-gray-400">
              No data
            </div>
          )}
          {isChangeCollateralMobileOpen && (
            <ChangeCollateralMobile
              open={isChangeCollateralMobileOpen}
              onClose={(e) => {
                // e.preventDefault();
                // e.stopPropagation();
                setIsChangeCollateralMobileOpen(false);
              }}
              rowData={
                selectedRowData || {
                  pos_id: "",
                  data: {},
                  marginConfigTokens: {},
                  entryPrice: null,
                }
              }
              // collateralTotal={totalCollateral}
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
          {Array.isArray(currentItems) && currentItems.length > 0 ? (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              inputPage={inputPage}
              setInputPage={setInputPage}
              handlePageJump={handlePageJump}
            />
          ) : null}
        </div>
        <div className={isSelectedMobileTab === "history" ? "" : "hidden"}>
          <div className="flex items-center justify-between h-[34px] mb-[14px] w-full mt-6 px-4">
            <span className="text-white font-bold">All History</span>
            <div className="flex items-center">
              <span className="text-gray-300 h4 mr-2.5">Sort by</span>
              <div className="relative z-10" onBlur={closeSelectBox} tabIndex={0}>
                <div
                  onClick={handleSelectBox}
                  className="flex gap-2.5 items-center justify-center bg-gray-800 border border-dark-50 rounded-md px-2.5 py-1.5 text-sm text-white"
                >
                  {sortList[orderColumn]}
                  <ArrowLineDownIcon />
                </div>
                <div
                  className={`border border-dark-300 rounded-md px-4 py-1 bg-dark-100 absolute right-0 w-[180px] top-[40px] ${
                    showSelectBox ? "" : "hidden"
                  }`}
                >
                  {Object.entries(sortList).map(([key, name]) => {
                    const isSelected = orderColumn === key;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between py-3 cursor-pointer"
                        onClick={() => {
                          handleSortChange(key);
                          closeSelectBox();
                        }}
                      >
                        <span className={`text-sm ${isSelected ? "text-primary" : "text-white"}`}>
                          {name}
                        </span>
                        <CheckIcon className={`${isSelected ? "" : "hidden"}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          {positionHistory && positionHistory.length > 0 ? (
            positionHistory.map((record, index) => {
              const ifMeme = checkIfMeme({
                debt_id: record.token_d,
                pos_id: record.token_p,
              });
              const assetD = !ifMeme
                ? getAssetById(record.token_d)
                : getAssetByIdMEME(record.token_d);
              const assetP = !ifMeme
                ? getAssetById(record.token_p)
                : getAssetByIdMEME(record.token_p);
              const assetC = !ifMeme
                ? getAssetById(record.token_c)
                : getAssetByIdMEME(record.token_c);
              if (!assetD || !assetP || !assetC) {
                return null;
              }
              return (
                <HistoryRow
                  key={index}
                  index={index}
                  record={record}
                  assetP={assetP}
                  assetD={assetD}
                  assetC={assetC}
                />
              );
            })
          ) : (
            <div className="h-32 flex items-center justify-center w-full text-base text-gray-400">
              No data
            </div>
          )}
          {totalHistoryPages !== 0 && (
            <Pagination
              currentPage={pageNum + 1}
              totalPages={totalHistoryPages}
              onPageChange={(page) => {
                setPageNum(page - 1);
              }}
              inputPage={inputPage}
              setInputPage={setInputPage}
              handlePageJump={(pageNumber) => setPageNum(pageNumber - 1)}
            />
          )}
        </div>
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
                        const assetDetails =
                          token.type === "main"
                            ? getAssetById(token.token_id)
                            : getAssetByIdMEME(token.token_id);
                        const marginAssetDetails = getAssetDetails(assetDetails);
                        return (
                          <AccountRow
                            key={index}
                            token={token}
                            assetDetails={assetDetails}
                            marginAssetDetails={marginAssetDetails}
                            parseTokenValue={parseTokenValue}
                          />
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

export default TradingTable;
