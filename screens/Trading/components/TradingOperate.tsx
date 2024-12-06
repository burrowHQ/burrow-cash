import React, { useMemo, useState, useEffect } from "react";
import _, { range } from "lodash";
import TradingToken from "./tokenbox";
import { RefLogoIcon, SetUp, ShrinkArrow, errorTipsIcon } from "./TradingIcon";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import RangeSlider from "./RangeSlider";
import ConfirmMobile from "./ConfirmMobile";
import { getAccountBalance, getAccountId } from "../../../redux/accountSelectors";
import { getAssets } from "../../../redux/assetsSelectors";
import { useMarginConfigToken } from "../../../hooks/useMarginConfig";
import { usePoolsData } from "../../../hooks/useGetPoolsData";
import { getMarginConfig } from "../../../redux/marginConfigSelectors";
import { toInternationalCurrencySystem_number, toDecimal } from "../../../utils/uiNumber";
import { useEstimateSwap } from "../../../hooks/useEstimateSwap";
import { NearIcon, NearIconMini } from "../../MarginTrading/components/Icon";
import { setSlippageToleranceFromRedux } from "../../../redux/marginTrading";
import { useMarginAccount } from "../../../hooks/useMarginAccount";
import { expandTokenDecimal, expandToken, shrinkToken } from "../../../store/helper";
import {
  YellowSolidSubmitButton as YellowSolidButton,
  RedSolidSubmitButton as RedSolidButton,
} from "../../../components/Modal/button";
import { beautifyPrice } from "../../../utils/beautyNumbet";

// main components
const TradingOperate = () => {
  const assets = useAppSelector(getAssets);
  const config = useAppSelector(getMarginConfig);
  const { categoryAssets1, categoryAssets2 } = useMarginConfigToken();
  const marginConfig = useAppSelector(getMarginConfig);
  const { marginAccountList, parseTokenValue, getAssetDetails, getAssetById } = useMarginAccount();
  const { marginConfigTokens, filterMarginConfigList } = useMarginConfigToken();
  const { max_active_user_margin_position } = marginConfigTokens;
  const {
    ReduxcategoryAssets1,
    ReduxcategoryAssets2,
    ReduxcategoryCurrentBalance1,
    ReduxcategoryCurrentBalance2,
    ReduxSlippageTolerance,
  } = useAppSelector((state) => state.category);

  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("long");

  // for slip
  // const [showSetUpPopup, setShowSetUpPopup] = useState(false);

  const [selectedSetUpOption, setSelectedSetUpOption] = useState("auto");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [rangeMount, setRangeMount] = useState(1);
  const [isDisabled, setIsDisabled] = useState(false);

  //
  const [longInput, setLongInput] = useState("");
  const [shortInput, setShortInput] = useState("");
  const [longOutput, setLongOutput] = useState(0);
  const [shortOutput, setShortOutput] = useState(0);

  // amount
  const [longInputUsd, setLongInputUsd] = useState(0);
  const [longOutputUsd, setLongOutputUsd] = useState(0);
  const [shortInputUsd, setShortInputUsd] = useState(0);
  const [shortOutputUsd, setShortOutputUsd] = useState(0);

  //
  const balance = useAppSelector(getAccountBalance);
  const accountId = useAppSelector(getAccountId);

  const getTokenSymbol = (assetId) => {
    if (!assetId?.token_id) return "";
    const asset = assets.data[assetId.token_id];
    return asset?.metadata.symbol === "wNEAR" ? "NEAR" : asset?.metadata.symbol || "";
  };
  const getTokenSymbolOnly = (assetId) => {
    return assetId === "wNEAR" ? "NEAR" : assetId || "";
  };
  // pools
  const { simplePools, stablePools, stablePoolsDetail } = usePoolsData();

  const setOwnBanlance = (key) => {
    if (activeTab === "long") {
      setLongInput(key);
    } else {
      setShortInput(key);
    }
  };

  // for tab change
  const initCateState = (tabString) => {
    setLiqPrice(0);
    setRangeMount(1);
    if (tabString == "long") {
      setShortInput("");
      setShortInputUsd(0);
      setShortOutput(0);
      setShortOutputUsd(0);
    } else {
      setLongInput("");
      setLongInputUsd(0);
      setLongOutput(0);
      setLongOutputUsd(0);
    }
  };
  // tab click event
  const handleTabClick = (tabString) => {
    setActiveTab(tabString);
    initCateState(tabString);
  };

  const getTabClassName = (tabName) => {
    return activeTab === tabName
      ? "bg-primary text-dark-200 py-2.5 pl-6 pr-8 rounded-md"
      : "text-gray-300 py-2.5 pl-8 pr-10";
  };

  // mouse leave and enter event for slip
  // let timer;
  // const handleMouseEnter = () => {
  //   clearTimeout(timer);
  //   setShowSetUpPopup(true);
  // };
  // const handleMouseLeave = () => {
  //   clearTimeout(timer);
  //   timer = setTimeout(() => {
  //     setShowSetUpPopup(false);
  //   }, 200);
  // };

  const cateSymbol = getTokenSymbolOnly(ReduxcategoryAssets1?.metadata?.symbol);
  // slippageTolerance change ecent
  useEffect(() => {
    dispatch(setSlippageToleranceFromRedux(0.5));
  }, []);
  const [slippageTolerance, setSlippageTolerance] = useState(0.5);
  const handleSetUpOptionClick = (option) => {
    setSelectedSetUpOption(option);
    if (option === "auto") {
      setSlippageTolerance(0.5);
      dispatch(setSlippageToleranceFromRedux(0.5));
    }
  };
  const slippageToleranceChange = (e) => {
    setSlippageTolerance(e);
    dispatch(setSlippageToleranceFromRedux(e));
  };

  // open position btn click eve.
  const handleConfirmButtonClick = () => {
    if (isDisabled) return;
    setIsConfirmModalOpen(true);
  };

  // condition btn iswhether disabled
  useEffect(() => {
    const setDisableBasedOnInputs = () => {
      const currentBalance2 = Number(ReduxcategoryCurrentBalance2) || 0;

      const inputValue = activeTab === "long" ? longInput : shortInput;
      const outputValue = activeTab === "long" ? longOutput : shortOutput;
      const isValidInput = isValidDecimalString(inputValue);

      setIsDisabled(
        !isValidInput ||
          !(Number(inputValue) <= currentBalance2) ||
          !outputValue ||
          rangeMount === 1,
      );
    };
    setDisableBasedOnInputs();
  }, [activeTab, ReduxcategoryCurrentBalance2, longInput, shortInput, longOutput, shortOutput]);

  const isValidDecimalString = (str) => {
    if (str <= 0) return false;
    // const regex = /^(?![0]+$)\d+(\.\d+)?$/;
    const regex = /^\d+(\.\d+)?$/;
    return regex.test(str);
  };
  // pools end

  // get cate1 amount start
  const [tokenInAmount, setTokenInAmount] = useState(0);
  const [LiqPrice, setLiqPrice] = useState(0);
  const [entryPrice, setEntryPrice] = useState(0);
  const estimateData = useEstimateSwap({
    tokenIn_id:
      activeTab === "long" ? ReduxcategoryAssets2?.token_id : ReduxcategoryAssets1?.token_id,
    tokenOut_id:
      activeTab === "long" ? ReduxcategoryAssets1?.token_id : ReduxcategoryAssets2?.token_id,
    tokenIn_amount: toDecimal(tokenInAmount),
    account_id: accountId,
    simplePools,
    stablePools,
    stablePoolsDetail,
    slippageTolerance: slippageTolerance / 100,
  });
  const [percentList, setPercentList] = useState([]);
  useMemo(() => {
    if (estimateData?.identicalRoutes) {
      const { identicalRoutes } = estimateData;
      let sum = 0;
      const perArray = identicalRoutes.map((routes) => {
        const k = routes.reduce((pre, cur) => {
          return pre + (Number(cur.pool?.partialAmountIn) || 0);
        }, 0);
        sum += k; //
        return k;
      });

      const perStrArray = perArray.map((item) => ((item * 100) / sum).toFixed(2)); //
      setPercentList(perStrArray);
    }
  }, [estimateData]);

  // long & short input change fn.
  const inputPriceChange = _.debounce((newValue) => {
    // eslint-disable-next-line no-unused-expressions
    activeTab === "long" ? setLongInput(newValue) : setShortInput(newValue);
  }, 50);
  let lastValue = "";
  const tokenChange = (value) => {
    if (value.includes(".") && !lastValue.includes(".")) {
      inputPriceChange.cancel(); //
      setTimeout(() => {
        inputPriceChange(value);
      }, 50);
    } else {
      inputPriceChange(value);
    }

    lastValue = value;
  };

  /**
   * longInput shortInput deal start
   *  */
  useEffect(() => {
    const inputUsdCharcate1 = getAssetPrice(ReduxcategoryAssets1);
    const inputUsdCharcate2 = getAssetPrice(ReduxcategoryAssets2);

    if (inputUsdCharcate1 && estimateData) {
      updateOutput(activeTab, inputUsdCharcate1);
    }

    if (inputUsdCharcate2) {
      updateInputAmounts(activeTab, inputUsdCharcate2, inputUsdCharcate1);
    }
  }, [longInput, shortInput, rangeMount, estimateData, slippageTolerance]);

  useEffect(() => {
    if (ReduxcategoryAssets2 && ReduxcategoryAssets1 && estimateData) {
      const assetC = getAssetById(ReduxcategoryAssets2?.token_id);
      const assetD =
        activeTab === "long"
          ? getAssetById(ReduxcategoryAssets2?.token_id)
          : getAssetById(ReduxcategoryAssets1?.token_id);
      const assetP =
        activeTab === "long"
          ? getAssetById(ReduxcategoryAssets1?.token_id)
          : getAssetById(ReduxcategoryAssets2?.token_id);

      const { price: priceD, decimals: decimalsD } = getAssetDetails(assetD);
      const { price: priceC, decimals: decimalsC } = getAssetDetails(assetC);
      const { price: priceP, decimals: decimalsP } = getAssetDetails(assetP);

      // console.log(
      //   longInput,
      //   "longInput",
      //   tokenInAmount / Number(shrinkToken(estimateData?.min_amount_out, decimalsP)),
      //   estimateData,
      //   decimalsC,
      //   decimalsD,
      //   decimalsP,
      //   assetC,
      //   assetD,
      //   assetP,
      // );

      // input validate
      // const isValidate =
      //   parseTokenValue(estimateData.min_amount_out, decimalsP) >
      //   tokenInAmount /
      //     ((assets.data[ReduxcategoryAssets1["token_id"]]?.price?.usd || 0) *
      //       (1 - marginConfigTokens.max_slippage_rate / 10000));

      // if (!isValidate) {
      //   setIsDisabled(false);
      // }
      let liqPriceX = 0;
      if (rangeMount > 1) {
        if (activeTab == "long") {
          const k1 = Number(longInput) * rangeMount * (getAssetPrice(ReduxcategoryAssets2) as any);
          const k2 = 1 - marginConfigTokens.min_safety_buffer / 10000;
          liqPriceX = (k1 / k2 - Number(longInput)) / longOutput;
        } else {
          liqPriceX =
            (((Number(shortInput) +
              Number(shrinkToken(estimateData?.min_amount_out, decimalsC))) as any) *
              (getAssetPrice(ReduxcategoryAssets2) as any) *
              (1 - marginConfigTokens.min_safety_buffer / 10000)) /
            shortOutput;
        }
      }
      console.log(Number(shrinkToken(estimateData?.min_amount_out, decimalsC)));
      // const total_debt =
      //   (shrinkToken(ReduxcategoryAssets2.margin_debt.balance, decimalsD) as any) * priceD;
      // const total_hp_fee =
      //   (ReduxcategoryAssets2.margin_debt.debt_cap * (unit_acc_hp_interest - uahpi_at_open)) /
      //   10 ** 18;

      // const numerator =
      //   total_debt +
      //   total_hp_fee -
      //   (shrinkToken(ReduxcategoryAssets1.margin_debt.balance, decimalsD) as any) *
      //     priceC *
      //     (1 - marginConfigTokens.min_safety_buffer / 10000);

      // const denominator =
      //   estimateData?.min_amount_out * (1 - marginConfigTokens.min_safety_buffer / 10000);

      console.log(marginConfigTokens, ReduxcategoryAssets2, ReduxcategoryAssets1);

      setLiqPrice(liqPriceX);
    }
  }, [longOutput, shortOutput]);

  const Fee = useMemo(() => {
    return {
      fee:
        (Number(longInput || shortInput) * config.open_position_fee_rate) / 10000 +
        (estimateData?.fee ?? 0) / 10000,
      price: getAssetPrice(ReduxcategoryAssets1),
    };
  }, [longInput, shortInput, ReduxcategoryAssets1, estimateData]);

  function getAssetPrice(categoryId) {
    return categoryId ? assets.data[categoryId["token_id"]].price?.usd : 0;
  }

  function updateOutput(tab, inputUsdCharcate) {
    /**
     * @param inputUsdCharcate  category1 current price
     */
    const input = tab === "long" ? longInput : shortInput;
    const inputUsd = tab === "long" ? longInputUsd : shortInputUsd;
    // set output
    const outputSetter = tab === "long" ? setLongOutput : setShortOutput;
    // set output usd
    const outputUsdSetter = tab === "long" ? setLongOutputUsd : setShortOutputUsd;
    //
    if (input === undefined || inputUsd === 0 || !input) {
      outputSetter(0);
      outputUsdSetter(0);
      setLiqPrice(0);
    } else if (tab === "long") {
      outputSetter(estimateData?.amount_out || 0);
      outputUsdSetter(inputUsdCharcate * (estimateData.amount_out || 0));
    } else if (tab === "short") {
      outputSetter(tokenInAmount as any);
      outputUsdSetter(inputUsdCharcate * tokenInAmount);
    }
  }

  function updateInputAmounts(tab, inputUsdCharcate2, inputUsdCharcate1) {
    /**
     * @param inputUsdCharcate2  category2 current price
     */
    const input = tab === "long" ? longInput : shortInput;
    const inputAmount = input ? Number(input) : 0;
    const openFeeAmount = (inputAmount * config.open_position_fee_rate) / 10000;
    const adjustedInputAmount = (inputAmount - openFeeAmount) * inputUsdCharcate2 * rangeMount;

    const inputUsdSetter = tab === "long" ? setLongInputUsd : setShortInputUsd;

    // set input usd
    inputUsdSetter(inputUsdCharcate2 * inputAmount);

    if (tab === "long") {
      setTokenInAmount(adjustedInputAmount / inputUsdCharcate2);
    } else {
      setTokenInAmount(adjustedInputAmount / inputUsdCharcate1);
    }
  }

  // end

  function formatNumber(value, len) {
    let formattedValue = value.toFixed(len); //
    if (formattedValue.endsWith(".00")) {
      //
      formattedValue = formattedValue.substring(0, formattedValue.length - 3);
    } else if (formattedValue.endsWith("0")) {
      // 0
      formattedValue = formattedValue.substring(0, formattedValue.length - 1);
    }
    return formattedValue;
  }

  const formatDecimal = (value: number) => {
    if (!value) return "0";
    // 移除末尾的0和不必要的小数点
    return value.toFixed(6).replace(/\.?0+$/, "");
  };

  return (
    <div className="w-full pt-4 px-4 pb-9">
      <div className="flex justify-between items-center">
        <div className="flex bg-dark-200 px-0.5 py-0.5 rounded-md cursor-pointer mr-3">
          <div className={getTabClassName("long")} onClick={() => handleTabClick("long")}>
            Long {cateSymbol}
          </div>
          <div
            className={
              activeTab === "short"
                ? "bg-red-50 text-dark-200 py-2.5 pl-6 pr-8 rounded-md"
                : getTabClassName("short")
            }
            onClick={() => handleTabClick("short")}
          >
            Short {cateSymbol}
          </div>
        </div>
        {/* slip start */}
        <div className="relative z-40 cursor-pointer slip-fater">
          <SetUp />

          <div className="slip-child absolute top-8 right-0 bg-dark-250 border border-dark-500 rounded-md py-6 px-4">
            <p className="text-base mb-6">Max. Slippage Setting</p>
            <div className="flex items-center justify-between h-10">
              <div className="bg-dark-200 p-1 rounded-md flex items-center mr-3.5">
                <div
                  className={`py-2 px-5 ${
                    selectedSetUpOption === "auto" ? "bg-gray-400 rounded " : ""
                  }`}
                  onClick={() => handleSetUpOptionClick("auto")}
                >
                  Auto
                </div>
                <div
                  className={`py-2 px-5 ${
                    selectedSetUpOption === "custom" ? "bg-gray-400 rounded " : ""
                  }`}
                  onClick={() => handleSetUpOptionClick("custom")}
                >
                  Custom
                </div>
              </div>
              <div className="bg-dark-600 rounded-md py-2.5 px-4 flex items-center justify-between">
                <input
                  disabled={selectedSetUpOption === "auto"}
                  type="number"
                  onChange={(e) => slippageToleranceChange(e.target.value)}
                  value={slippageTolerance}
                  style={{ width: "32px" }}
                  className={selectedSetUpOption === "auto" ? "text-gray-700" : "text-white"}
                />
                <div className={selectedSetUpOption === "auto" ? "text-gray-700" : "text-white"}>
                  %
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* slip end */}
      </div>
      <div className="mt-5">
        {activeTab === "long" && (
          <>
            <div className="relative bg-dark-600 border border-dark-500 pt-3 pb-2.5 pr-3 pl-2.5 rounded-md z-30">
              <input
                onChange={(e) => tokenChange(e.target.value)}
                type="number"
                value={longInput}
                placeholder="0"
              />
              <div className="absolute top-2 right-2">
                <TradingToken
                  setOwnBanlance={setOwnBanlance}
                  tokenList={categoryAssets2}
                  type="cate2"
                />
              </div>
              <p className="text-gray-300 mt-2 text-xs">${longInputUsd.toFixed(2)}</p>
            </div>
            <div className="relative my-2.5 flex justify-end z-0 w-1/2" style={{ zoom: "2" }}>
              <ShrinkArrow />
            </div>
            <div className="relative bg-dark-600 border border-dark-500 pt-3 pb-2.5 pr-3 pl-2.5 rounded-md z-20">
              {/* long out  */}
              <input
                disabled
                type="text"
                value={longOutput && formatNumber(Number(longOutput), 6)}
                placeholder="0"
              />
              {/*  */}
              <div className="absolute top-2 right-2">
                <TradingToken tokenList={categoryAssets1} type="cate1" />
              </div>
              <p className="text-gray-300 mt-2 text-xs">
                ${longOutputUsd && formatNumber(Number(longOutputUsd), 2)}
              </p>
            </div>
            <RangeSlider defaultValue={rangeMount} action="Long" setRangeMount={setRangeMount} />
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="text-gray-300">Position Size</div>
                <div className="text-right">
                  {toInternationalCurrencySystem_number(longOutput)} {cateSymbol}
                  <span className="text-xs text-gray-300 ml-1.5">
                    (${toInternationalCurrencySystem_number(longOutputUsd)})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm mb-4">
                <div className="text-gray-300">Minimum received</div>
                <div className="text-right">
                  {beautifyPrice(Number(longOutput) * (1 - slippageTolerance / 100))} {cateSymbol}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="text-gray-300">Liq. Price</div>
                <div>${toInternationalCurrencySystem_number(LiqPrice)}</div>
              </div>
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="text-gray-300">Fee</div>
                <div className="flex items-center justify-center">
                  <p className="border-b border-dashed border-dark-800">{formatDecimal(Fee.fee)}</p>
                  {cateSymbol}
                  <span className="text-xs text-gray-300 ml-1.5">
                    (${formatDecimal(Fee.fee * (Fee.price || 0))})
                  </span>
                </div>
              </div>
              <div className="flex items-baseline justify-between text-sm mb-4">
                <div className="text-gray-300 flex items-center">
                  <RefLogoIcon />
                  <span className="ml-2">Route</span>
                </div>
                <div className="flex flex-col justify-end">
                  {!isDisabled &&
                    estimateData?.tokensPerRoute.map((item, index) => {
                      return (
                        <div key={index} className="flex mb-2 items-center">
                          {item.map((ite, ind) => {
                            return (
                              <>
                                {ind === 0 && (
                                  <>
                                    <div className="bg-opacity-10  text-xs py-0.5 pl-2.5 pr-1.5 rounded  bg-primary text-primary">{`${percentList[index]}%`}</div>
                                    <span className="mx-2">|</span>
                                  </>
                                )}
                                <div key={ind} className="flex items-center">
                                  <span>{ite.symbol === "wNEAR" ? "NEAR" : ite.symbol}</span>
                                  {ind + 1 < estimateData?.tokensPerRoute[index].length ? (
                                    <span className="mx-2">&gt;</span>
                                  ) : (
                                    ""
                                  )}
                                </div>
                              </>
                            );
                          })}
                        </div>
                      );
                    })}
                </div>
              </div>
              <div className=" text-red-150 text-xs font-normal">{estimateData?.swapError}</div>
              {/* <div
                className={`flex items-center justify-between  text-dark-200 text-base rounded-md h-12 text-center  ${
                  isDisabled ? "bg-slate-700 cursor-default" : "bg-primary cursor-pointer"
                }`}
                onClick={handleConfirmButtonClick}
              >
                <div className="flex-grow">Long NEAR {rangeMount}x</div>
              </div> */}
              <YellowSolidButton
                className="w-full"
                disabled={isDisabled}
                onClick={handleConfirmButtonClick}
              >
                Long {cateSymbol} {rangeMount}x
              </YellowSolidButton>
              {isConfirmModalOpen && (
                <ConfirmMobile
                  open={isConfirmModalOpen}
                  onClose={() => setIsConfirmModalOpen(false)}
                  action="Long"
                  confirmInfo={{
                    longInput,
                    longInputUsd,
                    longOutput,
                    longOutputUsd,
                    rangeMount,
                    estimateData,
                    indexPrice: assets.data[ReduxcategoryAssets1["token_id"]].price?.usd,
                    longInputName: ReduxcategoryAssets2,
                    longOutputName: ReduxcategoryAssets1,
                    assets,
                    tokenInAmount,
                    LiqPrice,
                  }}
                />
              )}
            </div>
          </>
        )}
        {activeTab === "short" && (
          <>
            <div className="relative bg-dark-600 border border-dark-500 pt-3 pb-2.5 pr-3 pl-2.5 rounded-md z-30">
              <input
                onChange={(e) => tokenChange(e.target.value)}
                type="number"
                value={shortInput}
                placeholder="0"
              />
              <div className="absolute top-2 right-2">
                <TradingToken
                  setOwnBanlance={setOwnBanlance}
                  tokenList={categoryAssets2}
                  type="cate2"
                />
              </div>
              <p className="text-gray-300 mt-2 text-xs">${shortInputUsd.toFixed(2)}</p>
            </div>
            <div className="relative my-2.5 flex justify-end z-0 w-1/2" style={{ zoom: "2" }}>
              <ShrinkArrow />
            </div>
            <div className="relative bg-dark-600 border border-dark-500 pt-3 pb-2.5 pr-3 pl-2.5 rounded-md z-20">
              {/* short out */}
              <input
                disabled
                type="text"
                value={shortOutput && formatNumber(Number(shortOutput), 6)}
                placeholder="0"
              />
              {/*  */}
              <div className="absolute top-2 right-2">
                <TradingToken tokenList={categoryAssets1} type="cate1" />
              </div>
              <p className="text-gray-300 mt-2 text-xs">
                ${shortOutputUsd && formatNumber(Number(shortOutputUsd), 2)}
              </p>
            </div>
            <RangeSlider defaultValue={rangeMount} action="Short" setRangeMount={setRangeMount} />
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="text-gray-300">Position Size</div>
                <div>
                  {toInternationalCurrencySystem_number(shortOutput)} {cateSymbol}
                  <span className="text-xs text-gray-300 ml-1.5">
                    (${toInternationalCurrencySystem_number(shortOutputUsd)})
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="text-gray-300">Minimum received</div>
                <div className="text-right">
                  {beautifyPrice(
                    Number(toInternationalCurrencySystem_number(shortOutput)) *
                      (1 - slippageTolerance / 100),
                  )}{" "}
                  {cateSymbol}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="text-gray-300">Liq. Price</div>
                <div>${toInternationalCurrencySystem_number(LiqPrice)}</div>
              </div>
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="text-gray-300">Fee</div>
                <div className="flex items-center justify-center">
                  <p className="border-b border-dashed border-dark-800">{formatDecimal(Fee.fee)}</p>
                  {cateSymbol}
                  <span className="text-xs text-gray-300 ml-1.5">
                    (${formatDecimal(Fee.fee * (Fee.price || 0))})
                  </span>
                </div>
              </div>
              <div className="flex items-baseline justify-between text-sm mb-4">
                <div className="text-gray-300 flex items-center">
                  <RefLogoIcon />
                  <span className="ml-2">Route</span>
                </div>
                <div className="flex flex-col justify-end">
                  {!isDisabled &&
                    estimateData?.tokensPerRoute.map((item, index) => {
                      return (
                        <div key={index} className="flex mb-2 items-center">
                          {item.map((ite, ind) => {
                            return (
                              <>
                                {ind === 0 && (
                                  <>
                                    <div className="bg-opacity-10  text-xs py-0.5 pl-2.5 pr-1.5 rounded  bg-red-50 text-red-50">{`${percentList[index]}%`}</div>
                                    <span className="mx-2">|</span>
                                  </>
                                )}
                                <div key={ind} className="flex items-center">
                                  <span>{ite.symbol === "wNEAR" ? "NEAR" : ite.symbol}</span>
                                  {ind + 1 < estimateData?.tokensPerRoute[index].length ? (
                                    <span className="mx-2">&gt;</span>
                                  ) : (
                                    ""
                                  )}
                                </div>
                              </>
                            );
                          })}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* <div
                className={`flex items-center justify-between  text-dark-200 text-base rounded-md h-12 text-center  ${
                  isDisabled ? "bg-slate-700 cursor-default" : "bg-red-50 cursor-pointer"
                }`}
                onClick={handleConfirmButtonClick}
              >
                <div className="flex-grow">Short NEAR {rangeMount}x</div>
              </div> */}
              <RedSolidButton
                className="w-full"
                disabled={isDisabled}
                onClick={handleConfirmButtonClick}
              >
                Short {cateSymbol} {rangeMount}x
              </RedSolidButton>
              {isConfirmModalOpen && (
                <ConfirmMobile
                  open={isConfirmModalOpen}
                  onClose={() => setIsConfirmModalOpen(false)}
                  action="Short"
                  confirmInfo={{
                    longInput: shortInput,
                    longInputUsd: shortInputUsd,
                    longOutput: shortOutput,
                    longOutputUsd: shortOutputUsd,
                    rangeMount,
                    estimateData,
                    indexPrice: assets.data[ReduxcategoryAssets1["token_id"]].price?.usd,
                    longInputName: ReduxcategoryAssets2,
                    longOutputName: ReduxcategoryAssets1,
                    assets,
                    tokenInAmount,
                    LiqPrice,
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TradingOperate;
