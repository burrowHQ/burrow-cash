import { useEffect, useState, useMemo, useRef, createContext, useContext } from "react";
import { useRouter } from "next/router";
import { useMarginAccount } from "../../hooks/useMarginAccount";
import { useMarginConfigToken } from "../../hooks/useMarginConfig";
import { StatsRegular } from "./stat";
import DataSource from "../../data/datasource";
import { useRegisterTokenType } from "../../hooks/useRegisterTokenType";
import { shrinkToken } from "../../store/helper";
import { useAppSelector } from "../../redux/hooks";
import { getAssets, getAssetsMEME } from "../../redux/assetsSelectors";
import { beautifyPrice } from "../../utils/beautyNumber";
import { MarginAssetsIcon } from "./icons";
import { isMobileDevice } from "../../helpers/helpers";

const DashboardMarginOverviewContext = createContext(null) as any;
export default function DashboardMarginOverview({
  styleType,
  wrapClassName,
}: {
  styleType?: "simple";
  wrapClassName?: string;
}) {
  const [showCollateralPopup, setShowCollateralPopup] = useState(false);
  const [totalLongSizeValue, setTotalLongSizeValue] = useState(0);
  const [totalShortSizeValue, setTotalShortSizeValue] = useState(0);
  const [totalCollateral, setTotalCollateral] = useState(0);
  const [totalPLN, setTotalPLN] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const {
    marginAccountList,
    marginAccountListMEME,
    parseTokenValue,
    getAssetDetails,
    getAssetById,
  } = useMarginAccount();
  const router = useRouter();
  const { getPositionType } = useMarginConfigToken();
  const { filteredTokenTypeMap } = useRegisterTokenType();
  const assets = useAppSelector(getAssets);
  const assetsMEME = useAppSelector(getAssetsMEME);
  const isMobile = isMobileDevice();
  const totalMarginAccountList = useMemo(() => {
    return { ...(marginAccountList || {}), ...(marginAccountListMEME || {}) };
  }, [marginAccountList, marginAccountListMEME]);
  useEffect(() => {
    calculateTotalSizeValues();
  }, [totalMarginAccountList]);
  async function calculateTotalSizeValues() {
    let longTotal = 0;
    let shortTotal = 0;
    let collateralTotal = 0;
    let pnlTotal = 0;
    await Promise.all(
      Object.entries(totalMarginAccountList).map(async ([itemKey, item]) => {
        const positionType = getPositionType(
          item.token_c_info.token_id,
          item.token_d_info.token_id,
        ).label;
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
        const pnl =
          entryPrice !== null && entryPrice !== 0
            ? positionType === "Long"
              ? (indexPrice - entryPrice) * size * priceP
              : (entryPrice - indexPrice) * size * priceD
            : 0;
        const safePnl = Number.isNaN(pnl) ? 0 : pnl;
        pnlTotal += safePnl;
      }),
    );
    setTotalLongSizeValue(longTotal);
    setTotalShortSizeValue(shortTotal);
    setTotalCollateral(collateralTotal);
    setTotalPLN(pnlTotal);
  }
  const handleMouseEnter = () => {
    if (isMobile) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setShowCollateralPopup(true);
  };
  const handleMouseLeave = () => {
    if (isMobile) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setShowCollateralPopup(false);
    }, 200);
  };
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    e.stopPropagation();
    e.preventDefault();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setShowCollateralPopup(!showCollateralPopup);
    }, 200);
  };
  const handleTouchEnd = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };
  const PNL_REACT_ELEMENT = (
    <span>
      {`${totalPLN === 0 ? "" : totalPLN > 0 ? "+" : "-"}`}
      {beautifyPrice(Math.abs(totalPLN), true)}
    </span>
  );
  const hasCollateral = totalCollateral > 0;
  const COLLATERAL_REACT_ELEMENT = (
    <div
      className={`relative w-fit ${
        hasCollateral ? "border-b border-dashed border-dark-800 cursor-pointer" : ""
      }`}
      onMouseEnter={hasCollateral ? handleMouseEnter : undefined}
      onMouseLeave={hasCollateral ? handleMouseLeave : undefined}
      onTouchStart={hasCollateral ? handleTouchStart : undefined}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="text-h2"
        onMouseEnter={hasCollateral ? handleMouseEnter : undefined}
        onTouchStart={hasCollateral ? handleTouchStart : undefined}
        onTouchEnd={handleTouchEnd}
      >
        {beautifyPrice(totalCollateral, true)}
      </div>
      {hasCollateral && showCollateralPopup && (
        <div
          className="absolute left-28 top-0 bg-dark-100 border border-gray-130 text-gray-30 pt-3 pl-3 pr-3 rounded-md w-max"
          onMouseEnter={hasCollateral ? handleMouseEnter : undefined}
          onMouseLeave={hasCollateral ? handleMouseLeave : undefined}
          onTouchStart={hasCollateral ? handleTouchStart : undefined}
          onTouchEnd={handleTouchEnd}
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

            return Object.entries(mergedCollateral).map(([tokenId, data]) => (
              <div key={tokenId} className="flex items-center justify-center mb-3">
                <img src={data.icon} alt="" className="w-4 h-4 rounded-3xl" />
                <p className="ml-2 mr-8 text-xs text-gray-300">{data.symbol}</p>
                <div className="text-xs ml-auto">{beautifyPrice(data.totalValue, true)}</div>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
  function jump() {
    router.push("/dashboardMarginDetail");
  }
  return (
    <DashboardMarginOverviewContext.Provider
      value={{
        wrapClassName,
        styleType,
        jump,
        totalLongSizeValue,
        totalShortSizeValue,
        COLLATERAL_REACT_ELEMENT,
        PNL_REACT_ELEMENT,
      }}
    >
      {isMobile ? <DashboardMarginOverviewMobile /> : <DashboardMarginOverviewPc />}
    </DashboardMarginOverviewContext.Provider>
  );
}

function DashboardMarginOverviewPc() {
  const {
    wrapClassName,
    styleType,
    jump,
    totalLongSizeValue,
    totalShortSizeValue,
    COLLATERAL_REACT_ELEMENT,
    PNL_REACT_ELEMENT,
  } = useContext(DashboardMarginOverviewContext) as any;
  return (
    <div className={wrapClassName || ""}>
      <div
        className={`flex items-center justify-between mt-[52px] ${
          styleType == "simple" ? "hidden" : ""
        }`}
      >
        <span className="text-lg text-gray-140">Margin Trading</span>
        <span className="text-sm text-primary underline cursor-pointer" onClick={jump}>
          Position Detail
        </span>
      </div>
      <div
        className={`relative grid grid-cols-4 bg-dark-110 rounded-xl border border-dark-50 px-[30px] py-6 mt-4 ${
          styleType == "simple" ? "" : "hover:border-primary"
        }`}
      >
        <StatsRegular title="Long Open Interest" value={beautifyPrice(totalLongSizeValue, true)} />
        <StatsRegular
          title="Short Open Interest"
          value={beautifyPrice(totalShortSizeValue, true)}
        />
        <StatsRegular title="Collateral" value={COLLATERAL_REACT_ELEMENT} />
        <StatsRegular title="PnL" value={PNL_REACT_ELEMENT} />
        <MarginAssetsIcon className="absolute bottom-0 right-0" />
      </div>
    </div>
  );
}
function DashboardMarginOverviewMobile() {
  const {
    jump,
    totalLongSizeValue,
    totalShortSizeValue,
    COLLATERAL_REACT_ELEMENT,
    PNL_REACT_ELEMENT,
    styleType,
  } = useContext(DashboardMarginOverviewContext) as any;
  return (
    <div className="px-4 w-full">
      <div className="text-white text-xl mb-4">Margin Trading</div>
      <div
        className="grid grid-cols-2 gap-5  border border-dark-50 bg-dark-110 rounded-xl p-3.5 mb-8"
        onClick={() => {
          if (styleType !== "simple") jump();
        }}
      >
        <StatsRegular title="Long Open Interest" value={beautifyPrice(totalLongSizeValue, true)} />
        <StatsRegular
          title="Short Open Interest"
          value={beautifyPrice(totalShortSizeValue, true)}
        />
        <StatsRegular title="Collateral" value={COLLATERAL_REACT_ELEMENT} />
        <StatsRegular title="PnL" value={PNL_REACT_ELEMENT} />
      </div>
    </div>
  );
}
