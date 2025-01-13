import React, { useEffect, useMemo, useState } from "react";
import TradingTable from "../../../Trading/components/Table";
import { useMarginAccount } from "../../../../hooks/useMarginAccount";
import { useMarginConfigToken } from "../../../../hooks/useMarginConfig";
import { toInternationalCurrencySystem_number } from "../../../../utils/uiNumber";
import { isMobileDevice } from "../../../../helpers/helpers";
import DataSource from "../../../../data/datasource";
import { shrinkToken } from "../../../../store/helper";
import { useAppSelector } from "../../../../redux/hooks";
import { getAssets, getAssetsMEME } from "../../../../redux/assetsSelectors";
import { useRegisterTokenType } from "../../../../hooks/useRegisterTokenType";
import { beautifyPrice } from "../../../../utils/beautyNumber";

const MyMarginTradingPage = () => {
  const isMobile = isMobileDevice();
  const [showCollateralPopup, setShowCollateralPopup] = useState(false);
  const {
    marginAccountList,
    marginAccountListMEME,
    parseTokenValue,
    getAssetDetails,
    getAssetById,
  } = useMarginAccount();
  const { filteredTokenTypeMap } = useRegisterTokenType();
  const assets = useAppSelector(getAssets);
  const assetsMEME = useAppSelector(getAssetsMEME);
  const { getPositionType } = useMarginConfigToken();
  const [totalLongSizeValue, setTotalLongSizeValue] = useState(0);
  const [totalShortSizeValue, setTotalShortSizeValue] = useState(0);
  const [totalCollateral, setTotalCollateral] = useState(0);
  const [totalPLN, setTotalPLN] = useState(0);
  const totalMarginAccountList = useMemo(() => {
    return { ...(marginAccountList || {}), ...(marginAccountListMEME || {}) };
  }, [marginAccountList, marginAccountListMEME]);
  const calculateTotalSizeValues = async () => {
    let longTotal = 0;
    let shortTotal = 0;
    let collateralTotal = 0;
    let pnlTotal = 0;
    const pnlArray: number[] = [];
    await Promise.all(
      Object.entries(totalMarginAccountList).map(async ([itemKey, item]) => {
        const positionType = getPositionType(item.token_d_info.token_id).label;
        const assetD = getAssetById(item.token_d_info.token_id, item);
        const assetC = getAssetById(item.token_c_info.token_id, item);
        const assetP = getAssetById(item.token_p_id, item);
        const { price: priceD, symbol: symbolD, decimals: decimalsD } = getAssetDetails(assetD);
        const { price: priceC, symbol: symbolC, decimals: decimalsC } = getAssetDetails(assetC);
        const { price: priceP, symbol: symbolP, decimals: decimalsP } = getAssetDetails(assetP);
        const sizeValueLong = parseTokenValue(item.token_p_amount, decimalsP);
        const sizeValueShort = parseTokenValue(item.token_d_info.balance, decimalsD);
        const size = positionType === "Long" ? sizeValueLong : sizeValueShort;
        const sizeValue =
          positionType === "Long" ? sizeValueLong * (priceP || 0) : sizeValueShort * (priceD || 0);
        if (positionType === "Long") {
          longTotal += sizeValue;
        } else {
          shortTotal += sizeValue;
        }
        const netValue = parseTokenValue(item.token_c_info.balance, decimalsC) * (priceC || 0);
        collateralTotal += netValue;
        const entryPriceResponse = await DataSource.shared.getMarginTradingRecordEntryPrice(
          itemKey,
        );
        const isMainStream = filteredTokenTypeMap.mainStream.includes(
          positionType === "Long"
            ? item.token_p_id.toString()
            : item.token_d_info.token_id.toString(),
        );
        const entryPrice =
          entryPriceResponse && entryPriceResponse.data && entryPriceResponse.data.length > 0
            ? entryPriceResponse.data[0].entry_price
            : null;
        const indexPrice = positionType === "Long" ? priceP : priceD;
        const uahpi: any = isMainStream
          ? shrinkToken((assets as any).data[item.token_d_info.token_id]?.uahpi, 18)
          : shrinkToken((assetsMEME as any).data[item.token_d_info.token_id]?.uahpi, 18);
        const uahpi_at_open: any = isMainStream
          ? shrinkToken(marginAccountList[itemKey]?.uahpi_at_open ?? 0, 18)
          : shrinkToken(marginAccountListMEME[itemKey]?.uahpi_at_open ?? 0, 18);
        const holdingFee =
          +shrinkToken(item.debt_cap, decimalsD) * priceD * (uahpi - uahpi_at_open);
        const holding = +shrinkToken(item.debt_cap, decimalsD) * (uahpi - uahpi_at_open);
        const profitOrLoss =
          entryPrice !== null && entryPrice !== 0
            ? positionType === "Long"
              ? (indexPrice - entryPrice) * size
              : (entryPrice - indexPrice) * size
            : 0;
        const pnl = entryPrice !== null && entryPrice !== 0 ? profitOrLoss - holdingFee : 0;
        pnlTotal += pnl;
      }),
    );
    setTotalLongSizeValue(longTotal);
    setTotalShortSizeValue(shortTotal);
    setTotalCollateral(collateralTotal);
    setTotalPLN(pnlTotal);
  };
  useEffect(() => {
    calculateTotalSizeValues();
  }, [totalMarginAccountList]);
  let timer;
  const handleMouseEnter = () => {
    clearTimeout(timer);
    setShowCollateralPopup(true);
  };
  const handleMouseLeave = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      setShowCollateralPopup(false);
    }, 200);
  };
  function formatCurrency(value) {
    return value === 0 ? (
      <span className="text-gray-400">$0.00</span>
    ) : (
      `$${toInternationalCurrencySystem_number(value)}`
    );
  }
  const hasCollateral = totalCollateral > 0;
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {isMobile ? (
        <div className="w-full border-b border-dark-950 px-4">
          <div className="flex justify-between mb-[30px]">
            <div className="flex-1">
              <p className="text-gray-300 text-sm">Long Open Interest</p>
              <h2 className="text-h2"> {beautifyPrice(totalLongSizeValue, true)}</h2>
            </div>
            <div className="flex-1">
              <p className="text-gray-300 text-sm">Short Open Interest</p>
              <h2 className="text-h2">{beautifyPrice(totalShortSizeValue, true)}</h2>
            </div>
          </div>
          <div className="flex justify-between mb-[30px]">
            <div className="flex-1">
              <p className="text-gray-300 text-sm">Collateral</p>
              <div
                className={`relative w-fit ${
                  hasCollateral ? "border-b border-dashed border-dark-800 cursor-pointer" : ""
                }`}
                onMouseEnter={hasCollateral ? handleMouseEnter : undefined}
                onMouseLeave={hasCollateral ? handleMouseLeave : undefined}
              >
                <div className="text-h2" onMouseEnter={handleMouseEnter}>
                  {beautifyPrice(totalCollateral, true)}
                </div>
                {hasCollateral && showCollateralPopup && (
                  <div
                    className="absolute left-28 top-0 bg-dark-100 border border-dark-300 text-gray-30 pt-3 pl-3 pr-3 rounded-md rounded-md w-max"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    {(() => {
                      interface MergedCollateralData {
                        icon: string;
                        symbol: string;
                        totalValue: number;
                      }
                      type CollateralAccumulator = {
                        [tokenId: string]: MergedCollateralData;
                      };

                      const mergedCollateral = Object.values(
                        totalMarginAccountList,
                      ).reduce<CollateralAccumulator>((acc, item) => {
                        const assetC = getAssetById(item.token_c_info.token_id, item);
                        const { decimals: decimalsC, price: priceC } = getAssetDetails(assetC);
                        const tokenId = item.token_c_info.token_id;

                        const netValue =
                          parseTokenValue(item.token_c_info.balance, decimalsC) * (priceC || 0);

                        if (!acc[tokenId]) {
                          const { icon: iconC, symbol: symbolC } = getAssetDetails(assetC);
                          acc[tokenId] = {
                            icon: iconC,
                            symbol: symbolC,
                            totalValue: netValue,
                          };
                        } else {
                          acc[tokenId].totalValue += netValue;
                        }

                        return acc;
                      }, {});

                      return Object.entries(mergedCollateral).map(([tokenId, data], index) => (
                        <div key={tokenId} className="flex items-center justify-center mb-3">
                          <img src={data.icon} alt="" className="w-4 h-4" />
                          <p className="ml-2 mr-8 text-xs text-gray-300">{data.symbol}</p>
                          <div className="text-xs ml-auto">
                            {beautifyPrice(data.totalValue, true)}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-gray-300 text-sm">PLN</p>
              <h2 className="text-h2">
                {totalPLN === 0 ? "" : `${totalPLN > 0 ? `+` : `-`}`}
                {beautifyPrice(Math.abs(totalPLN), true)}
              </h2>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center w-full h-[100px] border border-dark-50 bg-gray-800 rounded-md mb-7 xsm:hidden">
          <div className="flex flex-1 justify-center">
            <div>
              <p className="text-gray-300 text-sm">Long Open Interest</p>
              <h2 className="text-h2"> {beautifyPrice(totalLongSizeValue, true)}</h2>
            </div>
          </div>
          <div className="flex flex-1 justify-center">
            <div>
              <p className="text-gray-300 text-sm">Short Open Interest</p>
              <h2 className="text-h2">{beautifyPrice(totalShortSizeValue, true)}</h2>
            </div>
          </div>
          <div className="flex flex-1 justify-center">
            <div>
              <p className="text-gray-300 text-sm">Collateral</p>
              <div
                className={`relative ${
                  hasCollateral ? "border-b border-dashed border-dark-800 cursor-pointer" : ""
                }`}
                onMouseEnter={hasCollateral ? handleMouseEnter : undefined}
                onMouseLeave={hasCollateral ? handleMouseLeave : undefined}
              >
                <div className="text-h2 " onMouseEnter={handleMouseEnter}>
                  {beautifyPrice(totalCollateral, true)}
                </div>
                {hasCollateral && showCollateralPopup && (
                  <div
                    className="absolute left-28 top-0 bg-dark-100 border border-dark-300 text-gray-30 pt-3 pl-3 pr-3 rounded-md rounded-md w-max"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    {(() => {
                      interface MergedCollateralData {
                        icon: string;
                        symbol: string;
                        totalValue: number;
                      }
                      type CollateralAccumulator = {
                        [tokenId: string]: MergedCollateralData;
                      };

                      const mergedCollateral = Object.values(
                        totalMarginAccountList,
                      ).reduce<CollateralAccumulator>((acc, item) => {
                        const assetC = getAssetById(item.token_c_info.token_id, item);
                        const { decimals: decimalsC, price: priceC } = getAssetDetails(assetC);
                        const tokenId = item.token_c_info.token_id;

                        const netValue =
                          parseTokenValue(item.token_c_info.balance, decimalsC) * (priceC || 0);

                        if (!acc[tokenId]) {
                          const { icon: iconC, symbol: symbolC } = getAssetDetails(assetC);
                          acc[tokenId] = {
                            icon: iconC,
                            symbol: symbolC,
                            totalValue: netValue,
                          };
                        } else {
                          acc[tokenId].totalValue += netValue;
                        }

                        return acc;
                      }, {});

                      return Object.entries(mergedCollateral).map(([tokenId, data], index) => (
                        <div key={tokenId} className="flex items-center justify-center mb-3">
                          <img src={data.icon} alt="" className="w-4 h-4" />
                          <p className="ml-2 mr-8 text-xs text-gray-300">{data.symbol}</p>
                          <div className="text-xs ml-auto">
                            {beautifyPrice(data.totalValue, true)}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-1 justify-center">
            <div>
              <p className="text-gray-300 text-sm">PNL</p>
              <h2 className="text-h2">
                {totalPLN === 0 ? "" : `${totalPLN > 0 ? `+` : `-`}`}
                {beautifyPrice(Math.abs(totalPLN), true)}
              </h2>
            </div>
          </div>
        </div>
      )}
      <TradingTable positionsList={totalMarginAccountList} />
    </div>
  );
};

export default MyMarginTradingPage;
