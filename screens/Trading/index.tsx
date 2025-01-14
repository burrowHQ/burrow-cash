import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { LayoutBox } from "../../components/LayoutContainer/LayoutContainer";
import { ComeBackIcon, MemeTagIcon, TokenArrow } from "./components/TradingIcon";
import { NearIcon } from "../MarginTrading/components/Icon";
import TradingTable from "./components/Table";
import TradingOperate from "./components/TradingOperate";
import { getAssets as getAssetsSelector, getAssetsMEME } from "../../redux/assetsSelectors";
import { shrinkToken } from "../../store";
import { toInternationalCurrencySystem_number } from "../../utils/uiNumber";
import { useMarginConfigToken } from "../../hooks/useMarginConfig";
import {
  setCategoryAssets1,
  setCategoryAssets2,
  setReduxRangeMount,
} from "../../redux/marginTrading";
import { useMarginAccount } from "../../hooks/useMarginAccount";
import { useAccountId } from "../../hooks/hooks";
import { useRouterQuery } from "../../utils/txhashContract";
import { handleTransactionResults, handleTransactionHash } from "../../services/transaction";
import DataSource from "../../data/datasource";
import TradingViewChart from "../../components/marginTrading/TradingViewChart";
import { standardizeAsset, nearTokenId } from "../../utils";
import { isMobileDevice } from "../../helpers/helpers";
import TradingOperateMobile from "./components/TradingOperateMobile";
import { beautifyPrice } from "../../utils/beautyNumber";
import { getSymbolById } from "../../transformers/nearSymbolTrans";
import { useRegisterTokenType } from "../../hooks/useRegisterTokenType";

const Trading = () => {
  const isMobile = isMobileDevice();
  const { query } = useRouterQuery();
  const accountId = useAccountId();
  const { marginAccountList, marginAccountListMEME } = useMarginAccount();
  const {
    categoryAssets2,
    categoryAssets2MEME,
    filterMarginConfigList,
    categoryAssets1,
    categoryAssets1MEME,
  } = useMarginConfigToken();
  const { ReduxcategoryAssets1, ReduxcategoryAssets2, ReduxActiveTab } = useAppSelector(
    (state) => state.category,
  );
  const router = useRouter();
  const { id }: any = router.query;
  const { filteredTokenTypeMap } = useRegisterTokenType();
  const isMainStream = filteredTokenTypeMap.mainStream.includes(id);
  const dispatch = useAppDispatch();
  const assets = useAppSelector(getAssetsSelector);
  const assetsMEME = useAppSelector(getAssetsMEME);
  const isLoading = Object.keys(assetsMEME.data).length === 0 && !isMainStream;
  const [showPopupCate1, setShowPopup1] = useState(false);
  const [showPopupCate2, setShowPopup2] = useState(false);
  const [currentTokenCate1, setCurrentTokenCate1] = useState<any>({});
  const [currentTokenCate2, setCurrentTokenCate2] = useState<any>();
  const [longAndShortPosition, setLongAndShortPosition] = useState<any>([]);
  const combinedAssetsData = isMainStream ? assets.data : assetsMEME.data;
  const categoryAssets2Current = isMainStream ? categoryAssets2 : categoryAssets2MEME;
  const assetData: any = combinedAssetsData[id];
  const margin_position = assetData ? assetData?.margin_position : null;
  const metadata = assetData ? assetData?.metadata : {};
  const config = assetData ? assetData?.config : {};
  const margin_debt = assetData ? assetData?.margin_debt : {};
  const decimals = metadata?.decimals || 0;
  const extra_decimals = config?.extra_decimals || 0;

  let timer;

  useEffect(() => {
    if (id || !isLoading) {
      setCurrentTokenCate1(combinedAssetsData[id]);
      dispatch(setCategoryAssets1(combinedAssetsData[id]));
    }
  }, [id, currentTokenCate1, isLoading]);

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

  // get selected category 2
  useEffect(() => {
    if (id) {
      if (
        !ReduxcategoryAssets2 ||
        (ReduxcategoryAssets2 && !isIncludes(categoryAssets2Current, ReduxcategoryAssets2))
      ) {
        dispatch(setCategoryAssets2(categoryAssets2Current[0]));
        setCurrentTokenCate2(categoryAssets2Current[0]);
      } else {
        setCurrentTokenCate2(ReduxcategoryAssets2);
      }
    }
  }, [id, ReduxcategoryAssets2, categoryAssets2Current]);

  function isIncludes(assets: any[], asset: any) {
    const target = assets.find((a) => a.token_id == asset.token_id);
    return !!target;
  }
  // mouseenter and leave inter
  const handlePopupToggle = () => {
    setShowPopup2(!showPopupCate2);
  };
  const handleTokenSelectCate2 = (item) => {
    dispatch(setCategoryAssets2(item));
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
    // TODOXX
    if (query?.transactionHashes) {
      (async () => {
        const txHash = await handleTransactionHash(query?.transactionHashes);
        txHash
          .filter((item) => item.hasStorageDeposit || item.hasStorageDepositClosePosition)
          .forEach(async (item) => {
            try {
              await DataSource.shared.postMarginTradingPosition({
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
    if (!id) return;

    const fetchVolumeStats = async () => {
      try {
        const response = await DataSource.shared.getMarginTradingTokenVolumeStatistics(id);
        setVolumeStats({
          totalVolume: response.data.total_volume || 0,
          volume24h: response.data["24h_volume"] || 0,
          long: response.data.long_open_volume || 0,
          short: response.data.short_open_volume || 0,
        });
      } catch (error) {
        console.error("Failed to fetch volume statistics:", error);
      }
    };

    fetchVolumeStats(); // Initial fetch

    const intervalId = setInterval(fetchVolumeStats, 10000); // Fetch every 10 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [id]);

  const [open, setOpen] = useState(false);
  //
  return (
    <LayoutBox>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-screen">
          <img src="/loading-brrr.gif" alt="" width="75px" />
          <span className="flex items-center text-sm text-gray-300 mt-2">Loading Meme data...</span>
        </div>
      ) : (
        <>
          {/* back */}
          <div onClick={() => router.push("/marginTrading")}>
            <div className="flex items-center text-sm text-gray-300 cursor-pointer lg:mb-8 xsm:m-2 xsm:mb-9">
              <ComeBackIcon />
              <p className="ml-3.5"> Margin Trading Markets</p>
            </div>
          </div>
          {/* main */}
          <div className="lg:grid lg:grid-cols-6 lg:mb-4 xsm:flex xsm:flex-col xsm:w-full xsm:box-border xsm:mb-4">
            {/* left charts */}
            <div className="lg:col-span-4 bg-gray-800 border border-dark-50 rounded-md lg:mr-4 xsm:mx-2 xsm:mb-4 xsm:min-h-[488px]">
              {/* for pc */}
              <div className="flex justify-between items-center border-b border-dark-50 py-6 lg:px-5 h-[100px] xsm:hidden">
                {/* cate1 */}
                <div
                  onMouseLeave={() => handleMouseLeave("1")}
                  className="cursor-pointer relative "
                >
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
                      {getSymbolById(
                        currentTokenCate1?.token_id,
                        currentTokenCate1?.metadata?.symbol,
                      )}
                    </p>
                    {/* <TokenArrow /> */}
                    {!isMainStream && <MemeTagIcon />}
                  </div>
                </div>
                {/* cate2 */}
                <div className="text-sm">
                  <div className="flex justify-center items-center">
                    <p className="text-gray-300 mr-5">Price</p>
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
                          {currentTokenCate2?.metadata?.symbol ||
                            (isMainStream
                              ? categoryAssets2[0]?.metadata.symbol
                              : categoryAssets2MEME[0]?.metadata.symbol)}
                        </p>
                        <TokenArrow />
                      </div>
                      {showPopupCate2 && (
                        <div
                          onMouseEnter={() => handleMouseEnter("2")}
                          onMouseLeave={() => handleMouseLeave("2")}
                          className="bg-dark-250 border border-dark-500 rounded-sm absolute z-10 top-8 left-0 right-0 pt-0.5 text-gray-300 text-xs pb-1.5"
                        >
                          {(isMainStream ? categoryAssets2 : categoryAssets2MEME).map(
                            (item, index) => (
                              <div
                                key={index}
                                className="py-1 pl-1.5 hover:bg-gray-950"
                                onClick={() => handleTokenSelectCate2(item)}
                              >
                                {getSymbolById(item.token_id, item.metadata?.symbol)}
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <span>${beautifyPrice(combinedAssetsData[id]?.price?.usd || 0)}</span>
                </div>
                {/* total v */}
                <div className="text-sm">
                  <p className="text-gray-300  mb-1.5">Total Volume</p>
                  <span>${beautifyPrice(+volumeStats.totalVolume)}</span>
                </div>
                {/* 24h v */}
                <div className="text-sm">
                  <p className="text-gray-300 mb-1.5">24H Volume</p>
                  <span>${beautifyPrice(+volumeStats.volume24h)}</span>
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
                    <div className="flex flex-col items-center">
                      <img
                        alt=""
                        src={currentTokenCate1?.metadata?.icon}
                        style={{ width: "24px", height: "24px" }}
                        className="rounded-full mr-2 mt-0.5"
                      />
                      {!isMainStream && <MemeTagIcon className="mr-1.5 mt-0.5" />}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-base text-white">
                        {getSymbolById(
                          currentTokenCate1?.token_id,
                          currentTokenCate1?.metadata?.symbol,
                        )}
                      </p>
                      <p className="text-[#C0C4E9] text-xs">
                        ${beautifyPrice(combinedAssetsData[id]?.price?.usd || 0)}
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
                                (isMainStream
                                  ? categoryAssets2[0]?.metadata.symbol
                                  : categoryAssets2MEME[0]?.metadata.symbol)}
                            </p>
                            <TokenArrow />
                          </div>
                          {showPopupCate2 && (
                            <div
                              onMouseEnter={() => handleMouseEnter("2")}
                              onMouseLeave={() => handleMouseLeave("2")}
                              className="bg-dark-250 border border-dark-500 rounded-sm absolute z-10 top-6 left-0 right-0 pt-0.5 text-gray-300 text-xs pb-1.5"
                            >
                              {(isMainStream ? categoryAssets2 : categoryAssets2MEME).map(
                                (item, index) => (
                                  <div
                                    key={index}
                                    className="py-1 pl-1.5 hover:bg-gray-950"
                                    onClick={() => handleTokenSelectCate2(item)}
                                  >
                                    {getSymbolById(item.token_id, item.metadata?.symbol)}
                                  </div>
                                ),
                              )}
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
                  <span>${beautifyPrice(+volumeStats.totalVolume)}</span>
                </div>
                {/* 24h v */}
                <div className="text-sm flex items-center justify-between my-[16px]">
                  <p className="text-gray-300 mb-1.5">24H Volume</p>
                  <span>${beautifyPrice(+volumeStats.volume24h)}</span>
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
                  isMeme={!isMainStream}
                />
              </div>
            </div>
            {/* right tradingopts */}
            <div className="lg:col-span-2 bg-gray-800 border border-dark-50 rounded-md xsm:box-border xsm:mx-2 xsm:hidden">
              {id && <TradingOperate id={id} />}
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
          {accountId && (
            <TradingTable
              positionsList={isMainStream ? marginAccountList : marginAccountListMEME}
              filterTitle={filterTitle}
              filterTokenMap={{
                token_2: ReduxcategoryAssets2?.token_id,
                token_1: ReduxcategoryAssets1?.token_id,
              }}
            />
          )}
          {id && <TradingOperateMobile open={open} onClose={() => setOpen(false)} id={id} />}
        </>
      )}
    </LayoutBox>
  );
};

export default Trading;
