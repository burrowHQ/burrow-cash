import React, { useEffect, useState } from "react";
import Link from "next/link";
import getConfig from "next/config";
import Modal from "react-modal";
import { ArrowDownIcon, ArrowUpIcon, NearIcon, MarginTradingTextIcon } from "./Icon";
import { useMarginConfigToken } from "../../../hooks/useMarginConfig";
import { formatWithCommas_usd } from "../../../utils/uiNumber";
import { ArrowLineDownIcon, CheckIcon, NewTagIcon } from "../../Market/svg";
import { shrinkToken } from "../../../store/helper";
import DataSource from "../../../data/datasource";
import { isMobileDevice } from "../../../helpers/helpers";
import { nearTokenId } from "../../../utils";
import { getSymbolById } from "../../../transformers/nearSymbolTrans";
import { useRegisterTokenType } from "../../../hooks/useRegisterTokenType";
import { MemeTagIcon } from "../../Trading/components/TradingIcon";
import { beautifyPrice } from "../../../utils/beautyNumber";
import { getAccount as getAccountWallet } from "../../../utils/wallet-selector-compat";
import { useAccountId } from "../../../hooks/hooks";
import UserPnlModal from "./UserPnlModal";
import { formatNumberWithTwoDecimals } from "../../../utils/formatNumberWithTwoDecimals";

type TokenTypeMap = {
  mainStream: string[];
  memeStream: string[];
};

const MarketMarginTrading = () => {
  const isMobile = isMobileDevice();
  const accountId = useAccountId();
  const { filteredTokenTypeMap } = useRegisterTokenType();
  const { filterMarginConfigList } = useMarginConfigToken();
  const [totalLongUSD, setTotalLongUSD] = React.useState(0);
  const [totalShortUSD, setTotalShortUSD] = React.useState(0);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc" | null>(null);
  const [sortBy, setSortBy] = React.useState<string | null>(null);
  const [mergedData, setMergedData] = useState<any[]>([]);
  const [volumeStats, setVolumeStats] = React.useState<{
    totalVolume: number;
    volume24h: number;
  }>({
    totalVolume: 0,
    volume24h: 0,
  });
  const [prevFilterMarginConfigList, setPrevFilterMarginConfigList] = useState<Record<
    string,
    any
  > | null>(null);
  const [pnlData, setPnlData] = useState<any[]>([]);
  const [showPnlModal, setShowPnlModal] = useState(false);
  const [currentPnlPage, setCurrentPnlPage] = useState(0);
  const [totalPnlPages, setTotalPnlPages] = useState(0);

  useEffect(() => {
    const fetchVolumeStats = async () => {
      try {
        const response = await DataSource.shared.getMarginTradingVolumeStatistics();
        setVolumeStats({
          totalVolume: response?.data.total_volume || 0,
          volume24h: response?.data["24h_volume"] || 0,
        });
      } catch (error) {
        console.error("Failed to fetch volume statistics:", error);
      }
    };

    fetchVolumeStats();
    handleSort("longPosition");
  }, []);

  useEffect(() => {
    const fetchAllVolumeStats = async () => {
      try {
        const marginConfigList: Record<string, any> = filterMarginConfigList;
        const promises = Object.values(marginConfigList).map((item) =>
          DataSource.shared.getMarginTradingTokenVolumeStatistics(item.token_id),
        );
        const results = await Promise.all(promises);
        const mergedData: any[] = Object.values(marginConfigList).map((item, index) => {
          const volumeData: any | undefined = results[index];
          return {
            ...item,
            totalVolume: volumeData?.data?.total_volume || 0,
            volume24h: volumeData?.data?.["24h_volume"] || 0,
          };
        });
        setMergedData(mergedData);
      } catch (error) {
        console.error("Failed to fetch volume statistics:", error);
      }
    };

    if (filterMarginConfigList && Object.keys(filterMarginConfigList).length > 0) {
      if (JSON.stringify(filterMarginConfigList) !== JSON.stringify(prevFilterMarginConfigList)) {
        fetchAllVolumeStats();
        setPrevFilterMarginConfigList(filterMarginConfigList);
      }
    }
  }, [filterMarginConfigList, prevFilterMarginConfigList]);

  useEffect(() => {
    const fetchPnlData = async () => {
      try {
        const response = await DataSource.shared.getMarginTradingUserPnlList(accountId, 0, 10);
        if (response?.data) {
          setPnlData(response.data.position_records || []);
          setTotalPnlPages(Math.ceil(response.data.total / 10));
        }
      } catch (error) {
        console.error("Failed to fetch PNL data:", error);
      }
    };

    fetchPnlData();
  }, [accountId]);

  const handleSort = (field: string) => {
    if (isMobile) {
      setSortBy(field);
      setSortDirection("desc");
    } else {
      setSortBy((prev) => field);
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortBy || !sortDirection) {
      return Object.values(mergedData as Record<string, any>);
    }
    const dataList = Object.values(mergedData as Record<string, any>);
    return dataList.sort((a, b) => {
      let valueA = 0;
      let valueB = 0;

      if (sortBy === "longPosition") {
        valueA = parseFloat(
          shrinkToken(a.margin_position, a.metadata.decimals + a.config.extra_decimals) || "0",
        );
        valueB = parseFloat(
          shrinkToken(b.margin_position, b.metadata.decimals + b.config.extra_decimals) || "0",
        );
      } else if (sortBy === "shortPosition") {
        valueA = parseFloat(
          shrinkToken(a.margin_debt.balance, a.metadata.decimals + a.config.extra_decimals) || "0",
        );
        valueB = parseFloat(
          shrinkToken(b.margin_debt.balance, b.metadata.decimals + b.config.extra_decimals) || "0",
        );
      } else if (sortBy === "totalVolume") {
        valueA = a.totalVolume;
        valueB = b.totalVolume;
      } else if (sortBy === "volume24h") {
        valueA = a.volume24h;
        valueB = b.volume24h;
      }
      return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
    });
  }, [mergedData, sortBy, sortDirection, filterMarginConfigList]);

  const handlePnlPageChange = async (page: number) => {
    try {
      const response = await DataSource.shared.getMarginTradingUserPnlList(accountId, page, 10);
      if (response?.data) {
        setPnlData(response.data.position_records || []);
        setCurrentPnlPage(page);
      }
    } catch (error) {
      console.error("Failed to fetch PNL data:", error);
    }
  };

  const topUser = pnlData.find((item) => item.rank === 1);

  const formatAddress = (address: string) => {
    const parts = address.split(".");
    if (parts.length === 1) {
      if (address.length <= 1) return "***";
      if (address.length <= 6) {
        const halfLength = Math.floor(address.length / 2);
        return address.slice(0, halfLength) + "*".repeat(address.length - halfLength);
      }
      return `${address.slice(0, 6)}***`;
    }

    const account = parts[0];
    const domain = parts[1];

    if (account.length <= 1) return `***.${domain}`;
    if (account.length <= 6) {
      const halfLength = Math.floor(account.length / 2);
      return `${account.slice(0, halfLength)}${"*".repeat(account.length - halfLength)}.${domain}`;
    }
    return `${account.slice(0, 6)}***.${domain}`;
  };

  const formatPnl = (pnl: string) => {
    const num = parseFloat(pnl);
    const formatted = Math.abs(num).toFixed(2);
    return num >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  const formatRoi = (roi: string) => {
    const num = parseFloat(roi) * 100;
    if (Number.isNaN(num)) {
      return "-";
    }
    const sign = num >= 0 ? "+" : "-";
    return `${sign}${Math.abs(num).toFixed(2)}%`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {isMobile ? (
        <>
          <div className="w-full px-4">
            <div className="text-xl text-white mb-4">Margin Trading</div>
            <div className="grid  grid-cols-2 gap-5 mx-auto border border-dark-50 bg-dark-110 p-4 rounded-2xl">
              <div className="flex flex-1 justify-center xsm:justify-start">
                <div>
                  <p className="text-gray-300 text-sm">Total Volume</p>
                  <h2 className="text-h2">${beautifyPrice(volumeStats.totalVolume)}</h2>
                </div>
              </div>
              <div className="flex flex-1 justify-center xsm:justify-start">
                <div>
                  <p className="text-gray-300 text-sm">24H Volume</p>
                  <h2 className="text-h2">${beautifyPrice(volumeStats.volume24h)}</h2>
                </div>
              </div>
              <div className="flex flex-1 justify-center xsm:justify-start">
                <div>
                  <p className="text-gray-300 text-sm">Long Open Interest</p>
                  <h2 className="text-h2">${beautifyPrice(totalLongUSD)}</h2>
                </div>
              </div>
              <div className="flex flex-1 justify-center xsm:justify-start">
                <div>
                  <p className="text-gray-300 text-sm">Short Open Interest</p>
                  <h2 className="text-h2">${beautifyPrice(totalShortUSD)}</h2>
                </div>
              </div>
            </div>
          </div>
          {topUser && (
            <div className="w-full px-4">
              <div className="w-full bg-green-150 bg-opacity-20 rounded-lg px-4 py-2.5 flex items-center justify-between text-sm text-white mt-5">
                <div>
                  <div className="flex items-center">
                    <p className="mr-[14px] jost-600-bold">Top 1</p>
                    <div className="flex items-center mr-2.5">
                      <p className="text-gray-1450 mr-1">User: </p>
                      <p>{formatAddress(topUser.address)}</p>
                    </div>
                  </div>
                  <div className="flex items-center mr-2.5">
                    <p className="text-gray-1450 mr-1">PnL/ROI: </p>
                    <p className="flex items-center">
                      <span
                        className={parseFloat(topUser.pnl) >= 0 ? "text-primary" : "text-orange"}
                      >
                        {formatPnl(topUser.pnl)}
                      </span>
                      {" / "}
                      {formatRoi(topUser.roi)}
                      <div className="ml-1">🎉</div>
                    </p>
                  </div>
                </div>
                <div
                  onClick={() => setShowPnlModal(true)}
                  className="text-primary underline text-sm cursor-pointer hover:text-primary-dark"
                >
                  Users PnL
                </div>
              </div>
            </div>
          )}
          <TableHeadMobile onSort={handleSort} sortDirection={sortDirection} sortBy={sortBy} />
          <div className="px-4 w-full">
            <TableBodyMobile
              data={sortedData}
              setTotalLongUSD={setTotalLongUSD}
              setTotalShortUSD={setTotalShortUSD}
              filteredTokenTypeMap={filteredTokenTypeMap}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center w-full h-[100px] border border-dark-50 bg-dark-110 rounded-3xl mb-8 pl-[30px]">
            <div className="flex flex-1">
              <MarginTradingTextIcon />
            </div>
            <div className="flex flex-1 justify-center xsm:justify-start xsm:mb-[30px]">
              <div>
                <p className="text-gray-300 text-sm">Total Volume</p>
                <h2 className="text-h2">${beautifyPrice(volumeStats.totalVolume)}</h2>
              </div>
            </div>
            <div className="flex flex-1 justify-center xsm:justify-start xsm:mb-[30px]">
              <div>
                <p className="text-gray-300 text-sm">24H Volume</p>
                <h2 className="text-h2">${beautifyPrice(volumeStats.volume24h)}</h2>
              </div>
            </div>
            <div className="flex flex-1 justify-center xsm:justify-start xsm:mb-[30px]">
              <div>
                <p className="text-gray-300 text-sm">Long Open Interest</p>
                <h2 className="text-h2">${beautifyPrice(totalLongUSD)}</h2>
              </div>
            </div>
            <div className="flex flex-1 justify-center xsm:justify-start xsm:mb-[30px]">
              <div>
                <p className="text-gray-300 text-sm">Short Open Interest</p>
                <h2 className="text-h2">${beautifyPrice(totalShortUSD)}</h2>
              </div>
            </div>
          </div>
          {topUser && (
            <div className="w-full bg-green-150 bg-opacity-20 mb-4 h-8 rounded-lg flex items-center px-3 justify-between text-sm text-white">
              <div className="flex items-center">
                <p className="mr-[14px] jost-600-bold">Top 1</p>
                <div className="flex items-center mr-2.5">
                  <p className="text-gray-1450 mr-1">User: </p>
                  <p>{formatAddress(topUser.address)}</p>
                </div>
                <div className="flex items-center mr-2.5">
                  <p className="text-gray-1450 mr-1">Position Count: </p>
                  <p>{topUser.position_count ? topUser.position_count : "-"}</p>
                </div>
                <div className="flex items-center mr-2.5">
                  <p className="text-gray-1450 mr-1">PnL/ROI: </p>
                  <p>
                    <span className={parseFloat(topUser.pnl) >= 0 ? "text-primary" : "text-orange"}>
                      {formatPnl(topUser.pnl)}
                    </span>
                    {" / "}
                    {formatRoi(topUser.roi)}
                  </p>
                </div>
                <div className="flex items-center mr-2.5">
                  <p className="text-gray-1450 mr-1">Long/short: </p>
                  <p>
                    {formatNumberWithTwoDecimals(topUser.long_value)} /{" "}
                    {formatNumberWithTwoDecimals(topUser.short_value)}
                  </p>
                </div>
                <div className="flex items-center mr-2.5">
                  <p className="text-gray-1450 mr-1">Win Rate: </p>
                  <p className="text-primary">
                    {topUser.win_rate ? beautifyPrice(topUser.win_rate * 100) : "-"}%
                  </p>
                </div>
                <div className="ml-1">🎉</div>
              </div>
              <div
                onClick={() => setShowPnlModal(true)}
                className="text-primary underline text-sm cursor-pointer hover:text-primary-dark"
              >
                Users PnL
              </div>
            </div>
          )}
          <TableHead onSort={handleSort} sortDirection={sortDirection} sortBy={sortBy} />
          <TableBody
            data={sortedData}
            setTotalLongUSD={setTotalLongUSD}
            setTotalShortUSD={setTotalShortUSD}
            filteredTokenTypeMap={filteredTokenTypeMap}
          />
        </>
      )}

      <UserPnlModal
        isOpen={showPnlModal}
        onClose={() => setShowPnlModal(false)}
        accountId={accountId}
      />
    </div>
  );
};

function SortButton({
  sort,
  activeColor,
  inactiveColor,
}: {
  sort: "asc" | "desc" | null;
  activeColor: string;
  inactiveColor: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 ml-1.5">
      <ArrowUpIcon fill={`${sort === "asc" ? activeColor : inactiveColor}`} />
      <ArrowDownIcon fill={`${sort === "desc" ? activeColor : inactiveColor}`} />
    </div>
  );
}

function TableHead({
  onSort,
  sortDirection,
  sortBy,
}: {
  onSort: (field: string) => void;
  sortDirection: "asc" | "desc" | null;
  sortBy: string | null;
}) {
  return (
    <div className="w-full grid grid-cols-5 col-span-5 bg-dark-110 rounded-t-2xl items-center text-sm text-gray-300 h-12">
      <div className="col-span-1 flex items-center cursor-pointer pl-6 xl:pl-14 whitespace-nowrap jost-600-bold">
        Market
      </div>
      <div
        className="col-span-1 flex items-center cursor-pointer pl-6 xl:pl-14 whitespace-nowrap jost-600-bold"
        onClick={() => onSort("totalVolume")}
      >
        Total Volume
        <SortButton
          activeColor="rgba(192, 196, 233, 1)"
          inactiveColor="rgba(192, 196, 233, 0.5)"
          sort={sortBy === "totalVolume" ? sortDirection : null}
        />
      </div>
      <div
        className="col-span-1 flex items-center cursor-pointer pl-6 xl:pl-14 whitespace-nowrap jost-600-bold"
        onClick={() => onSort("volume24h")}
      >
        24H Volume
        <SortButton
          activeColor="rgba(192, 196, 233, 1)"
          inactiveColor="rgba(192, 196, 233, 0.5)"
          sort={sortBy === "volume24h" ? sortDirection : null}
        />
      </div>
      <div onClick={() => onSort("longPosition")}>
        <div className="col-span-1 flex items-center cursor-pointer pl-6 xl:pl-14 whitespace-nowrap text-primary jost-600-bold">
          Long Position
          <SortButton
            activeColor="rgba(0, 247, 165, 1)"
            inactiveColor="rgba(0, 247, 165, 0.5)"
            sort={sortBy === "longPosition" ? sortDirection : null}
          />
        </div>
      </div>
      <div onClick={() => onSort("shortPosition")}>
        <div className="col-span-1 flex items-center cursor-pointer pl-6 xl:pl-14 whitespace-nowrap text-orange jost-600-bold">
          Short Position
          <SortButton
            activeColor="rgba(255, 105, 71, 1)"
            inactiveColor="rgba(255, 105, 71, 0.5)"
            sort={sortBy === "shortPosition" ? sortDirection : null}
          />
        </div>
      </div>
    </div>
  );
}

function TableHeadMobile({ onSort, sortDirection, sortBy }) {
  const [showSelectBox, setShowSelectBox] = useState(false);
  const sortList = {
    longPosition: "Long Position",
    shortPosition: "Short Position",
    totalVolume: "Total Volume",
    volume24h: "24H Volume",
  };

  const handleSelectBox = () => {
    setShowSelectBox(!showSelectBox);
  };

  const closeSelectBox = () => {
    setShowSelectBox(false);
  };

  return (
    <div className="flex items-center justify-between h-[34px] mb-[30px] w-full mt-6 px-4">
      <span className="text-white font-bold">All Markets</span>
      <div className="flex items-center">
        <span className="text-gray-300 h4 mr-2.5">Sort by</span>
        <div className="relative z-10" onBlur={closeSelectBox} tabIndex={0}>
          <div
            onClick={handleSelectBox}
            className="flex gap-2.5 items-center justify-center bg-gray-800 border border-dark-50 rounded-md px-2.5 py-1.5 text-sm text-white"
          >
            {sortList[sortBy]}
            <ArrowLineDownIcon />
          </div>
          <div
            className={`border border-dark-50 rounded-md px-4 py-1 bg-dark-100 absolute right-0 w-[180px] top-[40px] ${
              showSelectBox ? "" : "hidden"
            }`}
          >
            {Object.entries(sortList).map(([key, name]) => {
              const isSelected = sortBy === key;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between py-3 cursor-pointer"
                  onClick={() => {
                    onSort(key);
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
  );
}

const calculateAndFormatUSD = (value, pricePerUnit) => {
  if (!value || !pricePerUnit) return "$-";
  const product = parseFloat(value) * parseFloat(pricePerUnit);
  return formatWithCommas_usd(product);
};

function TableBody({
  data,
  setTotalLongUSD,
  setTotalShortUSD,
  filteredTokenTypeMap,
}: {
  data: Record<string, any>;
  setTotalLongUSD: (value: number) => void;
  setTotalShortUSD: (value: number) => void;
  filteredTokenTypeMap: TokenTypeMap;
}) {
  const { NATIVE_TOKENS, NEW_TOKENS } = getConfig() as any;
  useEffect(() => {
    let totalLongUSD = 0;
    let totalShortUSD = 0;
    Object.values(data).forEach((item) => {
      const assetDecimals = item.metadata.decimals + item.config.extra_decimals;
      const formattedMarginPosition = shrinkToken(item.margin_position, assetDecimals);
      const formattedMarginBalance = shrinkToken(item.margin_debt.balance, assetDecimals);
      if (item.price?.usd) {
        totalLongUSD += parseFloat(formattedMarginPosition) * parseFloat(item.price.usd);
        totalShortUSD += parseFloat(formattedMarginBalance) * parseFloat(item.price.usd);
      }
    });
    setTotalLongUSD(totalLongUSD);
    setTotalShortUSD(totalShortUSD);
  }, [data, setTotalLongUSD, setTotalShortUSD]);
  return (
    <>
      {Object.values(data).map((item, index) => {
        const is_native = NATIVE_TOKENS?.includes(item.token_id);
        const is_new = NEW_TOKENS?.includes(item.token_id);
        const assetDecimals = item.metadata.decimals + item.config.extra_decimals;
        const formattedMarginPosition = shrinkToken(item.margin_position, assetDecimals);
        const formattedMarginBalance = shrinkToken(item.margin_debt.balance, assetDecimals);
        const isMainStream = filteredTokenTypeMap.mainStream.includes(item.token_id);
        return (
          <Link href={`/trading/${item.token_id}`} key={item.token_id} className="w-full">
            <div className="w-full grid grid-cols-5 bg-dark-110 hover:bg-gray-500 cursor-pointer mt-0.5 h-[60px]">
              <div className="relative col-span-1 flex items-center justify-self-start pl-14">
                {item.token_id == nearTokenId ? (
                  <NearIcon />
                ) : (
                  <img
                    alt=""
                    src={item.metadata?.icon}
                    style={{ width: "26px", height: "26px", borderRadius: "50%" }}
                  />
                )}
                {is_new ? (
                  <NewTagIcon
                    className={`absolute transform -translate-x-[4px] z-20 ${
                      item.isLpToken && item?.tokens?.length > 2 ? "bottom-2" : "bottom-1"
                    }`}
                  />
                ) : null}
                <div className="flex flex-col items-start ml-3">
                  <div className="flex items-center">
                    <span className="mr-1" style={{ whiteSpace: "nowrap" }}>
                      {getSymbolById(item.token_id, item.metadata?.symbol)}
                    </span>
                    {is_native ? (
                      <span
                        style={{ zoom: 0.85 }}
                        className="text-gray-300 italic text-xs transform -translate-y-0.5 ml-0.5"
                      >
                        Native
                      </span>
                    ) : null}
                    {!isMainStream && <MemeTagIcon />}
                  </div>
                  <span className="text-xs text-gray-300">
                    {beautifyPrice(item.price?.usd, true)}
                  </span>
                </div>
              </div>
              <div className="col-span-1 flex flex-col justify-center pl-6 xl:pl-14 whitespace-nowrap">
                <div className="flex flex-col items-start ml-3">
                  <div className="flex items-end">${beautifyPrice(item.totalVolume)}</div>
                  {/* <span className="text-xs text-gray-300">$-</span> */}
                </div>
              </div>
              <div className="col-span-1 flex flex-col justify-center pl-6 xl:pl-14 whitespace-nowrap">
                <div className="flex flex-col items-start ml-3">
                  <div className="flex items-end">${beautifyPrice(item.volume24h)}</div>
                  {/* <span className="text-xs text-gray-300">$-</span> */}
                </div>
              </div>
              <div className="col-span-1 flex flex-col justify-center pl-6 xl:pl-14 whitespace-nowrap">
                <div className="flex flex-col items-start ml-3">
                  <div className="flex items-end">{beautifyPrice(formattedMarginPosition)}</div>
                  <span className="text-xs text-gray-300">
                    {beautifyPrice(Number(formattedMarginPosition) * Number(item.price?.usd), true)}
                  </span>
                </div>
              </div>
              <div className="col-span-1 flex flex-col justify-center pl-6 xl:pl-14 whitespace-nowrap">
                <div className="flex flex-col items-start ml-3">
                  <div className="flex items-end">{beautifyPrice(formattedMarginBalance)}</div>
                  <span className="text-xs text-gray-300">
                    {beautifyPrice(Number(formattedMarginBalance) * Number(item.price?.usd), true)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </>
  );
}

function TableBodyMobile({
  data,
  setTotalLongUSD,
  setTotalShortUSD,
  filteredTokenTypeMap,
}: {
  data: Record<string, any>;
  setTotalLongUSD: (value: number) => void;
  setTotalShortUSD: (value: number) => void;
  filteredTokenTypeMap: TokenTypeMap;
}) {
  const { NATIVE_TOKENS, NEW_TOKENS } = getConfig() as any;
  useEffect(() => {
    let totalLongUSD = 0;
    let totalShortUSD = 0;
    Object.values(data).forEach((item) => {
      const assetDecimals = item.metadata.decimals + item.config.extra_decimals;
      const formattedMarginPosition = shrinkToken(item.margin_position, assetDecimals);
      const formattedMarginBalance = shrinkToken(item.margin_debt.balance, assetDecimals);
      if (item.price?.usd) {
        totalLongUSD += parseFloat(formattedMarginPosition) * parseFloat(item.price.usd);
        totalShortUSD += parseFloat(formattedMarginBalance) * parseFloat(item.price.usd);
      }
    });
    setTotalLongUSD(totalLongUSD);
    setTotalShortUSD(totalShortUSD);
  }, [data, setTotalLongUSD, setTotalShortUSD]);
  return (
    <>
      {Object.values(data).map((item, index) => {
        const is_native = NATIVE_TOKENS?.includes(item.token_id);
        const is_new = NEW_TOKENS?.includes(item.token_id);
        const assetDecimals = item.metadata.decimals + item.config.extra_decimals;
        const formattedMarginPosition = shrinkToken(item.margin_position, assetDecimals);
        const formattedMarginBalance = shrinkToken(item.margin_debt.balance, assetDecimals);
        const isMainStream = filteredTokenTypeMap.mainStream.includes(item.token_id);
        return (
          <Link href={`/trading/${item.token_id}`} key={item.token_id}>
            <div className="mb-4 bg-dark-110 rounded-xl w-full">
              <div className="flex items-center justify-between pt-6 pb-4 px-4 relative border-b border-dark-50">
                <div className="flex items-center">
                  {item.token_id == nearTokenId ? (
                    <NearIcon />
                  ) : (
                    <img
                      alt=""
                      src={item.metadata?.icon}
                      style={{ width: "26px", height: "26px", borderRadius: "50%" }}
                    />
                  )}
                  <div className="flex flex-col gap-0.5 items-start ml-2">
                    <div className="flex items-center flex-wrap text-sm gap-1">
                      {getSymbolById(item.token_id, item.metadata?.symbol)}
                      {is_native ? (
                        <span
                          style={{ zoom: 0.85 }}
                          className="text-gray-300 italic text-xs transform -translate-y-0.5 ml-0.5"
                        >
                          Native
                        </span>
                      ) : null}
                      {!isMainStream && <MemeTagIcon />}
                    </div>
                    <span className="text-xs text-gray-300">
                      {beautifyPrice(item.price?.usd, true)}
                    </span>
                  </div>
                  {is_new ? (
                    <NewTagIcon
                      className={`absolute transform -translate-x-[4px] z-20 ${
                        item.isLpToken && item?.tokens?.length > 2 ? "bottom-2" : "bottom-1"
                      }`}
                    />
                  ) : null}
                </div>
              </div>
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-4 text-sm">
                  <p className="text-gray-300 h4">Total Volume</p>
                  <p>${beautifyPrice(item.totalVolume)}</p>
                </div>
                <div className="flex items-center justify-between mb-4 text-sm">
                  <p className="text-gray-300 h4">24H Volume</p>
                  <p>${beautifyPrice(item.volume24h)}</p>
                </div>
                <div className="flex items-center justify-between mb-4 text-sm">
                  <p className="text-gray-300 h4">Long Position</p>
                  <p className="text-primary">
                    {beautifyPrice(formattedMarginPosition)}
                    <span className="text-xs text-gray-300 ml-1">
                      (
                      {beautifyPrice(
                        Number(formattedMarginPosition) * Number(item.price?.usd),
                        true,
                      )}
                      )
                    </span>
                  </p>
                </div>
                <div className="flex items-center justify-between mb-4 text-sm">
                  <p className="text-gray-300 h4">Short Position</p>
                  <p className="text-orange">
                    {beautifyPrice(formattedMarginBalance)}
                    <span className="text-xs text-gray-300 ml-1">
                      (
                      {beautifyPrice(
                        Number(formattedMarginBalance) * Number(item.price?.usd),
                        true,
                      )}
                      )
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </>
  );
}

export default MarketMarginTrading;
