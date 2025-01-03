import React, { useMemo, useState, useEffect, useRef } from "react";
import _ from "lodash";
import { BeatLoader } from "react-spinners";
import TradingToken from "./tokenbox";
import { SetUp, ShrinkArrow, MaxPositionIcon, RefreshIcon } from "./TradingIcon";
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
import { setSlippageToleranceFromRedux, setReduxActiveTab } from "../../../redux/marginTrading";
import { useMarginAccount } from "../../../hooks/useMarginAccount";
import { shrinkToken } from "../../../store/helper";
import {
  YellowSolidSubmitButton as YellowSolidButton,
  RedSolidSubmitButton as RedSolidButton,
} from "../../../components/Modal/button";
import { beautifyPrice } from "../../../utils/beautyNumbet";
import { ConnectWalletButton } from "../../../components/Header/WalletButton";
import { getSymbolById } from "../../../transformers/nearSymbolTrans";

interface TradingOperateProps {
  onMobileClose?: () => void;
}

// main components
const TradingOperate: React.FC<TradingOperateProps> = ({ onMobileClose }) => {
  //
  const customInputRef = useRef<HTMLInputElement>(null);
  const assets = useAppSelector(getAssets);
  const config = useAppSelector(getMarginConfig);
  const { categoryAssets1, categoryAssets2, marginConfigTokens } = useMarginConfigToken();
  const { marginAccountList, getAssetById } = useMarginAccount();
  const { max_active_user_margin_position } = marginConfigTokens;
  const {
    ReduxcategoryAssets1,
    ReduxcategoryAssets2,
    ReduxcategoryCurrentBalance1,
    ReduxcategoryCurrentBalance2,
    ReduxSlippageTolerance,
    ReduxRangeMount,
    ReduxActiveTab,
  } = useAppSelector((state) => state.category);

  //
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5);
  const [showFeeModal, setShowFeeModal] = useState<boolean>(false);
  const [forceUpdateLoading, setForceUpdateLoading] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<string>(ReduxActiveTab || "long");
  const [estimateLoading, setEstimateLoading] = useState<boolean>(false);

  //
  const [selectedSetUpOption, setSelectedSetUpOption] = useState<string>("custom");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [rangeMount, setRangeMount] = useState<number>(ReduxRangeMount || 1);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [isMaxPosition, setIsMaxPosition] = useState<boolean>(false);

  //
  const [longInput, setLongInput] = useState<string>("");
  const [shortInput, setShortInput] = useState<string>("");
  const [longOutput, setLongOutput] = useState<number>(0);
  const [shortOutput, setShortOutput] = useState<number>(0);

  // amount
  const [longInputUsd, setLongInputUsd] = useState<number>(0);
  const [longOutputUsd, setLongOutputUsd] = useState<number>(0);
  const [shortInputUsd, setShortInputUsd] = useState<number>(0);
  const [shortOutputUsd, setShortOutputUsd] = useState<number>(0);

  //
  const accountId = useAppSelector(getAccountId);

  // pools
  const { simplePools, stablePools, stablePoolsDetail } = usePoolsData();

  const setOwnBanlance = (key: string) => {
    if (activeTab === "long") {
      setLongInput(key);
    } else {
      setShortInput(key);
    }
  };

  // for tab change
  const initCateState = (tabString: string) => {
    setLiqPrice(0);
    // setRangeMount(1);
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
  const handleTabClick = (tabString: string) => {
    dispatch(setReduxActiveTab(tabString));
    setActiveTab(tabString);
    initCateState(tabString);
    setForceUpdate((prev) => prev + 1);
  };

  const getTabClassName = (tabName: string) => {
    return activeTab === tabName
      ? "bg-primary text-dark-200 py-2.5 px-5 rounded-md"
      : "text-gray-300 py-2.5 px-5";
  };

  const cateSymbol = getSymbolById(
    ReduxcategoryAssets1?.token_id,
    ReduxcategoryAssets1?.metadata?.symbol,
  );

  // slippageTolerance change ecent
  useEffect(() => {
    dispatch(setSlippageToleranceFromRedux(0.5));
  }, []);

  const handleSetUpOptionClick = (option: string) => {
    setSelectedSetUpOption(option);
    if (option === "auto") {
      setSlippageTolerance(0.5);
      dispatch(setSlippageToleranceFromRedux(0.5));
    }
  };
  // for mobile focus
  const handleSetUpFocus = () => {
    if (selectedSetUpOption === "custom" && customInputRef.current) {
      customInputRef.current.focus();
    }
  };

  const slippageToleranceChange = (e: any) => {
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
          rangeMount == 1,
      );
    };
    setDisableBasedOnInputs();
  }, [activeTab, ReduxcategoryCurrentBalance2, longInput, shortInput, longOutput, shortOutput]);

  useEffect(() => {
    if (Object.values(marginAccountList).length >= max_active_user_margin_position) {
      setIsMaxPosition(true);
    } else {
      setIsMaxPosition(false);
    }
  }, [marginAccountList, max_active_user_margin_position]);

  const isValidDecimalString = (str) => {
    if (str <= 0) return false;
    // const regex = /^(?![0]+$)\d+(\.\d+)?$/;
    const regex = /^\d+(\.\d+)?$/;
    return regex.test(str);
  };
  // pools end

  // get cate1 amount start
  const [tokenInAmount, setTokenInAmount] = useState<number>(0);
  const [LiqPrice, setLiqPrice] = useState<number>(0);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [forceUpdate, setForceUpdate] = useState<number>(0);
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
    forceUpdate,
  });

  // long & short input change fn.
  const inputPriceChange = _.debounce((newValue: string) => {
    // eslint-disable-next-line no-unused-expressions
    activeTab === "long" ? setLongInput(newValue) : setShortInput(newValue);
  }, 10);
  let lastValue = "";

  // validate input
  const isValidInput = (value: string): boolean => {
    if (value === "") return true;
    const regex = /^\d*\.?\d*$/;
    if (!regex.test(value)) return false;
    const num = parseFloat(value);
    if (Number.isNaN(num)) return false;
    return true;
  };

  // handle input change
  const tokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    console.log(value, tokenInAmount, "for nico");
    if (value === "") {
      setLongInput("");
      setShortInput("");
      setLongOutput(0);
      setShortOutput(0);
      setLongInputUsd(0);
      setShortInputUsd(0);
      setLongOutputUsd(0);
      setShortOutputUsd(0);
      setTokenInAmount(0);
      setLiqPrice(0);
      return;
    }
    setEstimateLoading(true);
    if (!isValidInput(value)) return;
    if (value.includes(".") && !lastValue.includes(".")) {
      inputPriceChange.cancel();
      setTimeout(() => {
        inputPriceChange(value);
      }, 10);
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
  }, [
    longInput,
    shortInput,
    rangeMount,
    estimateData,
    slippageTolerance,
    forceUpdate,
    tokenInAmount,
    activeTab, // Add activeTab to dependencies if needed
    ReduxcategoryAssets1,
  ]);

  // update token in amount
  // useEffect(() => {
  //   const inputUsdCharcate1 = getAssetPrice(ReduxcategoryAssets1);
  //   if (inputUsdCharcate1 && estimateData) {
  //     updateOutput(activeTab, inputUsdCharcate1);
  //   }
  // }, [tokenInAmount, activeTab, estimateData, ReduxcategoryAssets1]);

  // update liq price for short
  useEffect(() => {
    if (ReduxcategoryAssets2 && ReduxcategoryAssets1 && estimateData) {
      const assetC = getAssetById(ReduxcategoryAssets2?.token_id);
      let liqPriceX = 0;
      if (rangeMount > 1) {
        const safetyBufferFactor = 1 - marginConfigTokens.min_safety_buffer / 10000;
        const assetPrice = getAssetPrice(ReduxcategoryAssets2) as any;

        if (activeTab === "short" && shortInput) {
          const adjustedShortInput =
            Number(shortInput) +
            Number(shrinkToken(estimateData?.min_amount_out, assetC.metadata.decimals));
          liqPriceX = (adjustedShortInput * assetPrice * safetyBufferFactor) / shortOutput;
        }
      }
      if (activeTab === "short") {
        setLiqPrice(liqPriceX);
      }
      setEstimateLoading(false);
    }
    console.log(estimateData, "....estimateData");
    setForceUpdateLoading(!estimateData?.loadingComplete);
  }, [estimateData]);

  // update liq price for long
  useEffect(() => {
    if (ReduxcategoryAssets2 && ReduxcategoryAssets1 && estimateData) {
      let liqPriceX = 0;

      if (rangeMount > 1) {
        const safetyBufferFactor = 1 - marginConfigTokens.min_safety_buffer / 10000;
        const assetPrice = getAssetPrice(ReduxcategoryAssets2) as any;
        const assetPriceP = getAssetPrice(ReduxcategoryAssets1) as any;

        if (activeTab === "long" && longInput) {
          const k1 = Number(longInput) * rangeMount * assetPrice; // debt cap
          liqPriceX =
            ((Number(longInput) * assetPrice + longOutput * assetPriceP) * safetyBufferFactor) / k1;
        }
      }
      if (activeTab === "long") {
        setLiqPrice(liqPriceX);
      }
      setEstimateLoading(false);
    }
  }, [longOutput]);

  // interval refresh price
  const [lastTokenInAmount, setLastTokenInAmount] = useState(0);

  // update price and make refresh icon spin
  useEffect(() => {
    const interval = setInterval(() => {
      if (tokenInAmount === lastTokenInAmount && longInput) {
        setTokenInAmount((prev) => prev);
        setForceUpdate((prev) => prev + 1);
        setForceUpdateLoading(true);
      } else {
        setLastTokenInAmount(tokenInAmount);
      }
    }, 20_000);

    return () => clearInterval(interval);
  }, [tokenInAmount, lastTokenInAmount]);

  // for same input, estimateLoading or forceUpdateLoading is true
  useEffect(() => {
    if (forceUpdateLoading) {
      const timer = setTimeout(() => {
        setForceUpdateLoading(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [forceUpdateLoading]);

  useEffect(() => {
    if (estimateLoading) {
      const timer = setTimeout(() => {
        setEstimateLoading(false);
      }, 4000); // 3 seconds

      return () => clearTimeout(timer); // Cleanup the timer on component unmount or when estimateLoading changes
    }
  }, [estimateLoading]);
  const Fee = useMemo(() => {
    return {
      openPFee:
        ((Number(longInput || shortInput) * config.open_position_fee_rate) / 10000) *
        (ReduxcategoryAssets2?.price?.usd || 1),
      swapFee:
        ((estimateData?.fee ?? 0) / 10000) *
        Number(tokenInAmount) *
        (activeTab == "long" ? 1 : getAssetPrice(ReduxcategoryAssets1) || 0),
      price: getAssetPrice(ReduxcategoryAssets1),
    };
  }, [longInput, shortInput, ReduxcategoryAssets1, estimateData, tokenInAmount]);

  useEffect(() => {
    if (selectedSetUpOption === "custom" && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [selectedSetUpOption]);

  const handleMouseEnter = () => {
    if (selectedSetUpOption === "custom" && customInputRef.current) {
      customInputRef.current.focus();
    }
  };

  function getAssetPrice(categoryId) {
    return categoryId ? assets.data[categoryId["token_id"]]?.price?.usd : 0;
  }

  function updateOutput(tab: string, inputUsdCharcate: number) {
    /**
     * @param inputUsdCharcate  category1 current price
     */
    const input = tab === "long" ? longInput : shortInput;
    // set output
    const outputSetter = tab === "long" ? setLongOutput : setShortOutput;
    // set output usd
    const outputUsdSetter = tab === "long" ? setLongOutputUsd : setShortOutputUsd;
    //
    if (input === undefined || !input || input === "0" || input === "0.") {
      outputSetter(0);
      outputUsdSetter(0);
      setLiqPrice(0);
      setTokenInAmount(0);
    } else if (tab === "long") {
      console.log("......", estimateData?.amount_out);
      outputSetter(+(estimateData?.amount_out || 0));
      outputUsdSetter(inputUsdCharcate * +(estimateData?.amount_out || 0));
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
    const adjustedInputAmount =
      inputAmount * inputUsdCharcate2 * rangeMount - openFeeAmount * inputUsdCharcate2;
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
    //
    return value.toFixed(6).replace(/\.?0+$/, "");
  };

  return (
    <div className="lg:w-full pt-4 lg:px-4 pb-9">
      <div className="flex justify-between items-center">
        <div className="flex bg-dark-200 px-0.5 py-0.5 rounded-md cursor-pointer mr-3">
          <div className={getTabClassName("long")} onClick={() => handleTabClick("long")}>
            Long {cateSymbol}
          </div>
          <div
            className={
              activeTab === "short"
                ? "bg-red-50 text-dark-200 py-2.5 px-5 rounded-md"
                : getTabClassName("short")
            }
            onClick={() => handleTabClick("short")}
          >
            Short {cateSymbol}
          </div>
        </div>
        <div />
        <div
          className="cursor-pointer border border-dark-500 rounded-md p-[8px] flex items-center justify-center"
          onClick={() => {
            if (!tokenInAmount || forceUpdateLoading) {
              return;
            }
            setForceUpdate((prev) => prev + 1);
            setForceUpdateLoading(true);
          }}
        >
          <RefreshIcon
            className={` hover:text-white ${
              forceUpdateLoading ? "text-white animate-spin" : "text-gray-300"
            }`}
          />
        </div>
        {/* slip start */}
        <div className="relative z-40 cursor-pointer slip-fater" onMouseEnter={handleMouseEnter}>
          <SetUp className="text-gray-300 hover:text-white" onClick={handleSetUpFocus} />

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
                  ref={customInputRef}
                  disabled={selectedSetUpOption === "auto"}
                  type="number"
                  onChange={(e) => slippageToleranceChange(e.target.value)}
                  value={slippageTolerance}
                  style={{ width: "32px" }}
                  className={selectedSetUpOption === "auto" ? "text-gray-700" : "text-white"}
                  onBlur={() => {
                    if (!slippageTolerance) {
                      slippageToleranceChange(0.5);
                    }
                  }}
                />
                <div className={selectedSetUpOption === "auto" ? "text-gray-700" : "text-white"}>
                  %
                </div>
              </div>
            </div>
            {!slippageTolerance && (
              <p className="text-sm mt-2 text-red-150">Slippage is required</p>
            )}
          </div>
        </div>
        {/* slip end */}
      </div>
      <div className="mt-5">
        {activeTab === "long" && (
          <>
            <div className="relative bg-dark-600 border border-dark-500 pt-3 pb-2.5 pr-3 pl-2.5 rounded-md z-30">
              <input
                onChange={tokenChange}
                type="text"
                value={longInput}
                placeholder="0"
                className="lg:max-w-[60%]"
              />
              <div className="absolute top-2 right-2">
                <TradingToken
                  setOwnBanlance={setOwnBanlance}
                  tokenList={categoryAssets2}
                  type="cate2"
                  setForceUpdate={() => setForceUpdate((prev) => prev + 1)}
                />
              </div>
              <p className="text-gray-300 mt-2 text-xs">${longInputUsd.toFixed(2)}</p>
            </div>
            <div className="relative my-2.5 flex justify-end z-0 w-1/2" style={{ zoom: "2" }}>
              <ShrinkArrow />
            </div>
            <div className="relative bg-dark-600 border border-dark-500 pt-3 pb-2.5 pr-3 pl-2.5 rounded-md z-20">
              {/* long out  */}
              <div>{longOutput && beautifyPrice(Number(longOutput))}</div>
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
                  {beautifyPrice(longOutput)} {cateSymbol}
                  <span className="text-xs text-gray-300 ml-1.5">
                    (${beautifyPrice(longOutputUsd)})
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
                <div>
                  {estimateLoading ? (
                    <BeatLoader size={5} color="white" />
                  ) : (
                    <span>${beautifyPrice(LiqPrice)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="text-gray-300">Fee</div>
                <div className="flex items-center justify-center relative">
                  <p
                    className="border-b border-dashed border-dark-800 cursor-pointer"
                    onMouseEnter={() => setShowFeeModal(true)}
                    onMouseLeave={() => setShowFeeModal(false)}
                  >
                    ${beautifyPrice(Number(formatDecimal(Fee.swapFee + Fee.openPFee)))}
                  </p>

                  {showFeeModal && (
                    <div className="absolute bg-[#14162B] text-white min-h-[50px] p-2 rounded text-xs top-[30px] left-[-60px] flex flex-col items-start justify-between z-[1] w-auto">
                      <p>
                        <span className="mr-1 whitespace-nowrap">Open Fee:</span>$
                        {beautifyPrice(Fee.openPFee)}
                      </p>
                      <p>
                        <span className="mr-1 whitespace-nowrap">Trade Fee:</span>$
                        {beautifyPrice(Fee.swapFee)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {isMaxPosition && accountId && (
                <div className=" text-[#EA3F68] text-sm font-normal flex items-start my-1">
                  <MaxPositionIcon />
                  <span className="ml-1">Exceeded the maximum number of open positions.</span>
                </div>
              )}
              {rangeMount <= 1 && accountId && longOutput > 0 && (
                <span className="text-[#EA3F68] text-sm font-normal flex items-start mb-1">
                  Leverage must be greater than 1
                </span>
              )}
              {accountId ? (
                <YellowSolidButton
                  className="w-full"
                  disabled={isDisabled || isMaxPosition}
                  onClick={handleConfirmButtonClick}
                >
                  Long {cateSymbol} {rangeMount}x
                </YellowSolidButton>
              ) : (
                <ConnectWalletButton accountId={accountId} className="w-full" />
              )}
              {isConfirmModalOpen && (
                <ConfirmMobile
                  open={isConfirmModalOpen}
                  onClose={() => {
                    setIsConfirmModalOpen(false);
                    if (onMobileClose) onMobileClose();
                  }}
                  action="Long"
                  confirmInfo={{
                    longInput,
                    longInputUsd,
                    longOutput,
                    longOutputUsd,
                    rangeMount,
                    estimateData,
                    // indexPrice: assets.data[ReduxcategoryAssets1["token_id"]].price?.usd,
                    longInputName: ReduxcategoryAssets2,
                    longOutputName: ReduxcategoryAssets1,
                    assets,
                    tokenInAmount,
                    LiqPrice,
                    Fee,
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
                onChange={tokenChange}
                type="text"
                value={shortInput}
                placeholder="0"
                className="lg:max-w-[60%]"
              />
              <div className="absolute top-2 right-2">
                <TradingToken
                  setOwnBanlance={setOwnBanlance}
                  tokenList={categoryAssets2}
                  type="cate2"
                  setForceUpdate={() => setForceUpdate((prev) => prev + 1)}
                />
              </div>
              <p className="text-gray-300 mt-2 text-xs">${shortInputUsd.toFixed(2)}</p>
            </div>
            <div className="relative my-2.5 flex justify-end z-0 w-1/2" style={{ zoom: "2" }}>
              <ShrinkArrow />
            </div>
            <div className="relative bg-dark-600 border border-dark-500 pt-3 pb-2.5 pr-3 pl-2.5 rounded-md z-20">
              {/* short out */}
              <div>{shortOutput && beautifyPrice(Number(shortOutput))}</div>
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
                <div className="text-right">
                  {beautifyPrice(shortOutput)} {cateSymbol}
                  <span className="text-xs text-gray-300 ml-1.5">
                    (${beautifyPrice(shortOutputUsd)})
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="text-gray-300">Minimum received</div>
                <div className="text-right">
                  {beautifyPrice(Number(shortOutput) * (1 - slippageTolerance / 100))} {cateSymbol}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="text-gray-300">Liq. Price</div>
                <div>
                  {estimateLoading ? (
                    <BeatLoader size={5} color="white" />
                  ) : (
                    `$${toInternationalCurrencySystem_number(LiqPrice)}`
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="text-gray-300">Fee</div>
                <div className="flex items-center justify-center relative">
                  <p
                    className="border-b border-dashed border-dark-800 cursor-pointer"
                    onMouseEnter={() => setShowFeeModal(true)}
                    onMouseLeave={() => setShowFeeModal(false)}
                  >
                    ${beautifyPrice(Number(formatDecimal(Fee.swapFee + Fee.openPFee)))}
                  </p>
                  {showFeeModal && (
                    <div className="absolute bg-[#14162B] text-white h-[50px] p-2 rounded text-xs top-[30px] left-[-60px] flex flex-col items-start justify-between z-[1] w-auto">
                      <p>
                        <span className="mr-1 whitespace-nowrap">Open Fee:</span>$
                        {beautifyPrice(Fee.openPFee)}
                      </p>
                      <p>
                        <span className="mr-1 whitespace-nowrap">Trade Fee:</span>$
                        {beautifyPrice(Fee.swapFee)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {isMaxPosition && accountId && (
                <div className=" text-[#EA3F68] text-sm font-normal flex items-start my-1">
                  <MaxPositionIcon />
                  <span className="ml-1">Exceeded the maximum number of open positions.</span>
                </div>
              )}
              {rangeMount <= 1 && accountId && shortOutput > 0 && (
                <span className="text-[#EA3F68] text-sm font-normal flex items-start mb-1">
                  Leverage must be greater than 1
                </span>
              )}
              {accountId ? (
                <RedSolidButton
                  className="w-full"
                  disabled={isDisabled || isMaxPosition}
                  onClick={handleConfirmButtonClick}
                >
                  Short {cateSymbol} {rangeMount}x
                </RedSolidButton>
              ) : (
                <ConnectWalletButton accountId={accountId} className="w-full" isShort />
              )}
              {isConfirmModalOpen && (
                <ConfirmMobile
                  open={isConfirmModalOpen}
                  onClose={() => {
                    setIsConfirmModalOpen(false);
                    if (onMobileClose) onMobileClose();
                  }}
                  action="Short"
                  confirmInfo={{
                    longInput: shortInput,
                    longInputUsd: shortInputUsd,
                    longOutput: shortOutput,
                    longOutputUsd: shortOutputUsd,
                    rangeMount,
                    estimateData,
                    // indexPrice: assets.data[ReduxcategoryAssets1["token_id"]].price?.usd,
                    longInputName: ReduxcategoryAssets2,
                    longOutputName: ReduxcategoryAssets1,
                    assets,
                    tokenInAmount,
                    LiqPrice,
                    Fee,
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
