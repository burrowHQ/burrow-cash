import React, { useEffect } from "react";
import Link from "next/link";
import getConfig from "next/config";
import { ArrowDownIcon, ArrowUpIcon, NearIcon } from "./Icon";
import { useMarginConfigToken } from "../../../hooks/useMarginConfig";
import {
  formatWithCommas_usd,
  toInternationalCurrencySystem_number,
} from "../../../utils/uiNumber";
import { NewTagIcon } from "../../Market/svg";
import { shrinkToken } from "../../../store/helper";

const MarketMarginTrading = () => {
  const { filterMarginConfigList } = useMarginConfigToken();
  const [totalLongUSD, setTotalLongUSD] = React.useState(0);
  const [totalShortUSD, setTotalShortUSD] = React.useState(0);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc" | null>(null);
  const [sortBy, setSortBy] = React.useState<string | null>(null);

  const handleSort = (field: string) => {
    setSortBy((prev) => field);
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };
  const sortedData = React.useMemo(() => {
    if (!sortBy || !sortDirection)
      return Object.values(filterMarginConfigList as Record<string, any>);

    const dataList = Object.values(filterMarginConfigList as Record<string, any>);

    return dataList.sort((a, b) => {
      let valueA;
      let valueB;
      if (sortBy === "longPosition") {
        valueA = parseFloat(
          shrinkToken(a.margin_position, a.metadata.decimals + a.config.extra_decimals),
        );
        valueB = parseFloat(
          shrinkToken(b.margin_position, b.metadata.decimals + b.config.extra_decimals),
        );
      } else if (sortBy === "shortPosition") {
        valueA = parseFloat(
          shrinkToken(a.margin_debt.balance, a.metadata.decimals + a.config.extra_decimals),
        );
        valueB = parseFloat(
          shrinkToken(b.margin_debt.balance, b.metadata.decimals + a.config.extra_decimals),
        );
      }
      return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
    });
  }, [filterMarginConfigList, sortBy, sortDirection]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="flex justify-between items-center w-full h-[100px] border border-dark-50 bg-gray-800 rounded-md mb-8">
        <DataItem title="Total Volume" value="$-" />
        <DataItem title="24H Volume" value="$-" />
        <DataItem title="Long Open Interest" value={formatWithCommas_usd(totalLongUSD)} />
        <DataItem title="Short Open Interest" value={formatWithCommas_usd(totalShortUSD)} />
      </div>
      <TableHead onSort={handleSort} sortDirection={sortDirection} sortBy={sortBy} />
      <TableBody
        data={sortedData}
        setTotalLongUSD={setTotalLongUSD}
        setTotalShortUSD={setTotalShortUSD}
      />
    </div>
  );
};

const DataItem = ({ title, value }) => (
  <div className="flex flex-1 justify-center">
    <div>
      <p className="text-gray-300 text-sm">{title}</p>
      <h2 className="text-h2">{value}</h2>
    </div>
  </div>
);

function SortButton({ sort }) {
  return (
    <div className="flex flex-col items-center gap-0.5 ml-1.5">
      <ArrowUpIcon fill={`${sort === "asc" ? "rgba(0, 0, 0, 1)" : "rgba(0, 0, 0, 0.5)"}`} />
      <ArrowDownIcon fill={`${sort === "desc" ? "rgba(0, 0, 0, 1)" : "rgba(0, 0, 0, 0.5)"}`} />
    </div>
  );
}

function TableHead({ onSort, sortDirection, sortBy }) {
  return (
    <div className="w-full grid grid-cols-5 h-12">
      <div className="grid grid-cols-3 col-span-3 border border-dark-50 bg-gray-800 rounded-t-2xl items-center text-sm text-gray-300">
        <div className="col-span-1 flex items-center cursor-pointer pl-6 xl:pl-14 whitespace-nowrap">
          Market
        </div>
        <div className="col-span-1 flex items-center cursor-pointer pl-6 xl:pl-14 whitespace-nowrap">
          Total Volume
          {/* <SortButton color="#C0C4E9" /> */}
        </div>
        <div className="col-span-1 flex items-center cursor-pointer pl-6 xl:pl-14 whitespace-nowrap">
          24H Volume
          {/* <SortButton color="#C0C4E9" /> */}
        </div>
      </div>
      <div
        className="grid grid-cols-1 col-span-1 bg-primary rounded-t-2xl items-center text-sm text-black"
        onClick={() => onSort("longPosition")}
      >
        <div className="col-span-1 flex items-center cursor-pointer pl-6 xl:pl-14 whitespace-nowrap">
          Long Position
          <SortButton sort={sortBy === "longPosition" ? sortDirection : null} />
        </div>
      </div>
      <div
        className="grid grid-cols-1 col-span-1 bg-red-50 rounded-t-2xl items-center text-sm text-black"
        onClick={() => onSort("shortPosition")}
      >
        <div className="col-span-1 flex items-center cursor-pointer pl-6 xl:pl-14 whitespace-nowrap">
          Short Position
          <SortButton sort={sortBy === "shortPosition" ? sortDirection : null} />
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
            <div className="w-full grid grid-cols-5 bg-gray-800 hover:bg-dark-100 cursor-pointer mt-0.5 h-[60px]">
              <div className="relative col-span-1 flex items-center justify-self-start pl-14">
                {item.metadata?.symbol === "wNEAR" ? (
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
                  <div className="flex items-center flex-wrap">
                    {item.metadata?.symbol === "wNEAR" ? "NEAR" : item.metadata?.symbol}
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
              </div>
              <div className="col-span-1 flex flex-col justify-center pl-6 xl:pl-14 whitespace-nowrap">
                <div className="flex flex-col items-start ml-3">
                  <div className="flex items-end">-</div>
                  <span className="text-xs text-gray-300">$-</span>
                </div>
              </div>
              <div className="col-span-1 flex flex-col justify-center pl-6 xl:pl-14 whitespace-nowrap">
                <div className="flex flex-col items-start ml-3">
                  <div className="flex items-end">-</div>
                  <span className="text-xs text-gray-300">$-</span>
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

export default MarketMarginTrading;
