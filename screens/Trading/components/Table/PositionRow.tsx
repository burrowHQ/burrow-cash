import { useEffect, useState } from "react";
import DataSource from "../../../../data/datasource";
import { useLiqPrice } from "../../../../hooks/useLiqPrice";
import { shrinkToken } from "../../../../store/helper";
import { toInternationalCurrencySystem_number } from "../../../../utils/uiNumber";
import { beautifyPrice } from "../../../../utils/beautyNumber";
import { AddCollateral } from "../../../MarginTrading/components/Icon";
import { isMobileDevice } from "../../../../helpers/helpers";

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
  assetsMEME,
  marginConfigTokens,
  filterTitle,
  marginAccountList,
  marginAccountListMEME,
  filteredTokenTypeMap,
}) => {
  // console.log(itemKey, item, index);
  const isMobile = isMobileDevice();
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
    const timeoutId = setTimeout(() => {
      fetchEntryPrice();
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [itemKey, item, index]);
  const positionType = getPositionType(item.token_c_info.token_id, item.token_d_info.token_id);
  const isMainStream = filteredTokenTypeMap.mainStream.includes(
    positionType.label === "Long" ? item.token_p_id : item.token_d_info.token_id,
  );
  const LiqPrice = useLiqPrice({
    token_c_info: {
      token_id: item.token_c_info.token_id,
      balance: item.token_c_info.balance,
    },
    token_d_info: {
      token_id: item.token_d_info.token_id,
      balance: item.token_d_info.balance,
    },
    token_p_info: {
      token_id: item.token_p_id,
      balance: item.token_p_amount,
    },
    position_type: positionType.label,
    uahpi_at_open: item.uahpi_at_open,
    memeCategory: !isMainStream,
    debt_cap: item.debt_cap,
  });
  const assetD = getAssetById(item.token_d_info.token_id, item);
  const assetC = getAssetById(item.token_c_info.token_id, item);
  const assetP = getAssetById(item.token_p_id, item);

  const { price: priceD, symbol: symbolD, decimals: decimalsD } = getAssetDetails(assetD);
  const { price: priceC, symbol: symbolC, decimals: decimalsC } = getAssetDetails(assetC);
  const { price: priceP, symbol: symbolP, decimals: decimalsP } = getAssetDetails(assetP);

  const leverageD = parseTokenValue(item.token_d_info.balance, decimalsD);
  const leverageC = parseTokenValue(item.token_c_info.balance, decimalsC);
  const leverage = calculateLeverage(leverageD, priceD, leverageC, priceC);

  const marketIcon =
    positionType.label === "Long" ? assetP?.metadata?.icon : assetD?.metadata?.icon;
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
  const assetLabel = positionType.label === "Long" ? symbolP : symbolD;
  const indexPrice = positionType.label === "Long" ? priceP / priceD : priceD / priceP;
  const openTime = new Date(Number(item.open_ts) / 1e6);
  const uahpi: any = isMainStream
    ? shrinkToken((assets as any).data[item.token_d_info.token_id]?.uahpi, 18)
    : shrinkToken((assetsMEME as any).data[item.token_d_info.token_id]?.uahpi, 18);
  const uahpi_at_open: any = isMainStream
    ? shrinkToken(marginAccountList[itemKey]?.uahpi_at_open ?? 0, 18)
    : shrinkToken(marginAccountListMEME[itemKey]?.uahpi_at_open ?? 0, 18);
  const holdingFee = +shrinkToken(item.debt_cap, decimalsD) * priceD * (uahpi - uahpi_at_open);
  const holding = +shrinkToken(item.debt_cap, decimalsD) * (uahpi - uahpi_at_open);
  const pnl =
    entryPrice !== null && entryPrice !== 0
      ? positionType.label === "Long"
        ? (indexPrice - entryPrice) * size * priceD
        : (entryPrice - indexPrice) * size * priceP
      : 0;

  let amplitude = 0;
  if (entryPrice !== null && entryPrice !== 0 && pnl !== 0) {
    amplitude =
      positionType.label === "Long"
        ? ((indexPrice - entryPrice) / entryPrice) * 100
        : ((entryPrice - indexPrice) / entryPrice) * 100;
  }
  const rowData = {
    pos_id: itemKey,
    data: item,
    marginConfigTokens,
    entryPrice,
  };
  return !isMobile ? (
    <tr className="text-base hover:bg-dark-100 font-normal align-text-top">
      <td className="py-5 pl-5">
        <div className="-mb-1.5">{marketTitle}</div>
        <span
          className={`text-xs ${
            getPositionType(item.token_c_info.token_id, item.token_d_info.token_id).class
          }`}
        >
          {getPositionType(item.token_c_info.token_id, item.token_d_info.token_id).label}
          <span className="ml-1.5">{toInternationalCurrencySystem_number(leverage)}x</span>
        </span>
      </td>
      <td>
        <div className="flex mr-4 items-start flex-col">
          <p className="">
            {" "}
            {beautifyPrice(size)} {assetLabel}
          </p>
          <span className="text-gray-300 text-xs">({beautifyPrice(sizeValue, true, 3, 3)})</span>
        </div>
      </td>
      <td>{beautifyPrice(netValue, true)}</td>
      <td>
        <div className="flex items-center">
          <p className="mr-2.5">
            {beautifyPrice(collateral, false)}
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
      <td>
        <div className="flex items-start flex-col">
          {entryPrice !== null && entryPrice !== undefined ? (
            <span>{beautifyPrice(entryPrice)}</span>
          ) : (
            <span className="text-gray-500">-</span>
          )}
        </div>
      </td>
      <td>
        <div className="flex items-start flex-col">{beautifyPrice(indexPrice)}</div>
      </td>
      <td>${beautifyPrice(LiqPrice)}</td>
      <td>
        <p className={`${pnl > 0 ? "text-green-150" : pnl < 0 ? "text-red-150" : "text-gray-400"}`}>
          {pnl === 0 ? "" : `${pnl > 0 ? `+$` : `-$`}`}
          {beautifyPrice(Math.abs(pnl), false, 3, 3)}
          {/* <span className="text-gray-400 text-xs ml-0.5">
            {amplitude !== null && amplitude !== 0
              ? `(${amplitude > 0 ? `+` : `-`}${toInternationalCurrencySystem_number(
                  Math.abs(amplitude),
                )}%)`
              : ``}
          </span> */}
        </p>
      </td>
      <td>
        <div className="text-sm">{new Date(openTime).toLocaleDateString()}</div>
        <div className="text-gray-300 text-xs">{new Date(openTime).toLocaleTimeString()}</div>
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
  ) : (
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
              src={assetC?.metadata?.icon}
              alt=""
              className="rounded-2xl border border-gray-800"
              style={{ width: "26px", height: "26px", marginLeft: "-6px" }}
            />
          </div>
          <div>
            <p>{marketTitle}</p>
            <p
              className={`text-xs -mt-0 ${
                getPositionType(item.token_c_info.token_id, item.token_d_info.token_id).class
              }`}
            >
              {getPositionType(item.token_c_info.token_id, item.token_d_info.token_id).label}
              <span className="ml-1.5">{toInternationalCurrencySystem_number(leverage)}x</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center">
            <p className="mr-2">
              {" "}
              {beautifyPrice(size)} {assetLabel}
            </p>
            <span className="text-gray-300 text-sm">({beautifyPrice(sizeValue, true, 3, 3)})</span>
          </div>
          <p className="text-xs text-gray-300">Size</p>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Net Value</p>
          <p>{beautifyPrice(netValue, true)}</p>
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Collateral</p>
          <div className="flex items-center">
            <p className="mr-2.5">
              {beautifyPrice(collateral, false)}
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
          <p>
            {entryPrice !== null ? (
              <span>{beautifyPrice(entryPrice)}</span>
            ) : (
              <span className="text-gray-500">-</span>
            )}
          </p>
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Index Price</p>
          <p>{beautifyPrice(indexPrice)}</p>
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Liq. Price</p>
          <p>${beautifyPrice(LiqPrice)}</p>
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Opening time</p>
          <p>{new Date(openTime).toLocaleString()}</p>
        </div>
        <div className="bg-dark-100 rounded-2xl flex items-center justify-center text-xs py-1 text-gray-300 mb-4">
          PNL{" "}
          <p
            className={`ml-1 ${
              pnl > 0 ? "text-green-150" : pnl < 0 ? "text-red-150" : "text-gray-400"
            }`}
          >
            {pnl === 0 ? "" : `${pnl > 0 ? `+$` : `-$`}`}
            {beautifyPrice(Math.abs(pnl), false, 3, 3)}
            {/* <span className="text-gray-400 text-xs ml-0.5">
              {amplitude !== null && amplitude !== 0
                ? `(${amplitude > 0 ? `+` : `-`}${toInternationalCurrencySystem_number(
                    Math.abs(amplitude),
                  )}%)`
                : ``}
            </span> */}
            {/* <span className="text-gray-400 text-xs ml-0.5">(-%)</span> */}
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
export default PositionRow;
