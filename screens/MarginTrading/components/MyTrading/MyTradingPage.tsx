import React, { useEffect, useState } from "react";
import TradingTable from "../../../Trading/components/Table";
import { useMarginAccount } from "../../../../hooks/useMarginAccount";
import { useMarginConfigToken } from "../../../../hooks/useMarginConfig";
import { toInternationalCurrencySystem_number } from "../../../../utils/uiNumber";
import { isMobileDevice } from "../../../../helpers/helpers";
import { getAssets } from "../../../../store/assets";
import DataSource from "../../../../data/datasource";

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
  const { getPositionType } = useMarginConfigToken();
  const [totalLongSizeValue, setTotalLongSizeValue] = useState(0);
  const [totalShortSizeValue, setTotalShortSizeValue] = useState(0);
  const [totalCollateral, setTotalCollateral] = useState(0);
  const [totalPLN, setTotalPLN] = useState(0);
  const calculateTotalSizeValues = () => {
    let longTotal = 0;
    let shortTotal = 0;
    let collateralTotal = 0;
    let pnlTotal = 0;
    Object.values(marginAccountList).forEach(async (item) => {
      const positionType = getPositionType(item.token_d_info.token_id).label;
      const assetD = getAssetById(item.token_d_info.token_id);
      const assetC = getAssetById(item.token_c_info.token_id);
      const assetP = getAssetById(item.token_p_id);
      const { price: priceD, symbol: symbolD, decimals: decimalsD } = getAssetDetails(assetD);
      const { price: priceC, symbol: symbolC, decimals: decimalsC } = getAssetDetails(assetC);
      const { price: priceP, symbol: symbolP, decimals: decimalsP } = getAssetDetails(assetP);
      const sizeValueLong = parseTokenValue(item.token_p_amount, decimalsP);
      const sizeValueShort = parseTokenValue(item.token_d_info.balance, decimalsD);
      const sizeValue =
        positionType === "Long" ? sizeValueLong * (priceP || 0) : sizeValueShort * (priceD || 0);
      if (positionType === "Long") {
        longTotal += sizeValue;
      } else {
        shortTotal += sizeValue;
      }
      const netValue = parseTokenValue(item.token_c_info.balance, decimalsC) * (priceC || 0);
      collateralTotal += netValue;
      const fetchedAssets = await getAssets();
      const debt_assets_d = fetchedAssets.find(
        (asset) => asset.token_id === item.token_d_info.token_id,
      );
      const entryPriceResponse = await DataSource.shared.getMarginTradingRecordEntryPrice(
        item.token_d_info.token_id,
      );
      const entryPrice = entryPriceResponse.data;
      const indexPrice = positionType === "Long" ? priceP : priceD;
      const debtCap = parseFloat(item.debt_cap);
      const unitAccHpInterest = parseFloat(debt_assets_d?.unit_acc_hp_interest ?? "0");
      const uahpiAtOpen = parseFloat(item.uahpi_at_open);
      const interestDifference = unitAccHpInterest - uahpiAtOpen;
      const totalHpFee = (debtCap * interestDifference) / 10 ** 18;
      const profitOrLoss = entryPrice !== null ? (indexPrice - entryPrice) * sizeValue : 0;
      const openTime = new Date(Number(item.open_ts) / 1e6);
      const currentTime = new Date();
      const holdingDurationInHours =
        Math.abs(currentTime.getTime() - openTime.getTime()) / (1000 * 60 * 60);
      const holdingFee = totalHpFee * holdingDurationInHours;
      const pnl = profitOrLoss === 0 ? 0 : profitOrLoss - holdingFee;
      pnlTotal += pnl;
    });
    setTotalLongSizeValue(longTotal);
    setTotalShortSizeValue(shortTotal);
    setTotalCollateral(collateralTotal);
    setTotalPLN(pnlTotal);
  };
  useEffect(() => {
    calculateTotalSizeValues();
  }, [marginAccountList]);
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
              <h2 className="text-h2"> {formatCurrency(totalLongSizeValue)}</h2>
            </div>
            <div className="flex-1">
              <p className="text-gray-300 text-sm">Short Open Interest</p>
              <h2 className="text-h2">{formatCurrency(totalShortSizeValue)}</h2>
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
                  {formatCurrency(totalCollateral)}
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
                        marginAccountList,
                      ).reduce<CollateralAccumulator>((acc, item) => {
                        const assetC = getAssetById(item.token_c_info.token_id);
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
                            ${toInternationalCurrencySystem_number(data.totalValue)}
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
              <h2 className="text-h2">{formatCurrency(totalPLN)}</h2>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center w-full h-[100px] border border-dark-50 bg-gray-800 rounded-md mb-7 xsm:hidden">
          <div className="flex flex-1 justify-center">
            <div>
              <p className="text-gray-300 text-sm">Long Open Interest</p>
              <h2 className="text-h2"> {formatCurrency(totalLongSizeValue)}</h2>
            </div>
          </div>
          <div className="flex flex-1 justify-center">
            <div>
              <p className="text-gray-300 text-sm">Short Open Interest</p>
              <h2 className="text-h2">{formatCurrency(totalShortSizeValue)}</h2>
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
                  {formatCurrency(totalCollateral)}
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
                        marginAccountList,
                      ).reduce<CollateralAccumulator>((acc, item) => {
                        const assetC = getAssetById(item.token_c_info.token_id);
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
                            ${toInternationalCurrencySystem_number(data.totalValue)}
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
              <h2 className="text-h2">{formatCurrency(totalPLN)}</h2>
            </div>
          </div>
        </div>
      )}
      <TradingTable positionsList={marginAccountList} />
    </div>
  );
};

export default MyMarginTradingPage;
