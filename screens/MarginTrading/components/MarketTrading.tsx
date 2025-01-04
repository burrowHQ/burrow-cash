import React, { useEffect, useState } from "react";
import Link from "next/link";
import getConfig from "next/config";
import { ArrowDownIcon, ArrowUpIcon, NearIcon } from "./Icon";
import { useMarginConfigToken } from "../../../hooks/useMarginConfig";
import {
  formatPrice,
  formatWithCommas_usd,
  toInternationalCurrencySystem_number,
} from "../../../utils/uiNumber";
import { ArrowLineDownIcon, CheckIcon, NewTagIcon } from "../../Market/svg";
import { shrinkToken } from "../../../store/helper";
import DataSource from "../../../data/datasource";
import { isMobileDevice } from "../../../helpers/helpers";
import { nearTokenId } from "../../../utils";
import { getSymbolById } from "../../../transformers/nearSymbolTrans";
import { useRegisterTokenType } from "../../../hooks/useRegisterTokenType";
import { MemeTagIcon } from "../../Trading/components/TradingIcon";

type TokenTypeMap = {
  mainStream: string[];
  memeStream: string[];
};

const MarketMarginTrading = ({ hidden }: { hidden: boolean }) => {
  const isMobile = isMobileDevice();
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
          console.log(volumeData, "volumeData");
          return {
            ...item,
            totalVolume: volumeData?.data.total_volume || 0,
            volume24h: volumeData?.data["24h_volume"] || 0,
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
          shrinkToken(b.margin_debt.balance, b.metadata.decimals + a.config.extra_decimals) || "0",
        );
        valueB = parseFloat(
          shrinkToken(a.margin_debt.balance, a.metadata.decimals + a.config.extra_decimals) || "0",
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
  return (
    <div className={hidden ? "hidden" : "flex flex-col items-center justify-center w-full"}>
      {isMobile ? (
        <>
          <div className="w-full border-b border-dark-950 px-4">
            <div className="flex justify-between">
              <div className="flex flex-1 justify-center xsm:justify-start xsm:mb-[30px]">
                <div>
                  <p className="text-gray-300 text-sm">Total Volume</p>
                  <h2 className="text-h2">${formatPrice(volumeStats.totalVolume)}</h2>
                </div>
              </div>
              <div className="flex flex-1 justify-center xsm:justify-start xsm:mb-[30px]">
                <div>
                  <p className="text-gray-300 text-sm">24H Volume</p>
                  <h2 className="text-h2">${formatPrice(volumeStats.volume24h)}</h2>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <DataItem title="Long Open Interest" value={formatWithCommas_usd(totalLongUSD)} />
              <DataItem title="Short Open Interest" value={formatWithCommas_usd(totalShortUSD)} />
            </div>
          </div>
          <TableHeadMobile onSort={handleSort} sortDirection={sortDirection} sortBy={sortBy} />
          <div className="px-4 w-full">
            <TableBodyMobile
              data={sortedData}
              setTotalLongUSD={setTotalLongUSD}
              setTotalShortUSD={setTotalShortUSD}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center w-full h-[100px] border border-dark-50 bg-gray-800 rounded-md mb-8">
            <div className="flex flex-1 justify-center xsm:justify-start xsm:mb-[30px]">
              <div>
                <p className="text-gray-300 text-sm">Total Volume</p>
                <h2 className="text-h2">${formatPrice(volumeStats.totalVolume)}</h2>
              </div>
            </div>
            <div className="flex flex-1 justify-center xsm:justify-start xsm:mb-[30px]">
              <div>
                <p className="text-gray-300 text-sm">24H Volume</p>
                <h2 className="text-h2">${formatPrice(volumeStats.volume24h)}</h2>
              </div>
            </div>
            <DataItem title="Long Open Interest" value={formatWithCommas_usd(totalLongUSD)} />
            <DataItem title="Short Open Interest" value={formatWithCommas_usd(totalShortUSD)} />
          </div>
          <TableHead onSort={handleSort} sortDirection={sortDirection} sortBy={sortBy} />
          <TableBody
            data={sortedData}
            setTotalLongUSD={setTotalLongUSD}
            setTotalShortUSD={setTotalShortUSD}
            filteredTokenTypeMap={filteredTokenTypeMap}
          />
        </>
      )}
    </div>
  );
};

const DataItem = ({ title, value }: { title: string; value: string }) => (
  <div className="flex flex-1 justify-center xsm:justify-start xsm:mb-[30px]">
    <div>
      <p className="text-gray-300 text-sm">{title}</p>
      <h2 className="text-h2">{value}</h2>
    </div>
  </div>
);

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
    <div className="w-full grid grid-cols-5 h-12">
      <div className="grid grid-cols-3 col-span-3 border border-dark-50 bg-gray-800 rounded-t-2xl items-center text-sm text-gray-300">
        <div className="col-span-1 flex items-center cursor-pointer pl-6 xl:pl-14 whitespace-nowrap">
          Market
        </div>
        <div
          className="col-span-1 flex items-center cursor-pointer pl-6 xl:pl-14 whitespace-nowrap"
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
          className="col-span-1 flex items-center cursor-pointer pl-6 xl:pl-14 whitespace-nowrap"
          onClick={() => onSort("volume24h")}
        >
          24H Volume
          <SortButton
            activeColor="rgba(192, 196, 233, 1)"
            inactiveColor="rgba(192, 196, 233, 0.5)"
            sort={sortBy === "volume24h" ? sortDirection : null}
          />
        </div>
      </div>
      <div
        className="grid grid-cols-1 col-span-1 bg-primary rounded-t-2xl items-center text-sm text-black"
        onClick={() => onSort("longPosition")}
      >
        <div className="col-span-1 flex items-center cursor-pointer pl-6 xl:pl-14 whitespace-nowrap">
          Long Position
          <SortButton
            activeColor="rgba(0, 0, 0, 1)"
            inactiveColor="rgba(0, 0, 0, 0.5)"
            sort={sortBy === "longPosition" ? sortDirection : null}
          />
        </div>
      </div>
      <div
        className="grid grid-cols-1 col-span-1 bg-red-50 rounded-t-2xl items-center text-sm text-black"
        onClick={() => onSort("shortPosition")}
      >
        <div className="col-span-1 flex items-center cursor-pointer pl-6 xl:pl-14 whitespace-nowrap">
          Short Position
          <SortButton
            activeColor="rgba(0, 0, 0, 1)"
            inactiveColor="rgba(0, 0, 0, 0.5)"
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
            className={`border border-dark-300 rounded-md px-4 py-1 bg-dark-100 absolute right-0 w-[180px] top-[40px] ${
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
          <Link href={`/trading/${item.token_id}`} key={item.token_id}>
            <div className="w-full grid grid-cols-5 bg-gray-800 hover:bg-dark-100 cursor-pointer mt-0.5 h-[60px]">
              <div className="relative col-span-1 flex items-center justify-self-start pl-14">
                {item.token_id == nearTokenId ? (
                  <NearIcon />
                ) : (
                  <img alt="" src={item.metadata?.icon} style={{ width: "26px", height: "26px" }} />
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
                    {formatWithCommas_usd(item.price?.usd)}
                  </span>
                </div>
              </div>
              <div className="col-span-1 flex flex-col justify-center pl-6 xl:pl-14 whitespace-nowrap">
                <div className="flex flex-col items-start ml-3">
                  <div className="flex items-end">${formatPrice(item.totalVolume)}</div>
                  {/* <span className="text-xs text-gray-300">$-</span> */}
                </div>
              </div>
              <div className="col-span-1 flex flex-col justify-center pl-6 xl:pl-14 whitespace-nowrap">
                <div className="flex flex-col items-start ml-3">
                  <div className="flex items-end">${formatPrice(item.volume24h)}</div>
                  {/* <span className="text-xs text-gray-300">$-</span> */}
                </div>
              </div>
              <div className="col-span-1 flex flex-col justify-center pl-6 xl:pl-14 whitespace-nowrap">
                <div className="flex flex-col items-start ml-3">
                  <div className="flex items-end">
                    {toInternationalCurrencySystem_number(formattedMarginPosition)}
                  </div>
                  <span className="text-xs text-gray-300">
                    {calculateAndFormatUSD(formattedMarginPosition, item.price?.usd)}
                  </span>
                </div>
              </div>
              <div className="col-span-1 flex flex-col justify-center pl-6 xl:pl-14 whitespace-nowrap">
                <div className="flex flex-col items-start ml-3">
                  <div className="flex items-end">
                    {toInternationalCurrencySystem_number(formattedMarginBalance)}
                  </div>
                  <span className="text-xs text-gray-300">
                    {calculateAndFormatUSD(formattedMarginBalance, item.price?.usd)}
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
}: {
  data: Record<string, any>;
  setTotalLongUSD: (value: number) => void;
  setTotalShortUSD: (value: number) => void;
}) {
  // console.log(data);
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
        return (
          <Link href={`/trading/${item.token_id}`} key={item.token_id}>
            <div className="mb-4 bg-gray-800 rounded-xl w-full">
              <div className="flex items-center justify-between pt-6 pb-4 px-4 border-b border-dark-950 relative">
                <div className="flex items-center">
                  {item.token_id == nearTokenId ? (
                    <NearIcon />
                  ) : (
                    <img
                      alt=""
                      src={item.metadata?.icon}
                      style={{ width: "26px", height: "26px" }}
                    />
                  )}
                  <div className="flex flex-col items-start ml-2">
                    <div className="flex items-center flex-wrap text-sm">
                      {getSymbolById(item.token_id, item.metadata?.symbol)}
                      {is_native ? (
                        <span
                          style={{ zoom: 0.85 }}
                          className="text-gray-300 italic text-xs transform -translate-y-0.5 ml-0.5"
                        >
                          Native
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-gray-300">
                      {formatWithCommas_usd(item.price?.usd)}
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
                <div className="flex flex-col items-end ml-2">
                  <div className="flex items-center flex-wrap text-sm">
                    ${formatPrice(item.totalVolume)}
                  </div>
                  <span className="text-xs text-gray-300">Total Valume</span>
                </div>
              </div>
              <div className="px-4 py-6">
                <div className="flex items-center justify-between mb-4 text-sm">
                  <p className="text-gray-300 h4">24H Volume</p>
                  <p>
                    ${formatPrice(item.volume24h)}
                    {/* <span className="text-xs text-gray-300">(-)</span> */}
                  </p>
                </div>
                <div className="flex items-center justify-between mb-4 text-sm">
                  <p className="text-gray-300 h4">Long Position</p>
                  <p className="text-primary">
                    {toInternationalCurrencySystem_number(formattedMarginPosition)}
                    <span className="text-xs text-gray-300 ml-1">
                      ({calculateAndFormatUSD(formattedMarginPosition, item.price?.usd)})
                    </span>
                  </p>
                </div>
                <div className="flex items-center justify-between mb-4 text-sm">
                  <p className="text-gray-300 h4">Short Position</p>
                  <p className="text-red-50">
                    {toInternationalCurrencySystem_number(formattedMarginBalance)}
                    <span className="text-xs text-gray-300 ml-1">
                      ({calculateAndFormatUSD(formattedMarginBalance, item.price?.usd)})
                    </span>
                  </p>
                </div>
                <div className="flex">
                  <div className="flex-1 bg-primary rounded-md text-base h-[36px] mr-2 text-dark-200 flex items-center justify-center">
                    Long
                  </div>
                  <div className="flex-1 bg-red-50 rounded-md text-base h-[36px] flex items-center justify-center">
                    Short
                  </div>
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
