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
import { getAssets as getAssetsSelector } from "../../redux/assetsSelectors";
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
import { standardizeAsset } from "../../utils";
import { isMobileDevice } from "../../helpers/helpers";
import TradingOperateMobile from "./components/TradingOperateMobile";
import getAssets from "../../api/get-assets";
import { beautifyPrice } from "../../utils/beautyNumbet";

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
  const [showPopupCate1, setShowPopup1] = useState(false);
  const [showPopupCate2, setShowPopup2] = useState(false);

  //
  const [currentTokenCate1, setCurrentTokenCate1] = useState<any>({});
  const [currentTokenCate2, setCurrentTokenCate2] = useState<any>(categoryAssets2[0]);

  const [longAndShortPosition, setLongAndShortPosition] = useState<any>([]);

  let timer;

  useEffect(() => {
    if (id) {
      setCurrentTokenCate1(assets.data[id]);
      dispatch(setCategoryAssets1(assets.data[id]));
      dispatch(setCategoryAssets2(currentTokenCate2 || categoryAssets2[0]));

      const { margin_position, metadata, config, margin_debt } = assets.data[id] as any;
      const { decimals } = metadata;
      const { extra_decimals } = config;

      setLongAndShortPosition([
        toInternationalCurrencySystem_number(
          +shrinkToken(margin_position, decimals + extra_decimals) *
            (assets.data[id]?.price?.usd || 0),
        ),
        toInternationalCurrencySystem_number(
          +shrinkToken(margin_debt?.balance, decimals + extra_decimals) *
            (assets.data[id]?.price?.usd || 0),
        ),
      ]);
    }
  }, [id]);

  useEffect(() => {
    const fetchAssetsAndUpdate = async () => {
      try {
        const assetsData: any = await getAssets();
        if (id) {
          const updatedTokenCate1 = assetsData.assets.find((item: any) => item.token_id === id);
          const updatedTokenCate1WithMetadata = {
            ...updatedTokenCate1,
            metadata: currentTokenCate1.metadata,
          };
          setCurrentTokenCate1(updatedTokenCate1WithMetadata);
          dispatch(setCategoryAssets1(updatedTokenCate1WithMetadata));
          dispatch(setCategoryAssets2(currentTokenCate2 || categoryAssets2[0]));

          // deal long & short position
          if (updatedTokenCate1WithMetadata?.metadata) {
            const { margin_position, metadata, config, margin_debt } =
              updatedTokenCate1WithMetadata;
            const { decimals } = metadata;
            const { extra_decimals } = config;
            setLongAndShortPosition([
              toInternationalCurrencySystem_number(
                +shrinkToken(margin_position, decimals + extra_decimals) *
                  updatedTokenCate1.price.usd,
              ),
              toInternationalCurrencySystem_number(
                +shrinkToken(margin_debt?.balance, decimals + extra_decimals) *
                  updatedTokenCate1.price.usd,
              ),
            ]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch assets:", error);
      }
    };

    fetchAssetsAndUpdate(); // Initial fetch

    const intervalId = setInterval(fetchAssetsAndUpdate, 10000); // Fetch every 2 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [id, currentTokenCate1]);

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

  const handleTokenSelectCate1 = (item) => {
    dispatch(setCategoryAssets1(item));
    setCurrentTokenCate1(item);
    setShowPopup1(false);
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
          .filter((item) => !item.hasStorageDeposit)
          .forEach(async (item) => {
            try {
              await DataSource.shared.getMarginTradingPosition({
                addr: accountId,
                process_type: "open",
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

  const filterTitle = `${
    currentTokenCate1?.metadata?.symbol == "wNEAR" ? "NEAR" : currentTokenCate1?.metadata?.symbol
  }/${currentTokenCate2?.metadata?.symbol}`;

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

    const intervalId = setInterval(fetchVolumeStats, 1000); // Fetch every 10 seconds

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
                {currentTokenCate1?.metadata?.symbol === "wNEAR" ? (
                  <NearIcon />
                ) : (
                  <img
                    alt=""
                    src={currentTokenCate1?.metadata?.icon}
                    style={{ width: "26px", height: "26px" }}
                  />
                )}
                <p className="ml-2 mr-3.5 text-lg">
                  {currentTokenCate1?.metadata?.symbol === "wNEAR"
                    ? "NEAR"
                    : currentTokenCate1?.metadata?.symbol}
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
                          {item?.metadata?.symbol === "wNEAR" ? "NEAR" : item?.metadata?.symbol}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span>${currentTokenCate1?.price?.usd || 0}</span>
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
                    {currentTokenCate1?.metadata?.symbol === "wNEAR"
                      ? "NEAR"
                      : currentTokenCate1?.metadata?.symbol}
                  </p>
                  <p className="text-[#C0C4E9] text-xs">${currentTokenCate1?.price?.usd}</p>
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
                              {item?.metadata?.symbol === "wNEAR" ? "NEAR" : item?.metadata?.symbol}
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
