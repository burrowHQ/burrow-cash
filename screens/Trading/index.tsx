import Link from "next/link";
import { useEffect, useMemo, useState, createContext } from "react";
import { fetchAllPools, getStablePools, init_env } from "@ref-finance/ref-sdk";
import { useRouter } from "next/router";
import TradingViewWidget, { Themes } from "react-tradingview-widget";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { LayoutBox } from "../../components/LayoutContainer/LayoutContainer";
import { ComeBackIcon, ShrinkArrow, TokenArrow } from "./components/TradingIcon";
import { NearIcon } from "../MarginTrading/components/Icon";
import TradingTable from "./components/Table";
import TradingOperate from "./components/TradingOperate";
import { useEstimateSwap } from "../../hooks/useEstimateSwap";
import { openPosition } from "../../store/marginActions/openPosition";
import { closePosition } from "../../store/marginActions/closePosition";
import { increaseCollateral } from "../../store/marginActions/increaseCollateral";
import { decreaseCollateral } from "../../store/marginActions/decreaseCollateral";
import { getAssets } from "../../redux/assetsSelectors";
import { shrinkToken } from "../../store";
import { getMarginConfig } from "../../redux/marginConfigSelectors";
import { formatWithCommas_usd, toInternationalCurrencySystem_number } from "../../utils/uiNumber";
import { useMarginConfigToken } from "../../hooks/useMarginConfig";
import { setCategoryAssets1, setCategoryAssets2 } from "../../redux/marginTrading";
import { useMarginAccount } from "../../hooks/useMarginAccount";
import { useAccountId, usePortfolioAssets } from "../../hooks/hooks";
import { useRouterQuery, getTransactionResult, parsedArgs } from "../../utils/txhashContract";
import {
  showPositionResult,
  showPositionFailure,
  showPositionClose,
} from "../../components/HashResultModal";
import { handleTransactionResults } from "../../services/transaction";

init_env("dev");

const Trading = () => {
  const marginConfig = useAppSelector(getMarginConfig);
  const { query } = useRouterQuery();
  const accountId = useAccountId();
  const { marginAccountList, parseTokenValue, getAssetDetails, getAssetById } = useMarginAccount();
  const { categoryAssets1, categoryAssets2 } = useMarginConfigToken();
  const { ReduxcategoryAssets1, ReduxcategoryAssets2 } = useAppSelector((state) => state.category);
  const router = useRouter();
  const { id }: any = router.query;
  const dispatch = useAppDispatch();
  const assets = useAppSelector(getAssets);
  const [showPopupCate1, setShowPopup1] = useState(false);
  const [showPopupCate2, setShowPopup2] = useState(false);
  const [currentPair, setCurrentPair] = useState("");

  //
  const [currentTokenCate1, setCurrentTokenCate1] = useState<any>({});
  const [currentTokenCate2, setCurrentTokenCate2] = useState<any>(categoryAssets2[0]);

  const [longAndShortPosition, setLongAndShortPosition] = useState<any>([]);

  const [showModal, setShowModal] = useState(false);

  const handleClose = () => {
    setShowModal(false);
  };
  let timer;

  // computed currentTokenCate1 dropdown
  useEffect(() => {
    if (id) {
      setCurrentTokenCate1(assets.data[id]);
      dispatch(setCategoryAssets1(assets.data[id]));
      dispatch(setCategoryAssets2(currentTokenCate2 || categoryAssets2[0]));
    }

    // deal long & short position
    if (id && currentTokenCate1?.metadata) {
      //
      const { margin_position, metadata, config, margin_debt } = currentTokenCate1;
      const { decimals } = metadata;
      const { extra_decimals } = config;

      setLongAndShortPosition([
        toInternationalCurrencySystem_number(
          shrinkToken(margin_position, decimals + extra_decimals),
        ),
        toInternationalCurrencySystem_number(
          shrinkToken(margin_debt?.balance, decimals + extra_decimals),
        ),
      ]);
    }
  }, [id, currentTokenCate1]);

  useMemo(() => {
    setCurrentTokenCate1(ReduxcategoryAssets1);
  }, [ReduxcategoryAssets1]);

  useMemo(() => {
    setCurrentTokenCate2(ReduxcategoryAssets2);
  }, [ReduxcategoryAssets2]);

  // async function getPoolsData() {
  //   const { ratedPools, unRatedPools, simplePools: simplePoolsFromSdk } = await fetchAllPools();
  //   const stablePoolsFromSdk = unRatedPools.concat(ratedPools);
  //   const stablePoolsDetailFromSdk = await getStablePools(stablePools);
  //   setSimplePools(simplePoolsFromSdk);
  //   setStablePools(stablePoolsFromSdk);
  //   setStablePoolsDetail(stablePoolsDetailFromSdk);
  // }

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
    handleTransactionResults(query?.transactionHashes, query?.errorMessage);
  }, [query?.transactionHashes, query?.errorMessage]);

  //
  return (
    <LayoutBox>
      {/* back */}
      <Link href="/marginTrading">
        <div className="flex items-center text-sm text-gray-300 cursor-pointer mb-8">
          <ComeBackIcon />
          <p className="ml-3.5"> Margin Trading Markets</p>
        </div>
      </Link>
      {/* main */}
      <div className="grid grid-cols-6 mb-4">
        {/* left charts */}
        <div className="col-span-4 bg-gray-800 border border-dark-50 rounded-md mr-4">
          <div className="flex justify-between items-center border-b border-dark-50 py-6 px-5">
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
              {/* {showPopupCate1 && (
                <div
                  onMouseEnter={() => handleMouseEnter("1")}
                  onMouseLeave={() => handleMouseLeave("1")}
                  className=" bg-dark-250 border border-dark-500 rounded-sm absolute top-8 left-0 right-0 pt-0.5 text-gray-300 text-xs pb-1.5"
                >
                  {categoryAssets1.map((item, index) => (
                    <div
                      key={index}
                      className="py-1 pl-1.5 hover:bg-gray-950"
                      onClick={() => handleTokenSelectCate1(item)}
                    >
                      <div className="flex items-center">
                        {item?.metadata?.symbol === "wNEAR" ? (
                          <NearIcon />
                        ) : (
                          <img
                            alt=""
                            src={item?.metadata?.icon}
                            style={{ width: "26px", height: "26px" }}
                          />
                        )}
                        <p className="ml-2 mr-3.5 text-sm">
                          {item?.metadata?.symbol === "wNEAR" ? "NEAR" : item?.metadata?.symbol}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )} */}
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
                      className="bg-dark-250 border border-dark-500 rounded-sm absolute top-8 left-0 right-0 pt-0.5 text-gray-300 text-xs pb-1.5"
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
              <span>${currentTokenCate1?.price?.usd}</span>
            </div>
            {/* total v */}
            <div className="text-sm">
              <p className="text-gray-300  mb-1.5">Total Volume</p>
              <span>$23.25M</span>
            </div>
            {/* 24h v */}
            <div className="text-sm">
              <p className="text-gray-300 mb-1.5">24H Volume</p>
              <span>$13.25K</span>
            </div>
            {/* long short */}
            <div className="text-sm">
              <p className="text-gray-300 mb-1.5">Long / Short Positions</p>
              <span>
                ${longAndShortPosition[0]} / ${longAndShortPosition[1]}
              </span>
            </div>
          </div>
          <div style={{ height: "520px" }}>
            {/* <TradingViewWidget symbol="NASDAQ:AAPL" theme={Themes.DARK} locale="en" autosize /> */}
          </div>
        </div>
        {/* right tradingopts */}
        <div className="col-span-2 bg-gray-800 border border-dark-50 rounded-md">
          <TradingOperate />
        </div>
      </div>
      {accountId && <TradingTable positionsList={marginAccountList} />}
    </LayoutBox>
  );
};

export default Trading;
