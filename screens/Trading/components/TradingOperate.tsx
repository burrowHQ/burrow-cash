import React, { useMemo, useState, useEffect, useRef } from "react";
import { useDebounce } from "react-use";
import _ from "lodash";
import { BeatLoader } from "react-spinners";
import Decimal from "decimal.js";
import TradingToken from "./tokenbox";
import { SetUp, ShrinkArrow, MaxPositionIcon, RefreshIcon } from "./TradingIcon";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import RangeSlider from "./RangeSlider";
import ConfirmMobile from "./ConfirmMobile";
import { getAccountId } from "../../../redux/accountSelectors";
import { getAssets, getAssetsMEME } from "../../../redux/assetsSelectors";
import { useMarginConfigToken } from "../../../hooks/useMarginConfig";
import { getMarginConfigCategory } from "../../../redux/marginConfigSelectors";
import { toDecimal } from "../../../utils/uiNumber";
import { useEstimateSwap } from "../../../hooks/useEstimateSwap";
import { setSlippageToleranceFromRedux, setReduxActiveTab } from "../../../redux/marginTrading";
import { useMarginAccount } from "../../../hooks/useMarginAccount";
import {
  YellowSolidSubmitButton as YellowSolidButton,
  RedSolidSubmitButton as RedSolidButton,
} from "../../../components/Modal/button";
import { beautifyPrice } from "../../../utils/beautyNumber";
import { ConnectWalletButton } from "../../../components/Header/WalletButton";
import { getSymbolById } from "../../../transformers/nearSymbolTrans";
import { useRegisterTokenType } from "../../../hooks/useRegisterTokenType";
import { MARGIN_MIN_COLLATERAL_USD } from "../../../utils/config";
import type { Asset } from "../../../redux/assetState";
import { expandToken, shrinkToken } from "../../../store";
import type { IMarginConfigState } from "../../../redux/marginConfigState";

interface TradingOperateProps {
  onMobileClose?: () => void;
  id: string;
}
const tip_leverage = "Leverage must be greater than 1";
const tip_min_usd = `Deposit at least $${MARGIN_MIN_COLLATERAL_USD}`;
const tip_max_positions = "Exceeded the maximum number of open positions.";
const tip_max_available_debt = "Current maximum available position:";
const tip_min_available_debt = "Current minimum available position:";
const tip_min_base = "The position opened is too small, below the contract limit:";
const tip_max_base = "The position opened is too large, exceeding the contract limit:";
const tip_total_max_base = "The overall open position is too mall, exceeding the market limit:";
const insufficient_balance = "Insufficient Balance";

const TradingOperate: React.FC<TradingOperateProps> = ({ onMobileClose, id }) => {
  const {
    ReduxcategoryAssets1,
    ReduxcategoryAssets2,
    ReduxcategoryCurrentBalance1,
    ReduxcategoryCurrentBalance2,
    ReduxSlippageTolerance,
    ReduxRangeMount,
    ReduxActiveTab,
  } = useAppSelector((state) => state.category);
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5);
  const [showFeeModal, setShowFeeModal] = useState<boolean>(false);
  const [forceUpdateLoading, setForceUpdateLoading] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<string>(ReduxActiveTab || "long");
  const [selectedSetUpOption, setSelectedSetUpOption] = useState<string>("custom");
  const [isLongConfirmModalOpen, setIsLongConfirmModalOpen] = useState<boolean>(false);
  const [isShortConfirmModalOpen, setIsShortConfirmModalOpen] = useState<boolean>(false);
  const [rangeMount, setRangeMount] = useState<number>(ReduxRangeMount || 1);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [longInput, setLongInput] = useState<string>("");
  const [shortInput, setShortInput] = useState<string>("");
  const [longOutput, setLongOutput] = useState<number>(0);
  const [shortOutput, setShortOutput] = useState<number>(0);
  const [longInputUsd, setLongInputUsd] = useState<number>(0);
  const [longOutputUsd, setLongOutputUsd] = useState<number>(0);
  const [shortInputUsd, setShortInputUsd] = useState<number>(0);
  const [shortOutputUsd, setShortOutputUsd] = useState<number>(0);
  const [tokenInAmount, setTokenInAmount] = useState<number>(0);
  const [warnTip, setWarnTip] = useState<React.ReactElement | string>("");
  const [LiqPrice, setLiqPrice] = useState<string>("");
  const [forceUpdate, setForceUpdate] = useState<number>(0);
  const [tradingLoading, setTradingLoading] = useState<boolean>(false);
  const customInputRef = useRef<HTMLInputElement>(null);
  const accountId = useAppSelector(getAccountId);
  const { filteredTokenTypeMap } = useRegisterTokenType();
  const assets = useAppSelector(getAssets);
  const assetsMEME = useAppSelector(getAssetsMEME);
  const isMainStream = filteredTokenTypeMap.mainStream.includes(id);
  const combinedAssetsData = isMainStream ? assets.data : assetsMEME.data;
  const config = useAppSelector(getMarginConfigCategory(!isMainStream));
  const {
    categoryAssets1,
    categoryAssets1MEME,
    categoryAssets2,
    categoryAssets2MEME,
    marginConfigTokens,
    marginConfigTokensMEME,
  } = useMarginConfigToken();
  const { marginAccountList: marginAccountListMain, marginAccountListMEME } = useMarginAccount();
  const { defaultBaseTokenConfig, listBaseTokenConfig } = config;
  const min_safety_buffer =
    listBaseTokenConfig[id]?.min_safety_buffer || defaultBaseTokenConfig.min_safety_buffer;
  const { max_active_user_margin_position } = isMainStream
    ? marginConfigTokens
    : marginConfigTokensMEME;
  const marginAccountList = isMainStream ? marginAccountListMain : marginAccountListMEME;
  // estimate
  const { estimateResult: estimateData, estimateLoading } = useEstimateSwap({
    tokenIn_id:
      activeTab === "long" ? ReduxcategoryAssets2?.token_id : ReduxcategoryAssets1?.token_id,
    tokenOut_id:
      activeTab === "long" ? ReduxcategoryAssets1?.token_id : ReduxcategoryAssets2?.token_id,
    tokenIn_amount: toDecimal(tokenInAmount),
    account_id: accountId,
    slippageTolerance: slippageTolerance / 100,
    forceUpdate,
  });
  // Long for tip to get max borrow amount TODO According to market conditions, if there is a real need, add
  // const { estimateResult: estimateDataBurrowLimit, estimateLoading: estimateLoadingBurrowLimt } =
  //   useEstimateSwap({
  //     tokenIn_id: ReduxcategoryAssets2?.token_id,
  //     tokenOut_id: ReduxcategoryAssets1?.token_id,
  //     tokenIn_amount: toDecimal(
  //       getAvailableLiquidityForMargin({
  //         assetDebt: ReduxcategoryAssets2,
  //         marginConfig: config,
  //       }),
  //     ),
  //     account_id: accountId,
  //     slippageTolerance: slippageTolerance / 100,
  //     forceUpdate,
  //   });
  // slippageTolerance change ecent
  useEffect(() => {
    dispatch(setSlippageToleranceFromRedux(0.5));
  }, []);
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
  /**
   * longInput shortInput deal start
   *  */
  useEffect(() => {
    const inputUsdCharcate1 = getAssetPrice(ReduxcategoryAssets1);
    const inputUsdCharcate2 = getAssetPrice(ReduxcategoryAssets2);
    if (inputUsdCharcate1 && estimateData) {
      // out put input
      updateOutput(activeTab, inputUsdCharcate1);
    }

    if (inputUsdCharcate2 && inputUsdCharcate1) {
      // swap token in amount
      updateInputAmounts(activeTab, inputUsdCharcate2, inputUsdCharcate1);
    }
  }, [
    longInput,
    shortInput,
    rangeMount,
    estimateData,
    slippageTolerance,
    tokenInAmount,
    ReduxcategoryAssets1,
    ReduxcategoryAssets2,
  ]);
  // update liq price for long
  useDebounce(
    () => {
      if (ReduxcategoryAssets2 && ReduxcategoryAssets1 && estimateData) {
        if (activeTab == "long" && +(longInput || 0) > 0 && (longOutput || 0) > 0) {
          const safetyBufferFactor = 1 - min_safety_buffer / 10000;
          const token_c_amount = longInput;
          const token_d_amount = new Decimal(token_c_amount || 0).mul(rangeMount || 0);
          const token_p_amount = longOutput;
          const liq_price = new Decimal(token_d_amount || 0)
            .minus(new Decimal(token_c_amount || 0).mul(safetyBufferFactor))
            .div(new Decimal(token_p_amount || 0).mul(safetyBufferFactor))
            .toFixed();
          setLiqPrice(liq_price || "0");
        }
      }
    },
    200,
    [activeTab, estimateData],
  );
  // update liq price for short
  useDebounce(
    () => {
      if (ReduxcategoryAssets2 && ReduxcategoryAssets1 && estimateData) {
        if (
          activeTab === "short" &&
          +(shortInput || 0) > 0 &&
          +(estimateData.amount_out || 0) > 0 &&
          +(shortOutput || 0) > 0
        ) {
          const safetyBufferFactor = 1 - min_safety_buffer / 10000;
          const token_c_amount = shortInput;
          const token_p_amount = estimateData.amount_out;
          const token_d_amount = shortOutput;
          const liq_price = new Decimal(token_c_amount || 0)
            .plus(token_p_amount || 0)
            .mul(safetyBufferFactor)
            .div(token_d_amount)
            .toFixed();
          setLiqPrice(liq_price || "0");
        }
      }
    },
    200,
    [estimateData, activeTab],
  );
  // force estimating
  useEffect(() => {
    const interval = setInterval(() => {
      if (tokenInAmount) {
        setForceUpdate((prev) => prev + 1);
        setForceUpdateLoading(true);
      }
    }, 20_000);

    return () => clearInterval(interval);
  }, [tokenInAmount]);
  // for same input, forceUpdateLoading is true
  useEffect(() => {
    if (forceUpdateLoading) {
      const timer = setTimeout(() => {
        setForceUpdateLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [forceUpdateLoading]);
  useEffect(() => {
    if (selectedSetUpOption === "custom" && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [selectedSetUpOption]);
  const Fee = useMemo(() => {
    const debt_asset = activeTab == "long" ? ReduxcategoryAssets2 : ReduxcategoryAssets1;
    return {
      holdFee: calculateHodingFee({
        debt_asset,
        debt_amount: tokenInAmount,
        burrow_apy: new Decimal(debt_asset?.borrow_apr || 0)
          .mul(config?.margin_debt_discount_rate)
          .div(10000)
          .toFixed(),
        holding_position_fee_rate: debt_asset?.config.holding_position_fee_rate,
        debt_token_price: debt_asset?.price?.usd || 0,
      }),
      openPFee:
        ((Number(longInput || shortInput) * config.open_position_fee_rate) / 10000) *
        (ReduxcategoryAssets2?.price?.usd || 1),
      swapFee:
        ((estimateData?.fee ?? 0) / 10000) *
        Number(tokenInAmount) *
        (activeTab == "long"
          ? getAssetPrice(ReduxcategoryAssets2) || 0
          : getAssetPrice(ReduxcategoryAssets1) || 0),
      price: getAssetPrice(ReduxcategoryAssets1),
    };
  }, [
    longInput,
    shortInput,
    JSON.stringify(ReduxcategoryAssets1 || {}),
    estimateData,
    tokenInAmount,
    activeTab,
    config.margin_debt_discount_rate,
  ]);
  // Estimated hoding fee
  function calculateHodingFee({
    debt_asset,
    debt_amount,
    burrow_apy,
    holding_position_fee_rate,
    debt_token_price,
  }: {
    debt_asset: any;
    debt_amount: string | number;
    burrow_apy: string;
    holding_position_fee_rate: string;
    debt_token_price: string;
  }) {
    if (new Decimal(debt_amount || 0).lte(0) || new Decimal(debt_token_price || 0).lte(0)) {
      return "0";
    }
    const borrow$ = new Decimal(debt_amount)
      .mul(burrow_apy)
      .div(365)
      .mul(debt_token_price || 0);
    const oneDay = 24 * 60 * 60 * 1000;
    const base = new Decimal(holding_position_fee_rate).div(new Decimal(10).pow(27));
    const hode$ = base
      .pow(oneDay)
      .minus(1)
      .mul(debt_amount)
      .mul(debt_token_price || 0);
    console.log("-------------trading fee params", {
      debt_asset,
      debt_amount: tokenInAmount,
      burrow_apy: new Decimal(debt_asset?.borrow_apr || 0)
        .mul(config?.margin_debt_discount_rate)
        .div(10000)
        .toFixed(),
      holding_position_fee_rate: debt_asset?.config.holding_position_fee_rate,
      debt_token_price: debt_asset?.price?.usd || 0,
      hode$: hode$.toFixed(),
      borrow$: borrow$.toFixed(),
    });
    const total = borrow$.plus(hode$).toFixed();
    return total;
  }
  // check to show tip
  useDebounce(
    () => {
      if (!accountId || tradingLoading) {
        setWarnTip("");
      } else if (Object.values(marginAccountList).length >= max_active_user_margin_position) {
        setWarnTip(tip_max_positions);
      } else if (activeTab == "long" && longOutput > 0) {
        if (rangeMount <= 1) {
          setWarnTip(tip_leverage);
        } else if (longInputUsd < MARGIN_MIN_COLLATERAL_USD) {
          setWarnTip(tip_min_usd);
        } else if (new Decimal(longInput || 0).gt(ReduxcategoryCurrentBalance2 || 0)) {
          setWarnTip(insufficient_balance);
        } else {
          // borrow limit
          const borrowLimit = getBorrowLimit(ReduxcategoryAssets2, tokenInAmount, config);
          const price_1 = getAssetPrice(ReduxcategoryAssets1);
          const price_2 = getAssetPrice(ReduxcategoryAssets2);
          if (borrowLimit?.isExceed) {
            if (Number(price_1 || 0) > 0) {
              const max_position = new Decimal(borrowLimit.availableLiquidity || 0)
                .mul(price_2 || 0)
                .div(price_1!);
              setWarnTip(
                <>
                  {tip_max_available_debt} {beautifyPrice(Number(max_position.toFixed() || 0))}{" "}
                  {ReduxcategoryAssets1?.metadata?.symbol}
                </>,
              );
            }
          } else if (borrowLimit?.lowLoanLimit) {
            if (Number(price_1 || 0) > 0) {
              const min_position = new Decimal(borrowLimit.lowAmount || 0)
                .mul(price_2 || 0)
                .div(price_1!);
              setWarnTip(
                <>
                  {tip_min_available_debt} {beautifyPrice(Number(min_position.toFixed() || 0))}{" "}
                  {ReduxcategoryAssets1?.metadata?.symbol}
                </>,
              );
            }
          } else {
            const min_token_p_amount = expandToken(
              estimateData?.min_amount_out || 0,
              ReduxcategoryAssets1?.config?.extra_decimals || 0,
            );
            if (+min_token_p_amount > 0) {
              const baseTokenDecimals =
                (ReduxcategoryAssets1?.metadata?.decimals || 0) +
                (ReduxcategoryAssets1?.config?.extra_decimals || 0);
              getOpenPositionLimit({
                baseTokenId: ReduxcategoryAssets1.token_id,
                baseTokenAmount: min_token_p_amount,
                baseTokenDecimals,
                marginConfig: config,
                actionType: "Long",
              });
            } else {
              setWarnTip("");
            }
          }
        }
      } else if (activeTab == "short" && shortOutput > 0) {
        if (rangeMount <= 1) {
          setWarnTip(tip_leverage);
        } else if (shortInputUsd < MARGIN_MIN_COLLATERAL_USD) {
          setWarnTip(tip_min_usd);
        } else if (new Decimal(shortInput || 0).gt(ReduxcategoryCurrentBalance2 || 0)) {
          setWarnTip(insufficient_balance);
        } else {
          // borrow limit
          const borrowLimit = getBorrowLimit(ReduxcategoryAssets1, tokenInAmount, config);
          if (borrowLimit?.isExceed) {
            setWarnTip(
              <>
                {tip_max_available_debt} {beautifyPrice(borrowLimit.availableLiquidity || 0)}{" "}
                {ReduxcategoryAssets1?.metadata?.symbol}
              </>,
            );
          } else if (borrowLimit?.lowLoanLimit) {
            setWarnTip(
              <>
                {tip_min_available_debt} {beautifyPrice(borrowLimit.lowAmount || 0)}{" "}
                {ReduxcategoryAssets1?.metadata?.symbol}
              </>,
            );
          } else {
            const baseTokenDecimals =
              (ReduxcategoryAssets1?.metadata?.decimals || 0) +
              (ReduxcategoryAssets1?.config?.extra_decimals || 0);
            const d_amount = expandToken(tokenInAmount || 0, baseTokenDecimals);
            getOpenPositionLimit({
              baseTokenId: ReduxcategoryAssets1.token_id,
              baseTokenAmount: d_amount,
              baseTokenDecimals,
              marginConfig: config,
              actionType: "Short",
            });
          }
        }
      } else {
        setWarnTip("");
      }
    },
    100,
    [
      marginAccountList,
      max_active_user_margin_position,
      longInputUsd,
      shortInputUsd,
      rangeMount,
      accountId,
      shortOutput,
      longOutput,
      activeTab,
      tokenInAmount,
      ReduxcategoryAssets1,
      ReduxcategoryAssets2,
      ReduxcategoryCurrentBalance2,
      longInput,
      shortInput,
      config,
      estimateData,
      tradingLoading,
    ],
  );
  const setMaxInputBanlance = (key: string) => {
    if (activeTab === "long") {
      setLongInput(key);
    } else {
      setShortInput(key);
    }
  };
  // for tab change
  const initCateState = (tabString: string) => {
    setLiqPrice("0");
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
  };
  const getTabClassName = (tabName: string) => {
    return activeTab === tabName
      ? "bg-primary text-dark-200 py-2.5 px-5 rounded-md h-11 w-[50%] overflow-hidden text-ellipsis whitespace-nowrap"
      : "text-gray-300 py-2.5 px-5 h-11 w-[50%] overflow-hidden text-ellipsis whitespace-nowrap";
  };
  const cateSymbol = getSymbolById(
    ReduxcategoryAssets1?.token_id,
    ReduxcategoryAssets1?.metadata?.symbol,
  );
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
    if (activeTab == "long") {
      setIsLongConfirmModalOpen(true);
    } else if (activeTab == "short") {
      setIsShortConfirmModalOpen(true);
    }
  };

  const isValidDecimalString = (str) => {
    if (str <= 0) return false;
    // const regex = /^(?![0]+$)\d+(\.\d+)?$/;
    const regex = /^\d+(\.\d+)?$/;
    return regex.test(str);
  };
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
      setLiqPrice("");
      return;
    }
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
  const handleMouseEnter = () => {
    if (selectedSetUpOption === "custom" && customInputRef.current) {
      customInputRef.current.focus();
    }
  };
  function getAssetPrice(categoryId) {
    return categoryId ? combinedAssetsData[categoryId["token_id"]]?.price?.usd : 0;
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
      setLiqPrice("");
      setTokenInAmount(0);
    } else if (tab === "long") {
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
    const max_leverage_rate =
      config.listBaseTokenConfig[id]?.max_leverage_rate ||
      config.defaultBaseTokenConfig.max_leverage_rate;
    const rangeMountSafty = +max_leverage_rate == +rangeMount ? +rangeMount * 0.999 : +rangeMount;
    const adjustedInputAmount = inputAmount * inputUsdCharcate2 * rangeMountSafty;
    const inputUsdSetter = tab === "long" ? setLongInputUsd : setShortInputUsd;

    // set input usd
    inputUsdSetter(inputUsdCharcate2 * inputAmount);
    if (tab === "long") {
      setTokenInAmount(adjustedInputAmount / inputUsdCharcate2);
    } else {
      setTokenInAmount(adjustedInputAmount / inputUsdCharcate1);
    }
  }
  const formatDecimal = (value: number) => {
    if (!value) return "0";
    return value.toFixed(6).replace(/\.?0+$/, "");
  };
  function getBorrowLimit(assetDebt: Asset, debt_amount: number, marginConfig: IMarginConfigState) {
    const assetsMap = isMainStream ? assets.data : assetsMEME.data;
    const asset = assetsMap[assetDebt.token_id];
    const availableLiquidityForMargin = getAvailableLiquidityForMargin({
      assetDebt,
      marginConfig,
    });
    // asset.config.min_borrowed_amount;
    if (new Decimal(debt_amount || 0).gte(availableLiquidityForMargin || 0)) {
      return {
        isExceed: true,
        availableLiquidity: availableLiquidityForMargin,
      };
    }
    if (new Decimal(asset.config.min_borrowed_amount || 0).gt(0)) {
      const asset_decimals = asset.metadata.decimals + asset.config.extra_decimals;
      const debt_amount_decimals = expandToken(debt_amount, asset_decimals);
      if (new Decimal(debt_amount_decimals).lte(asset.config.min_borrowed_amount || 0)) {
        return {
          lowLoanLimit: true,
          lowAmount: shrinkToken(asset.config.min_borrowed_amount || 0, asset_decimals),
        };
      }
    }
  }
  function getOpenPositionLimit({
    baseTokenId,
    baseTokenAmount, // short: d_amount, long: min_token_p_amount,
    baseTokenDecimals,
    marginConfig,
    actionType,
  }: {
    baseTokenId: string;
    baseTokenAmount: string;
    baseTokenDecimals: number;
    marginConfig: IMarginConfigState;
    actionType: "Long" | "Short";
  }) {
    const { listBaseTokenConfig, defaultBaseTokenConfig } = marginConfig;
    const baseTokenAmountD = new Decimal(baseTokenAmount);
    const { marketTotalBorrowAmount, marketTotalPositionAmount } = getMarketTotalData({
      baseTokenId,
      baseTokenAmount,
    });
    if (actionType == "Long") {
      // long limit config
      const min_base_token_long_position =
        listBaseTokenConfig[baseTokenId]?.min_base_token_long_position ||
        defaultBaseTokenConfig.min_base_token_long_position;
      const max_base_token_long_position =
        listBaseTokenConfig[baseTokenId]?.max_base_token_long_position ||
        defaultBaseTokenConfig.max_base_token_long_position;
      const total_base_token_available_long =
        listBaseTokenConfig[baseTokenId]?.total_base_token_available_long ||
        defaultBaseTokenConfig.total_base_token_available_long;
      if (baseTokenAmountD.lt(min_base_token_long_position)) {
        setWarnTip(
          <>
            {tip_min_base}
            {beautifyPrice(shrinkToken(min_base_token_long_position, baseTokenDecimals))}
          </>,
        );
      } else if (baseTokenAmountD.gt(max_base_token_long_position)) {
        setWarnTip(
          <>
            {tip_max_base}
            {beautifyPrice(shrinkToken(max_base_token_long_position, baseTokenDecimals))}
          </>,
        );
      } else if (marketTotalPositionAmount.gt(total_base_token_available_long)) {
        setWarnTip(
          <>
            {tip_total_max_base}
            {beautifyPrice(shrinkToken(total_base_token_available_long, baseTokenDecimals))}
          </>,
        );
      } else {
        setWarnTip("");
      }
    } else {
      // short limit config
      const min_base_token_short_position =
        listBaseTokenConfig[baseTokenId]?.min_base_token_short_position ||
        defaultBaseTokenConfig.min_base_token_short_position;
      const max_base_token_short_position =
        listBaseTokenConfig[baseTokenId]?.max_base_token_short_position ||
        defaultBaseTokenConfig.max_base_token_short_position;
      const total_base_token_available_short =
        listBaseTokenConfig[baseTokenId]?.total_base_token_available_short ||
        defaultBaseTokenConfig.total_base_token_available_short;
      if (baseTokenAmountD.lt(min_base_token_short_position)) {
        setWarnTip(
          <>
            {tip_min_base}
            {beautifyPrice(shrinkToken(min_base_token_short_position, baseTokenDecimals))}
          </>,
        );
      } else if (baseTokenAmountD.gt(max_base_token_short_position)) {
        setWarnTip(
          <>
            {tip_max_base}
            {beautifyPrice(shrinkToken(max_base_token_short_position, baseTokenDecimals))}
          </>,
        );
      } else if (marketTotalBorrowAmount.gt(total_base_token_available_short)) {
        setWarnTip(
          <>
            {tip_total_max_base}
            {beautifyPrice(shrinkToken(total_base_token_available_short, baseTokenDecimals))}
          </>,
        );
      } else {
        setWarnTip("");
      }
    }
  }
  function getAvailableLiquidityForMargin({
    assetDebt,
    marginConfig,
  }: {
    assetDebt: Asset;
    marginConfig: IMarginConfigState;
  }) {
    const assetsMap = isMainStream ? assets.data : assetsMEME.data;
    const asset = assetsMap[assetDebt.token_id];
    const temp1 = new Decimal(asset.supplied.balance)
      .plus(new Decimal(asset.reserved))
      .plus(asset.prot_fee)
      .minus(new Decimal(asset.borrowed.balance || 0))
      .minus(new Decimal(asset.margin_debt.balance || 0))
      .minus(new Decimal(asset.margin_pending_debt || 0));
    const temp2 = temp1.minus(temp1.mul(0.001)).toFixed(0);
    const availableLiquidity = Number(
      shrinkToken(temp2, asset.metadata.decimals + asset.config.extra_decimals),
    );
    const scale = marginConfig.pending_debt_scale / 10000;
    const availableLiquidityForMargin = availableLiquidity * scale;
    return availableLiquidityForMargin;
  }
  function getMarketTotalData({
    baseTokenId,
    baseTokenAmount,
  }: {
    baseTokenId: string;
    baseTokenAmount: string;
  }) {
    const assetsMap = isMainStream ? assets.data : assetsMEME.data;
    const asset = assetsMap[baseTokenId];
    const temp1 = new Decimal(asset.margin_debt.balance || 0)
      .plus(asset.margin_pending_debt || 0)
      .plus(baseTokenAmount || 0);
    const temp2 = new Decimal(asset.margin_position || 0).plus(baseTokenAmount);
    return {
      marketTotalBorrowAmount: temp1,
      marketTotalPositionAmount: temp2,
    };
  }
  const buttonLoading = estimateLoading || forceUpdateLoading;
  return (
    <div className="lg:w-full pt-4 lg:px-4 pb-9">
      <div className="flex justify-between items-center">
        <div className="flex bg-dark-200 px-0.5 py-0.5 rounded-md cursor-pointer mr-3 w-[80%]">
          <div
            className={getTabClassName("long")}
            onClick={() => handleTabClick("long")}
            title={`Long ${cateSymbol}`}
          >
            Long {cateSymbol}
          </div>
          <div
            className={
              activeTab === "short"
                ? "bg-orange text-dark-200 py-2.5 px-5 rounded-md h-11 w-[50%] overflow-hidden text-ellipsis whitespace-nowrap"
                : getTabClassName("short")
            }
            onClick={() => handleTabClick("short")}
            title={`Short ${cateSymbol}`}
          >
            Short {cateSymbol}
          </div>
        </div>
        <div />
        <div
          className="cursor-pointer border border-dark-50 rounded-md p-[8px] flex items-center justify-center mr-1"
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

          <div className="slip-child absolute top-8 right-0 bg-dark-250 border border-dark-50 rounded-md py-6 px-4">
            <p className="text-base mb-6">Max. Slippage Setting</p>
            <div className="flex items-center justify-between h-10">
              <div className="bg-dark-200 p-1 rounded-md flex items-center mr-3.5">
                <div
                  className={`py-2 px-5 ${
                    selectedSetUpOption === "auto" ? "bg-white bg-opacity-5 rounded " : ""
                  }`}
                  onClick={() => handleSetUpOptionClick("auto")}
                >
                  Auto
                </div>
                <div
                  className={`py-2 px-5 ${
                    selectedSetUpOption === "custom" ? "bg-white bg-opacity-5 rounded " : ""
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
            {!slippageTolerance && <p className="text-sm mt-2 text-danger">Slippage is required</p>}
          </div>
        </div>
        {/* slip end */}
      </div>
      <div className="mt-5">
        <div className={`${activeTab == "long" ? "" : "hidden"}`}>
          <div className="relative bg-dark-600 border border-dark-50 pt-3 pb-2.5 pr-3 pl-2.5 rounded-md z-30">
            <input
              onChange={tokenChange}
              type="text"
              value={longInput}
              placeholder="0"
              className="lg:max-w-[60%]"
            />
            <div className="absolute top-2 right-2">
              <TradingToken
                setMaxInputBanlance={setMaxInputBanlance}
                tokenList={isMainStream ? categoryAssets2 : categoryAssets2MEME}
                type="cate2"
                isMemeCategory={!isMainStream}
              />
            </div>
            <p className="text-gray-300 mt-2 text-xs">{beautifyPrice(longInputUsd, true)}</p>
          </div>
          <div className="relative my-2.5 flex justify-end z-0 w-1/2" style={{ zoom: "2" }}>
            <ShrinkArrow />
          </div>
          <div className="relative bg-dark-600 border border-dark-50 pt-3 pb-2.5 pr-3 pl-2.5 rounded-md z-20">
            {/* long out  */}
            <div>{longOutput && beautifyPrice(Number(longOutput))}</div>
            {/*  */}
            <div className="absolute top-2 right-2">
              <TradingToken
                tokenList={isMainStream ? categoryAssets1 : categoryAssets1MEME}
                type="cate1"
                isMemeCategory={!isMainStream}
              />
            </div>
            <p className="text-gray-300 mt-2 text-xs">{beautifyPrice(longOutputUsd || 0, true)}</p>
          </div>
          <RangeSlider
            defaultValue={rangeMount}
            action="Long"
            setRangeMount={setRangeMount}
            baseTokenId={id}
          />
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
              <span>{beautifyPrice(LiqPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="text-gray-300">Fee</div>
              <div className="flex items-center justify-center relative">
                <p
                  className="border-b border-dashed border-dark-800 cursor-pointer"
                  onMouseEnter={() => setShowFeeModal(true)}
                  onMouseLeave={() => setShowFeeModal(false)}
                >
                  $
                  {beautifyPrice(
                    Number(
                      new Decimal(Fee.swapFee || 0)
                        .plus(Fee.openPFee || 0)
                        .plus(Fee.holdFee || 0)
                        .toNumber(),
                    ),
                  )}
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
                    <p className="whitespace-nowrap">
                      <span className="mr-1 whitespace-nowrap">Funding Fee:</span>≈$
                      {beautifyPrice(Fee.holdFee)}/day
                    </p>
                  </div>
                )}
              </div>
            </div>
            {warnTip ? (
              <div className="text-[#EA3F68] text-sm font-normal flex items-start my-2.5">
                <MaxPositionIcon className="flex-shrink-0 mt-0.5" />
                <span className="ml-1">{warnTip}</span>
              </div>
            ) : null}
            {accountId ? (
              <YellowSolidButton
                className="w-full"
                disabled={isDisabled || !!warnTip}
                onClick={handleConfirmButtonClick}
              >
                {buttonLoading ? (
                  <BeatLoader size={4} color="black" />
                ) : (
                  <>
                    Long {cateSymbol} {rangeMount}x
                  </>
                )}
              </YellowSolidButton>
            ) : (
              <ConnectWalletButton
                accountId={accountId}
                className="w-full h-[46px]"
                loading={buttonLoading}
              />
            )}
            {isLongConfirmModalOpen && (
              <ConfirmMobile
                open={isLongConfirmModalOpen}
                onClose={() => {
                  setIsLongConfirmModalOpen(false);
                  if (onMobileClose) onMobileClose();
                }}
                action="Long"
                setTradingLoading={setTradingLoading}
                confirmInfo={{
                  longInput,
                  longInputUsd,
                  longOutput,
                  longOutputUsd,
                  rangeMount,
                  estimateData,
                  longInputName: ReduxcategoryAssets2,
                  longOutputName: ReduxcategoryAssets1,
                  assets: isMainStream ? assets : assetsMEME,
                  tokenInAmount,
                  LiqPrice,
                  Fee,
                }}
              />
            )}
          </div>
        </div>
        <div className={`${activeTab === "short" ? "" : "hidden"}`}>
          <div className="relative bg-dark-600 border border-dark-50 pt-3 pb-2.5 pr-3 pl-2.5 rounded-md z-30">
            <input
              onChange={tokenChange}
              type="text"
              value={shortInput}
              placeholder="0"
              className="lg:max-w-[60%]"
            />
            <div className="absolute top-2 right-2">
              <TradingToken
                setMaxInputBanlance={setMaxInputBanlance}
                tokenList={isMainStream ? categoryAssets2 : categoryAssets2MEME}
                type="cate2"
                isMemeCategory={!isMainStream}
              />
            </div>
            <p className="text-gray-300 mt-2 text-xs">{beautifyPrice(shortInputUsd, true)}</p>
          </div>
          <div className="relative my-2.5 flex justify-end z-0 w-1/2" style={{ zoom: "2" }}>
            <ShrinkArrow />
          </div>
          <div className="relative bg-dark-600 border border-dark-50 pt-3 pb-2.5 pr-3 pl-2.5 rounded-md z-20">
            {/* short out */}
            <div>{shortOutput && beautifyPrice(Number(shortOutput))}</div>
            {/*  */}
            <div className="absolute top-2 right-2">
              <TradingToken
                tokenList={isMainStream ? categoryAssets1 : categoryAssets1MEME}
                type="cate1"
                isMemeCategory={!isMainStream}
              />
            </div>
            <p className="text-gray-300 mt-2 text-xs">{beautifyPrice(shortOutputUsd || 0, true)}</p>
          </div>
          <RangeSlider
            defaultValue={rangeMount}
            action="Short"
            setRangeMount={setRangeMount}
            baseTokenId={id}
          />
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
              <span>{beautifyPrice(LiqPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="text-gray-300">Fee</div>
              <div className="flex items-center justify-center relative">
                <p
                  className="border-b border-dashed border-dark-800 cursor-pointer"
                  onMouseEnter={() => setShowFeeModal(true)}
                  onMouseLeave={() => setShowFeeModal(false)}
                >
                  $
                  {beautifyPrice(
                    Number(
                      new Decimal(Fee.swapFee || 0)
                        .plus(Fee.openPFee || 0)
                        .plus(Fee.holdFee || 0)
                        .toNumber(),
                    ),
                  )}
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
                    <p>
                      <span className="mr-1 whitespace-nowrap">Funding Fee:</span>≈$
                      {beautifyPrice(Fee.holdFee)}/day
                    </p>
                  </div>
                )}
              </div>
            </div>
            {warnTip ? (
              <div className="text-[#EA3F68] text-sm font-normal flex items-start my-2.5">
                <MaxPositionIcon className="flex-shrink-0 mt-0.5" />
                <span className="ml-1">{warnTip}</span>
              </div>
            ) : null}
            {accountId ? (
              <RedSolidButton
                className="w-full"
                disabled={isDisabled || !!warnTip}
                onClick={handleConfirmButtonClick}
              >
                {buttonLoading ? (
                  <BeatLoader size={4} color="black" />
                ) : (
                  <>
                    Short {cateSymbol} {rangeMount}x
                  </>
                )}
              </RedSolidButton>
            ) : (
              <ConnectWalletButton
                accountId={accountId}
                className="w-full h-[46px]"
                isShort
                loading={buttonLoading}
              />
            )}
            {isShortConfirmModalOpen && (
              <ConfirmMobile
                open={isShortConfirmModalOpen}
                onClose={() => {
                  setIsShortConfirmModalOpen(false);
                  if (onMobileClose) onMobileClose();
                }}
                setTradingLoading={setTradingLoading}
                action="Short"
                confirmInfo={{
                  longInput: shortInput,
                  longInputUsd: shortInputUsd,
                  longOutput: shortOutput,
                  longOutputUsd: shortOutputUsd,
                  rangeMount,
                  estimateData,
                  longInputName: ReduxcategoryAssets2,
                  longOutputName: ReduxcategoryAssets1,
                  assets: isMainStream ? assets : assetsMEME,
                  tokenInAmount,
                  LiqPrice,
                  Fee,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingOperate;
