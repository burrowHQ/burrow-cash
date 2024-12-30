import Link from "next/link";
import { useEffect, useMemo, useState, createContext } from "react";
import { fetchAllPools, getStablePools, init_env } from "@ref-finance/ref-sdk";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { LayoutBox } from "../../components/LayoutContainer/LayoutContainer";
import { ComeBackIcon, ShrinkArrow, TokenArrow } from "./components/TradingIcon";
import { NearIcon } from "../MarginTrading/components/Icon";
import TradingTable from "./components/Table";
import TradingOperate from "./components/TradingOperate";
import { getAssets as getAssetsSelector, getAssetsMEME } from "../../redux/assetsSelectors";
import { shrinkToken } from "../../store";
import { getMarginConfig } from "../../redux/marginConfigSelectors";
import { formatWithCommas_usd, toInternationalCurrencySystem_number } from "../../utils/uiNumber";
import { useMarginConfigToken } from "../../hooks/useMarginConfig";
import { setCategoryAssets1, setCategoryAssets2 } from "../../redux/marginTrading";
import { useMarginAccount } from "../../hooks/useMarginAccount";
import { useAccountId } from "../../hooks/hooks";
import { useRouterQuery } from "../../utils/txhashContract";
import { handleTransactionResults, handleTransactionHash } from "../../services/transaction";
import DataSource from "../../data/datasource";
import TradingViewChart from "../../components/marginTrading/TradingViewChart";
import { standardizeAsset, nearTokenId } from "../../utils";
import { isMobileDevice } from "../../helpers/helpers";
import TradingOperateMobile from "./components/TradingOperateMobile";
import getAssets from "../../api/get-assets";
import { beautifyPrice } from "../../utils/beautyNumbet";
import { getSymbolById } from "../../transformers/nearSymbolTrans";

init_env("dev");

const Trading = () => {
  const isMobile = isMobileDevice();
  const marginConfig = useAppSelector(getMarginConfig);
  const { query } = useRouterQuery();
  const accountId = useAccountId();
  const { marginAccountList, parseTokenValue, getAssetDetails, getAssetById } = useMarginAccount();
  const { categoryAssets1, categoryAssets2, filterMarginConfigList } = useMarginConfigToken();
  const { ReduxcategoryAssets1, ReduxcategoryAssets2 } = useAppSelector((state) => state.category);
  const router = useRouter();
  const { id }: any = router.query;
  const dispatch = useAppDispatch();
  const assets = useAppSelector(getAssetsSelector);
  const assetsMEME = useAppSelector(getAssetsMEME);
  const combinedAssetsData = { ...assets.data, ...assetsMEME.data };
  const [showPopupCate1, setShowPopup1] = useState(false);
  const [showPopupCate2, setShowPopup2] = useState(false);

  //
  const [currentTokenCate1, setCurrentTokenCate1] = useState<any>({});
  const [currentTokenCate2, setCurrentTokenCate2] = useState<any>(categoryAssets2[0]);
  const [longAndShortPosition, setLongAndShortPosition] = useState<any>([]);

  const assetData: any = combinedAssetsData[id];
  const margin_position = assetData ? assetData?.margin_position : null;
  const metadata = assetData ? assetData?.metadata : {};
  const config = assetData ? assetData?.config : {};
  const margin_debt = assetData ? assetData?.margin_debt : {};
  const decimals = metadata?.decimals || 0;
  const extra_decimals = config?.extra_decimals || 0;

  let timer;

  useEffect(() => {
    if (id) {
      setCurrentTokenCate1(assets.data[id]);
      dispatch(setCategoryAssets1(assets.data[id]));
    }
  }, [id, currentTokenCate1]);

  useEffect(() => {
    if (id) {
      dispatch(setCategoryAssets2(currentTokenCate2 || categoryAssets2[0]));
    }
  }, [id, categoryAssets2[0]]);

  useMemo(() => {
    setLongAndShortPosition([
      toInternationalCurrencySystem_number(
        +shrinkToken(margin_position, decimals + extra_decimals) *
          (combinedAssetsData[id]?.price?.usd || 0),
      ),
      toInternationalCurrencySystem_number(
        +shrinkToken(margin_debt?.balance, decimals + extra_decimals) *
          (combinedAssetsData[id]?.price?.usd || 0),
      ),
    ]);
  }, [combinedAssetsData[id]?.price?.usd]);

  useMemo(() => {
    setCurrentTokenCate1(ReduxcategoryAssets1);
  }, [ReduxcategoryAssets1]);

  useMemo(() => {
    setCurrentTokenCate2(ReduxcategoryAssets2);
  }, [ReduxcategoryAssets2]);

  // mouseenter and leave inter
  const handlePopupToggle = () => {
    setShowPopup2(!showPopupCate2);
  };

  const handleTokenSelectCate2 = (item) => {
    // setSelectedItem(item);
    dispatch(setCategoryAssets2(item));
    setCurrentTokenCate2(item);
    setShowPopup2(false);
  };

  const handleMouseEnter = (category) => {
    clearTimeout(timer);

    if (category === "1") {
      setShowPopup1(true);
    } else if (category === "2") {
      setShowPopup2(true);
    }
  };

  const handleMouseLeave = (category) => {
    timer = setTimeout(() => {
      if (category === "1") {
        setShowPopup1(false);
      } else if (category === "2") {
        setShowPopup2(false);
      }
    }, 200);
  };

  useEffect(() => {
    if (query?.transactionHashes) {
      (async () => {
        const txHash = await handleTransactionHash(query?.transactionHashes);
        txHash
          .filter((item) => item.hasStorageDeposit || item.hasStorageDepositClosePosition)
          .forEach(async (item) => {
            try {
              await DataSource.shared.getMarginTradingPosition({
                addr: accountId,
                process_type: item.hasStorageDepositClosePosition ? "close" : "open",
                tx_hash: item.txHash,
              });
            } catch (error) {
              console.error("Failed to get margin trading position:", error);
            }
          });
      })();
    }
    handleTransactionResults(
      query?.transactionHashes,
      query?.errorMessage,
      Object.keys(filterMarginConfigList || []),
    );
  }, [query?.transactionHashes, query?.errorMessage]);

  const filterTitle = `${getSymbolById(
    currentTokenCate1?.token_id,
    currentTokenCate1?.metadata?.symbol,
  )}/${getSymbolById(currentTokenCate2?.token_id, currentTokenCate2?.metadata?.symbol)}`;

  const [volumeStats, setVolumeStats] = useState<any>({});
  useEffect(() => {
    const fetchVolumeStats = async () => {
      try {
        const response = await DataSource.shared.getMarginTradingVolumeStatistics();
        setVolumeStats({
          totalVolume: response.totalVolume || 0,
          volume24h: response.volume24h || 0,
        });
      } catch (error) {
        console.error("Failed to fetch volume statistics:", error);
      }
    };

    fetchVolumeStats(); // Initial fetch

    const intervalId = setInterval(fetchVolumeStats, 10000); // Fetch every 10 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const [open, setOpen] = useState(false);
  //
  return (
    <LayoutBox>
      {/* back */}
      <Link href="/marginTrading">
        <div className="flex items-center text-sm text-gray-300 cursor-pointer lg:mb-8 xsm:m-2 xsm:mb-9">
          <ComeBackIcon />
          <p className="ml-3.5"> Margin Trading Markets</p>
        </div>
      </Link>
      {/* main */}
      <div className="lg:grid lg:grid-cols-6 lg:mb-4 xsm:flex xsm:flex-col xsm:w-full xsm:box-border xsm:mb-4">
        {/* left charts */}
        <div className="lg:col-span-4 bg-gray-800 border border-dark-50 rounded-md lg:mr-4 xsm:mx-2 xsm:mb-4 xsm:min-h-[488px]">
          {/* for pc */}
          <div className="flex justify-between items-center border-b border-dark-50 py-6 lg:px-5 h-[100px] xsm:hidden">
            {/* cate1 */}
            <div onMouseLeave={() => handleMouseLeave("1")} className="cursor-pointer relative ">
              <div onMouseEnter={() => handleMouseEnter("1")} className="flex items-center">
                {currentTokenCate1?.token_id == nearTokenId ? (
                  <NearIcon />
                ) : (
                  <img
                    alt=""
                    src={currentTokenCate1?.metadata?.icon}
                    style={{ width: "26px", height: "26px" }}
                  />
                )}
                <p className="ml-2 mr-3.5 text-lg">
                  {getSymbolById(currentTokenCate1?.token_id, currentTokenCate1?.metadata?.symbol)}
                </p>
                {/* <TokenArrow /> */}
              </div>
            </div>
            {/* cate2 */}
            <div className="text-sm">
              <div className="flex justify-center items-center">
                <p className="text-gray-300 mr-1.5">Price</p>
                {/* drop down */}
                <div
                  className="relative hover:bg-gray-300 hover:bg-opacity-20 py-1 px-1.5 rounded-sm cursor-pointer min-w-24"
                  onMouseLeave={() => handleMouseLeave("2")}
                >
                  <div
                    onMouseEnter={() => handleMouseEnter("2")}
                    onClick={handlePopupToggle}
                    className="flex justify-center items-center"
                  >
                    <p className="mr-1">
                      {currentTokenCate2?.metadata?.symbol || categoryAssets2[0]?.metadata.symbol}
                    </p>
                    <TokenArrow />
                  </div>
                  {showPopupCate2 && (
                    <div
                      onMouseEnter={() => handleMouseEnter("2")}
                      onMouseLeave={() => handleMouseLeave("2")}
                      className="bg-dark-250 border border-dark-500 rounded-sm absolute z-10 top-8 left-0 right-0 pt-0.5 text-gray-300 text-xs pb-1.5"
                    >
                      {categoryAssets2.map((item, index) => (
                        <div
                          key={index}
                          className="py-1 pl-1.5 hover:bg-gray-950"
                          onClick={() => handleTokenSelectCate2(item)}
                        >
                          {getSymbolById(item.token_id, item.metadata?.symbol)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span>${combinedAssetsData[id]?.price?.usd || 0}</span>
            </div>
            {/* total v */}
            <div className="text-sm">
              <p className="text-gray-300  mb-1.5">Total Volume</p>
              <span>{formatWithCommas_usd(volumeStats.totalVolume)}</span>
            </div>
            {/* 24h v */}
            <div className="text-sm">
              <p className="text-gray-300 mb-1.5">24H Volume</p>
              <span>{formatWithCommas_usd(volumeStats.volume24h)}</span>
            </div>
            {/* long short */}
            <div className="text-sm">
              <p className="text-gray-300 mb-1.5">Long / Short Positions</p>
              <span>
                ${longAndShortPosition[0] || "-"} / ${longAndShortPosition[1] || "-"}
              </span>
            </div>
          </div>

          {/* for mobile */}
          <div className="flex flex-col border-b border-dark-50 p-6 lg:hidden">
            {/* cate1 */}
            <div className="cursor-pointer relative mb-[21px]">
              <div className="flex">
                <img
                  alt=""
                  src={currentTokenCate1?.metadata?.icon}
                  style={{ width: "24px", height: "24px" }}
                  className="rounded-full mr-2 mt-0.5"
                />
                <div className="flex flex-col">
                  <p className="text-base text-white">
                    {getSymbolById(
                      currentTokenCate1?.token_id,
                      currentTokenCate1?.metadata?.symbol,
                    )}
                  </p>
                  <p className="text-[#C0C4E9] text-xs">
                    ${combinedAssetsData[id]?.price?.usd || 0}
                  </p>
                </div>

                {/* cate2 */}
                <div className="text-xs">
                  <div className="flex justify-center items-center">
                    <div
                      className="relative bg-gray-300 bg-opacity-20 py-[1px] rounded-sm cursor-pointer min-w-20 ml-1 mt-0.5"
                      onMouseLeave={() => handleMouseLeave("2")}
                    >
                      <div
                        onMouseEnter={() => handleMouseEnter("2")}
                        onClick={handlePopupToggle}
                        className="flex justify-center items-center"
                      >
                        <p className="mr-1">
                          {currentTokenCate2?.metadata?.symbol ||
                            categoryAssets2[0]?.metadata.symbol}
                        </p>
                        <TokenArrow />
                      </div>
                      {showPopupCate2 && (
                        <div
                          onMouseEnter={() => handleMouseEnter("2")}
                          onMouseLeave={() => handleMouseLeave("2")}
                          className="bg-dark-250 border border-dark-500 rounded-sm absolute z-10 top-6 left-0 right-0 pt-0.5 text-gray-300 text-xs pb-1.5"
                        >
                          {categoryAssets2.map((item, index) => (
                            <div
                              key={index}
                              className="py-1 pl-1.5 hover:bg-gray-950"
                              onClick={() => handleTokenSelectCate2(item)}
                            >
                              {getSymbolById(item.token_id, item.metadata?.symbol)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* <TokenArrow /> */}
              </div>
            </div>

            {/* total v */}
            <div className="text-sm flex items-center justify-between">
              <p className="text-gray-300  mb-1.5">Total Volume</p>
              <span>{formatWithCommas_usd(volumeStats.totalVolume)}</span>
            </div>
            {/* 24h v */}
            <div className="text-sm flex items-center justify-between my-[16px]">
              <p className="text-gray-300 mb-1.5">24H Volume</p>
              <span>{formatWithCommas_usd(volumeStats.volume24h)}</span>
            </div>
            {/* long short */}
            <div className="text-sm flex items-center justify-between">
              <p className="text-gray-300 mb-1.5">Long / Short Positions</p>
              <span>
                ${longAndShortPosition[0] || "-"} / ${longAndShortPosition[1] || "-"}
              </span>
            </div>
          </div>

          <div style={{ height: isMobile ? "488px" : "calc(100% - 100px)" }}>
            <TradingViewChart
              baseSymbol={standardizeAsset(currentTokenCate1?.metadata)?.symbol}
              quoteSymbol={standardizeAsset(currentTokenCate2?.metadata)?.symbol}
            />
          </div>
        </div>
        {/* right tradingopts */}
        <div className="lg:col-span-2 bg-gray-800 border border-dark-50 rounded-md xsm:box-border xsm:mx-2 xsm:hidden">
          <TradingOperate />
        </div>
      </div>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 w-full h-[116px] rounded-t-[8px] px-[26px] flex flex-col justify-center items-center bg-[#383A56] z-[12]">
        <div
          className="w-full flex items-center justify-center h-[46px] bg-primary rounded-[6px] text-[#14162B] text-base font-bold"
          onClick={() => {
            setOpen(true);
          }}
        >
          Long/Short
        </div>
      </div>
      {accountId && <TradingTable positionsList={marginAccountList} filterTitle={filterTitle} />}
      <TradingOperateMobile open={open} onClose={() => setOpen(false)} />
    </LayoutBox>
  );
};

export default Trading;
