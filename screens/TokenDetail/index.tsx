import { useRouter } from "next/router";
import Decimal from "decimal.js";
import { useEffect, useState, createContext, useContext, useMemo } from "react";
import { Modal as MUIModal } from "@mui/material";
import { twMerge } from "tailwind-merge";
import { useBtcWalletSelector } from "btc-wallet";
import { LayoutBox } from "../../components/LayoutContainer/LayoutContainer";
import { updatePosition } from "../../redux/appSlice";
import { updatePosition as updatePositionMEME } from "../../redux/appSliceMEME";
import {
  SuppliedEmptyIcon,
  BorrowedEmptyIcon,
  REFIcon,
  CucoinIcon,
  BinanceIcon,
  RainbowIcon,
  RedLinearGradient,
  YellowLinearGradient,
  ModalCloseIcon,
  YellowBallIcon,
  OKXIon,
  GateIcon,
  CoinbaseIcon,
} from "./svg";
import { NewTagIcon } from "../Market/svg";
import { useAccountId, useAvailableAssets, usePortfolioAssets } from "../../hooks/hooks";
import {
  toInternationalCurrencySystem_number,
  toInternationalCurrencySystem_usd,
  format_apy,
  formatWithCommas_number,
  formatWithCommas_usd,
  isInvalid,
  digitalProcess,
} from "../../utils/uiNumber";
import { UIAsset } from "../../interfaces";
import { YellowSolidButton, RedSolidButton, YellowLineButton, RedLineButton } from "./button";
import { useAPY } from "../../hooks/useAPY";
import { useUserBalance } from "../../hooks/useUserBalance";
import { shrinkToken } from "../../store/helper";
import {
  useWithdrawTrigger,
  useAdjustTrigger,
  useSupplyTrigger,
  useBorrowTrigger,
  useRepayTrigger,
} from "../../components/Modal/components";
import { get_token_detail } from "../../api/get-markets";
import { isMobileDevice } from "../../helpers/helpers";
import { ConnectWalletButton } from "../../components/Header/WalletButton";
import { OuterLinkConfig } from "./config";
import { APYCell } from "../Market/APYCell";
import { RewardsV2 } from "../../components/Rewards";
import getConfig, {
  DEFAULT_POSITION,
  lpTokenPrefix,
  STABLE_POOL_IDS,
  NBTCTokenId,
} from "../../utils/config";
import InterestRateChart, { LabelText } from "./interestRateChart";
import TokenBorrowSuppliesChart from "./tokenBorrowSuppliesChart";
import { useTokenDetails } from "../../hooks/useTokenDetails";
import { IToken } from "../../interfaces/asset";
import LPTokenCell from "./LPTokenCell";
import AvailableBorrowCell from "./AvailableBorrowCell";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { isMemeCategory, getActiveCategory } from "../../redux/categorySelectors";
import { setActiveCategory } from "../../redux/marginTrading";
import { useBtcAction } from "../../hooks/useBtcBalance";
import { SatoshiIcon, BtcChainIcon, ThefaucetIcon } from "../../components/Icons/Icons";
import { getPageTypeFromUrl } from "../../utils/commonUtils";
import Breadcrumb from "../../components/common/breadcrumb";

const DetailData = createContext(null) as any;
const TokenDetail = () => {
  const dispatch = useAppDispatch();
  const isMeme = useAppSelector(isMemeCategory);
  const activeCategory = useAppSelector(getActiveCategory);
  const router = useRouter();
  const rows = useAvailableAssets();
  const { account, autoConnect } = useBtcWalletSelector();
  const { id } = router.query;
  const [updaterCounter, setUpDaterCounter] = useState(1);
  const tokenRow = rows.find((row: UIAsset) => {
    return row.tokenId === id;
  });
  const accountId = useAccountId();
  const selectedWalletId = window.selector?.store?.getState()?.selectedWalletId;
  const isNBTC = NBTCTokenId === id && selectedWalletId === "btc-wallet";
  useEffect(() => {
    const t = setInterval(() => {
      setUpDaterCounter((pre) => {
        return pre + 1;
      });
    }, 60000);
    if (!id || !isNBTC) {
      clearInterval(t);
    }
    return () => {
      clearInterval(t);
    };
  }, [isNBTC]);
  // connect btc wallet to get btc balance;
  useEffect(() => {
    if (accountId && isNBTC && !account) {
      autoConnect();
    }
  }, [isNBTC, account, accountId, selectedWalletId]);
  const pageType = getPageTypeFromUrl();
  const match = activeCategory == pageType;
  // update search params if no pageType on url
  useEffect(() => {
    if (id && !pageType) {
      const updatedQuery = { pageType: "main" };
      router.replace({
        pathname: `/tokenDetail/${id}`,
        query: updatedQuery,
      });
    }
  }, [id, pageType]);
  // update activeCategory if pageType do not match with cache
  useEffect(() => {
    if (pageType && activeCategory && id) {
      if (pageType !== activeCategory) {
        if (pageType == "meme") {
          dispatch(setActiveCategory("meme"));
        } else if (pageType == "main") {
          dispatch(setActiveCategory("main"));
        } else {
          router.replace({
            pathname: `/tokenDetail/${id}`,
            query: { pageType: "main" },
          });
          dispatch(setActiveCategory("main"));
        }
      }
    }
  }, [activeCategory, id, pageType]);
  if (!tokenRow || !match) return null;
  return <TokenDetailView tokenRow={tokenRow} assets={rows} isMeme={isMeme} />;
};

function TokenDetailView({
  tokenRow,
  assets,
  isMeme,
}: {
  tokenRow: UIAsset;
  assets: UIAsset[];
  isMeme: boolean;
}) {
  const [suppliers_number, set_suppliers_number] = useState<number>();
  const [borrowers_number, set_borrowers_number] = useState<number>();
  const isMobile = isMobileDevice();
  const router = useRouter();
  const { NATIVE_TOKENS, NEW_TOKENS } = getConfig() as any;
  const [depositAPY] = useAPY({
    baseAPY: tokenRow.supplyApy,
    rewards: tokenRow.depositRewards,
    tokenId: tokenRow.tokenId,
    page: "deposit",
    onlyMarket: true,
  });
  const [borrowAPY] = useAPY({
    baseAPY: tokenRow.borrowApy,
    rewards: tokenRow.borrowRewards,
    tokenId: tokenRow.tokenId,
    page: "borrow",
    onlyMarket: true,
  });
  const tokenDetails = useTokenDetails();
  const { fetchTokenDetails, changePeriodDisplay } = tokenDetails || {};
  const [suppliedRows, borrowedRows, , , borrowedLPRows] = usePortfolioAssets() as [
    any[],
    any[],
    number,
    number,
    Record<string, any[]>,
  ];
  const supplied = suppliedRows?.find((row) => {
    return row.tokenId === tokenRow.tokenId;
  });
  const borrowed = borrowedRows?.find((row) => {
    return row.tokenId === tokenRow.tokenId;
  });
  const borrowedLp = Object.keys(borrowedLPRows).reduce((acc, cur) => {
    const b = borrowedLPRows[cur]?.find((row) => {
      return row.tokenId === tokenRow.tokenId;
    });
    if (b) {
      return { ...acc, [cur]: b };
    }
    return acc;
  }, {});

  useEffect(() => {
    fetchTokenDetails(tokenRow.tokenId, 365).catch();
    get_token_detail(tokenRow.tokenId, isMeme).then((response) => {
      const { total_suppliers, total_borrowers } = response[0] || {};
      if (!isInvalid(total_suppliers)) {
        set_suppliers_number(total_suppliers);
      }
      if (!isInvalid(total_borrowers)) {
        set_borrowers_number(total_borrowers);
      }
    });
  }, []);

  const handlePeriodClick = async ({ borrowPeriod, supplyPeriod }) => {
    try {
      await changePeriodDisplay({ tokenId: tokenRow.tokenId, borrowPeriod, supplyPeriod });
    } catch (e) {
      console.error("err", e);
    }
  };

  const is_native = NATIVE_TOKENS?.includes(tokenRow.tokenId);
  const is_new = NEW_TOKENS?.includes(tokenRow.tokenId);
  function getIcons() {
    const { isLpToken, tokens } = tokenRow;
    return (
      <div className="flex items-center justify-center flex-wrap flex-shrink-0 xsm:w-[34px]">
        {isLpToken ? (
          tokens.map((token: IToken, index) => {
            if (isMobile) {
              return (
                <img
                  key={token.token_id}
                  src={token.metadata?.icon}
                  alt=""
                  className={`w-5 h-5 rounded-full relative ${
                    index !== 0 && index !== 2 ? "-ml-1.5" : ""
                  } ${index > 1 ? "-mt-1.5" : "z-10"}`}
                />
              );
            } else {
              return (
                <img
                  key={token.token_id}
                  src={token?.metadata?.icon}
                  alt=""
                  className={`w-6 h-6 rounded-full relative ${index !== 0 ? "-ml-1.5" : ""}`}
                />
              );
            }
          })
        ) : (
          <img src={tokenRow?.icon} className="w-9 h-9 xsm:w-7 xsm:h-7 rounded-full" alt="" />
        )}
      </div>
    );
  }
  function getSymbols() {
    const { isLpToken, tokens } = tokenRow;
    return (
      <div className="flex items-center flex-wrap flex-shrink-0 xsm:max-w-[160px] xsm:ml-2">
        {isLpToken ? (
          tokens.map((token: IToken, index) => {
            return (
              <span
                className="lg:text-[20px] text-white font-bold xsm:text-sm"
                key={token.token_id}
              >
                {token?.metadata?.symbol}
                {index === tokens.length - 1 ? "" : "-"}
                {index === tokens.length - 1 ? (
                  <span
                    style={{ zoom: 0.85 }}
                    className="text-gray-300 italic text-xs transform ml-1 -translate-y-0.5"
                  >
                    LP token
                  </span>
                ) : null}
              </span>
            );
          })
        ) : (
          <span className="text-[26px] text-white font-bold xsm:text-xl">
            {tokenRow?.symbol}
            {is_native ? (
              <span
                style={{ zoom: 0.85 }}
                className="text-gray-300 italic text-xs transform ml-1 -translate-y-0.5"
              >
                Native
              </span>
            ) : null}
          </span>
        )}
      </div>
    );
  }
  return (
    <DetailData.Provider
      value={{
        router,
        depositAPY,
        borrowAPY,
        supplied,
        borrowed,
        tokenRow,
        suppliers_number,
        borrowers_number,
        is_native,
        is_new,
        borrowedLp,
        assets,
        getIcons,
        getSymbols,
        isMeme,
      }}
    >
      {isMobile ? (
        <DetailMobile tokenDetails={tokenDetails} handlePeriodClick={handlePeriodClick} />
      ) : (
        <DetailPc tokenDetails={tokenDetails} handlePeriodClick={handlePeriodClick} />
      )}
    </DetailData.Provider>
  );
}

function DetailMobile({ tokenDetails, handlePeriodClick }) {
  const { router, is_new, tokenRow, getIcons, getSymbols } = useContext(DetailData) as any;
  const [activeTab, setActiveTab] = useState<"market" | "your">("market");
  const [open, setOpen] = useState<boolean>(false);

  function switchTab(tab) {
    setActiveTab(tab);
  }

  function openGetTokenModal() {
    setOpen(true);
  }
  function getPositionSymbols() {
    const { isLpToken, tokens } = tokenRow;
    if (isLpToken) {
      // return tokens?.reduce((acc, token: IToken, index) => {
      //   return `${acc}-${token?.metadata?.symbol}`;
      // }, "");
      return "LP Token";
    } else {
      return tokenRow?.symbol;
    }
  }
  const isMarket = activeTab === "market";
  const isYour = activeTab === "your";
  return (
    <LayoutBox>
      <div className="p-4">
        {/* Back */}
        <Breadcrumb path="/markets" title="Markets" />
        {/* Token head */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              {getIcons()}
              {is_new ? (
                <NewTagIcon
                  className={`absolute transform -translate-x-[1px] z-20 ${
                    tokenRow?.isLpToken && tokenRow?.tokens.length > 2 ? "-bottom-2.5" : "-bottom-2"
                  }`}
                />
              ) : null}
            </div>
            <div className="flex">{getSymbols()}</div>
          </div>
          <div
            onClick={openGetTokenModal}
            className="align-middle py-1 px-2.5 bg-gray-800 rounded-md text-sm text-primary"
          >
            Get {getPositionSymbols()}
          </div>
        </div>
        {/* Tab */}
        <div className="grid grid-cols-2 bg-gray-800 rounded-xl h-[42px] text-white text-base items-center justify-items-stretch mt-6 mb-6">
          <div className="relative flex items-center justify-center border-r border-dark-50">
            <span
              onClick={() => {
                switchTab("market");
              }}
              className={`relative z-10 text-center ${isMarket ? "text-primary" : ""}`}
            >
              Market Info
            </span>
            <div
              className={`absolute top-1 flex items-center justify-center ${
                isMarket ? "" : "hidden"
              }`}
            >
              <span className="flex w-10 h-10 bg-gray-800" style={{ borderRadius: "50%" }} />
              <YellowBallIcon className="absolute top-6" />
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <span
              onClick={() => {
                switchTab("your");
              }}
              className={`relative z-10 text-center ${isYour ? "text-primary" : ""}`}
            >
              Your Info
            </span>
            <div
              className={`absolute top-1 flex items-center justify-center ${
                isYour ? "" : "hidden"
              }`}
            >
              <span className="flex w-10 h-10 bg-gray-800" style={{ borderRadius: "50%" }} />
              <YellowBallIcon className="absolute top-6" id="1019" />
            </div>
          </div>
        </div>
        {/* Tab content */}
        <MarketInfo
          className={`${isMarket ? "" : "hidden"}`}
          tokenDetails={tokenDetails}
          handlePeriodClick={handlePeriodClick}
        />
        <YourInfo className={`${isYour ? "" : "hidden"}`} />
        {/* Get token  modal */}
        <TokenFetchModal open={open} setOpen={setOpen} />
      </div>
    </LayoutBox>
  );
}

function TokenFetchModal({ open, setOpen }: { open: boolean; setOpen: any }) {
  const { tokenRow } = useContext(DetailData) as any;

  function handleClose() {
    setOpen(false);
  }

  return (
    <MUIModal open={open} onClose={handleClose}>
      <div className="absolute bottom-0 left-0 bg-dark-100 w-full rounded-t-2xl border border-dark-50 p-4 outline-none">
        {/* Head */}
        <div className="flex items-center justify-between">
          <span className="text-base text-white font-bold">Get {tokenRow.symbol}</span>
          <ModalCloseIcon onClick={handleClose} />
        </div>
        {/* Content */}
        <OuterLink />
      </div>
    </MUIModal>
  );
}

function MarketInfo({ className, tokenDetails, handlePeriodClick }) {
  const { interestRates } = tokenDetails || {};
  const { tokenRow } = useContext(DetailData) as any;

  return (
    <div className={`grid grid-cols-1 gap-y-4 ${className}`}>
      <TokenOverviewMobile />
      <TokenSupplyChart tokenDetails={tokenDetails} handlePeriodClick={handlePeriodClick} />
      {tokenRow.can_borrow && (
        <>
          <TokenBorrowChart tokenDetails={tokenDetails} handlePeriodClick={handlePeriodClick} />
          <TokenRateModeChart interestRates={interestRates} tokenRow={tokenRow} />
        </>
      )}
    </div>
  );
}

function YourInfo({ className }) {
  const { supplied, borrowed, tokenRow } = useContext(DetailData) as any;
  return (
    <div className={`${className}`}>
      <TokenUserInfo />
      <YouSupplied />
      {tokenRow.can_borrow && <YouBorrowed />}
    </div>
  );
}

function DetailPc({ tokenDetails, handlePeriodClick }) {
  const { interestRates } = tokenDetails || {};
  const { router, supplied, borrowed, tokenRow } = useContext(DetailData) as any;

  return (
    <LayoutBox>
      <Breadcrumb title="Burrow Markets" path="/markets" />
      <div className="grid grid-cols-3/5">
        <div className="mr-6">
          <TokenOverview />
          <TokenSupplyChart tokenDetails={tokenDetails} handlePeriodClick={handlePeriodClick} />
          {tokenRow.can_borrow && (
            <>
              <TokenBorrowChart tokenDetails={tokenDetails} handlePeriodClick={handlePeriodClick} />
              <TokenRateModeChart interestRates={interestRates} />
            </>
          )}
        </div>
        <div>
          <TokenUserInfo />
          <YouSupplied />
          {tokenRow.can_borrow && <YouBorrowed />}
          <OuterLink />
        </div>
      </div>
    </LayoutBox>
  );
}

function TokenOverviewMobile() {
  const { tokenRow, suppliers_number, borrowers_number, assets } = useContext(DetailData) as any;
  let isLpToken = false;
  if (tokenRow?.tokenId?.indexOf(lpTokenPrefix) > -1) {
    isLpToken = true;
  }
  return (
    <div className="border border-dark-50  grid grid-cols-1 gap-y-5 bg-dark-110 rounded-2xl p-4">
      <LabelMobile
        title="Supply Cap"
        value={toInternationalCurrencySystem_number(tokenRow?.totalSupply)}
        subValue={toInternationalCurrencySystem_usd(tokenRow?.totalSupplyMoney)}
      />
      <LabelMobile
        title="Borrow Cap"
        value={toInternationalCurrencySystem_number(
          !tokenRow?.can_borrow ? "" : tokenRow?.totalBorrowed,
        )}
        subValue={
          tokenRow?.can_borrow
            ? toInternationalCurrencySystem_usd(tokenRow?.totalBorrowedMoney)
            : ""
        }
        hidden={isLpToken}
      />
      <LabelMobileAPY title="Supply APY" tokenRow={tokenRow} isMeme={isMemeCategory} />
      <LabelMobile
        title="Borrow APY"
        value={!tokenRow?.can_borrow ? "-" : format_apy(tokenRow?.borrowApy)}
        hidden={isLpToken}
      />
      <LabelMobile
        title="Available Liquidity"
        value={
          tokenRow?.can_borrow
            ? toInternationalCurrencySystem_number(tokenRow?.availableLiquidity)
            : "-"
        }
        subValue={
          tokenRow?.can_borrow
            ? toInternationalCurrencySystem_usd(tokenRow?.availableLiquidityMoney)
            : ""
        }
        hidden={isLpToken}
      />
      <LabelMobile title="# of suppliers" value={formatWithCommas_number(suppliers_number, 0)} />
      <LabelMobile
        title="# of borrowers"
        value={!tokenRow?.can_borrow ? "-" : formatWithCommas_number(borrowers_number, 0)}
        hidden={isLpToken}
      />
      <LabelMobile title="Price" value={formatWithCommas_usd(tokenRow?.price)} />
      {tokenRow?.tokens?.map((token) => {
        const { token_id, price, amount, metadata } = token;
        const asset = assets.find((a) => a.tokenId === token_id);
        function getTotalSupply() {
          return toInternationalCurrencySystem_number(
            new Decimal(tokenRow?.totalSupply || 0).mul(shrinkToken(amount, metadata.decimals)),
          );
        }
        function getTotalSupplyMoney() {
          return toInternationalCurrencySystem_usd(
            new Decimal(tokenRow?.totalSupply || 0)
              .mul(shrinkToken(amount, metadata.decimals))
              .mul(price.usd || 0),
          );
        }
        return (
          <LabelMobile
            key={`mobile-${token_id}`}
            title={asset?.symbol}
            value={getTotalSupply()}
            subValue={getTotalSupplyMoney()}
          />
        );
      })}
    </div>
  );
}

function TokenOverview() {
  const {
    suppliers_number,
    borrowers_number,
    tokenRow,
    borrowAPY,
    is_new,
    getIcons,
    getSymbols,
    assets,
    isMeme,
  } = useContext(DetailData) as any;
  let isLpToken = false;
  if (tokenRow?.tokenId?.indexOf(lpTokenPrefix) > -1) {
    isLpToken = true;
  }
  return (
    <Box className="mb-7">
      <div className="flex items-center">
        <div className="relative flex flex-col items-center">
          {getIcons()}
          {is_new ? <NewTagIcon className="transform -translate-y-0.5 z-10" /> : null}
        </div>
        <div className="flex flex-col ml-3">
          <div className="flex">{getSymbols()}</div>
          <span className="text-xs text-gray-300 transform -translate-y-1.5">
            {formatWithCommas_usd(tokenRow?.price)}
          </span>
        </div>
      </div>
      {isLpToken ? (
        <>
          <div className="grid grid-cols-3 mt-4 gap-x-10">
            <div className="flex flex-col">
              <span className="text-sm text-gray-300 whitespace-nowrap">Supply Cap</span>
              <div className="flex items-center">
                <span className="text-[26px] text-white font-bold">
                  {toInternationalCurrencySystem_number(tokenRow?.totalSupply)}
                </span>
                <span className="text-sm text-gray-300 ml-1 relative top-0.5">
                  {toInternationalCurrencySystem_usd(tokenRow?.totalSupplyMoney)}
                </span>
              </div>
            </div>
            <div className="flex flex-col w-1/4">
              <span className="text-sm text-gray-300 whitespace-nowrap">Supply APY</span>
              <div className="flex items-center text-[26px]">
                <APYCell
                  rewards={tokenRow.depositRewards}
                  baseAPY={tokenRow.supplyApy}
                  page="deposit"
                  tokenId={tokenRow.tokenId}
                  onlyMarket
                  memeCategory={isMeme}
                />
              </div>
            </div>
            <div className="flex flex-col ">
              <span className="text-sm text-gray-300 whitespace-nowrap"># of suppliers</span>
              <div className="flex items-center">
                <span className="text-[26px] text-white font-bold">
                  {formatWithCommas_number(suppliers_number, 0)}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 mt-5 gap-x-10">
            {tokenRow?.tokens?.map((token) => {
              const { token_id, price, amount, metadata } = token;
              const asset = assets.find((a) => a.tokenId === token_id);
              function getTotalSupply() {
                return toInternationalCurrencySystem_number(
                  new Decimal(tokenRow?.totalSupply || 0).mul(
                    shrinkToken(amount, metadata.decimals),
                  ),
                );
              }
              function getTotalSupplyMoney() {
                return toInternationalCurrencySystem_usd(
                  new Decimal(tokenRow?.totalSupply || 0)
                    .mul(shrinkToken(amount, metadata.decimals))
                    .mul(price.usd || 0),
                );
              }

              return (
                <div key={token.token_id} className="flex flex-col">
                  <span className="text-sm text-gray-300 whitespace-nowrap">{asset?.symbol}</span>
                  <div className="flex items-center">
                    <span className="text-[18px] text-white font-bold">{getTotalSupply()}</span>
                    <span className="text-sm text-gray-300 ml-1 relative top-0.5">
                      {getTotalSupplyMoney()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 mt-4 gap-x-10">
            <div className="flex flex-col">
              <span className="text-sm text-gray-300 whitespace-nowrap">Supply Cap</span>
              <div className="flex items-center">
                <span className="text-[26px] text-white font-bold">
                  {toInternationalCurrencySystem_number(tokenRow?.totalSupply)}
                </span>
                <span className="text-sm text-gray-300 ml-1 relative top-0.5">
                  {toInternationalCurrencySystem_usd(tokenRow?.totalSupplyMoney)}
                </span>
              </div>
            </div>
            <div className="flex flex-col ">
              <span className="text-sm text-gray-300 whitespace-nowrap">Borrow Cap</span>
              <div className="flex items-center">
                {!tokenRow?.can_borrow ? (
                  "-"
                ) : (
                  <>
                    <span className="text-[26px] text-white font-bold">
                      {toInternationalCurrencySystem_number(tokenRow?.totalBorrowed)}
                    </span>
                    <span className="text-sm text-gray-300 ml-1 relative top-0.5">
                      {toInternationalCurrencySystem_usd(tokenRow?.totalBorrowedMoney)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col ">
              <span className="text-sm text-gray-300 whitespace-nowrap">Available Liquidity</span>
              <div className="flex items-center">
                {tokenRow?.can_borrow ? (
                  <>
                    <span className="text-[26px] text-white font-bold">
                      {toInternationalCurrencySystem_number(tokenRow?.availableLiquidity)}
                    </span>
                    <span className="text-sm text-gray-300 ml-1 relative top-0.5">
                      {toInternationalCurrencySystem_usd(tokenRow?.availableLiquidityMoney)}
                    </span>
                  </>
                ) : (
                  <>-</>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 mt-5 gap-x-10">
            <div className="flex flex-col w-1/4">
              <span className="text-sm text-gray-300 whitespace-nowrap">Supply APY</span>
              <div className="flex items-center">
                <APYCell
                  rewards={tokenRow.depositRewards}
                  baseAPY={tokenRow.supplyApy}
                  page="deposit"
                  tokenId={tokenRow.tokenId}
                  onlyMarket
                  memeCategory={isMeme}
                />
              </div>
            </div>
            <div className="flex flex-col w-1/4">
              <span className="text-sm text-gray-300 whitespace-nowrap">Borrow APY</span>
              <div className="flex items-center">
                <span className="text-lg text-white font-bold">
                  {!tokenRow?.can_borrow ? "-" : format_apy(borrowAPY)}
                </span>
              </div>
            </div>
            <div className="flex flex-col ">
              <span className="text-sm text-gray-300 whitespace-nowrap"># of suppliers</span>
              <div className="flex items-center">
                <span className="text-lg text-white font-bold">
                  {formatWithCommas_number(suppliers_number, 0)}
                </span>
              </div>
            </div>
            <div className="flex flex-col ">
              <span className="text-sm text-gray-300 whitespace-nowrap"># of borrowers</span>
              <div className="flex items-center">
                <span className="text-lg text-white font-bold">
                  {!tokenRow?.can_borrow ? "-" : formatWithCommas_number(borrowers_number, 0)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </Box>
  );
}

function TokenSupplyChart({ tokenDetails, handlePeriodClick }) {
  const { tokenSupplyDays, supplyAnimating } = tokenDetails || {};
  const { tokenRow, depositAPY, isMeme } = useContext(DetailData) as any;
  const value = toInternationalCurrencySystem_number(tokenRow?.totalSupply);
  const value_value = toInternationalCurrencySystem_usd(tokenRow?.totalSupplyMoney);
  const apy = format_apy(depositAPY);

  return (
    <div className="lg:mb-1.5 lg:rounded-md lg:p-7 xsm:rounded-2xl bg-gray-800 xsm:p-4">
      <div className="font-bold text-lg text-white mb-5">Supply Info</div>
      {/* only pc */}
      <div className="flex items-stretch xsm:hidden">
        <div className="flex flex-col">
          <span className="text-sm text-gray-300">Total Supplied</span>
          <div className="flex items-center">
            <span className="font-bold text-lg text-white">{value}</span>
            <span className="text-xs text-gray-300 relative top-0.5 ml-1.5">{value_value}</span>
          </div>
        </div>
        <div className="flex flex-col ml-10">
          <span className="text-sm text-gray-300">APY</span>
          <span className="font-bold text-lg text-white">
            <APYCell
              rewards={tokenRow.depositRewards}
              baseAPY={tokenRow.supplyApy}
              page="deposit"
              tokenId={tokenRow.tokenId}
              onlyMarket
              memeCategory={isMeme}
            />
          </span>
        </div>
        <div className="flex flex-col justify-between ml-10">
          <span className="text-sm text-gray-300">Rewards/day</span>
          <span className="font-bold text-lg text-white">
            <RewardsV2
              rewards={tokenRow.depositRewards}
              layout="horizontal"
              page="deposit"
              tokenId={tokenRow.tokenId}
            />
          </span>
        </div>
      </div>
      {/* only mobile */}
      <div className="grid grid-cols-1 gap-y-4 lg:hidden">
        <LabelMobile title="Total Supplied" value={value} subValue={value_value} subMode="space" />
        <LabelMobileAPY title="APY" tokenRow={tokenRow} isMeme={isMeme} />
        <LabelMobile
          title="Rewards/day"
          value={
            <RewardsV2
              rewards={tokenRow.depositRewards}
              layout="horizontal"
              page="deposit"
              tokenId={tokenRow.tokenId}
            />
          }
        />
      </div>
      <HrLine />
      <div className="mt-8 xsm:-ml-5">
        <TokenBorrowSuppliesChart
          tokenRow={tokenRow}
          data={tokenSupplyDays}
          xKey="dayDate"
          yKey="tokenSupplyApy"
          disableControl={supplyAnimating}
          onPeriodClick={(v) => handlePeriodClick({ supplyPeriod: v })}
        />
      </div>
    </div>
  );
}

const HrLine = () => <hr className="hidden mt-6 mb-6 h-px my-8 bg-dark-50 border-0 xsm:block" />;

function TokenBorrowChart({ tokenDetails, handlePeriodClick }) {
  const { tokenBorrowDays, borrowAnimating } = tokenDetails || {};
  const { tokenRow, borrowAPY } = useContext(DetailData) as any;
  const value = toInternationalCurrencySystem_number(tokenRow?.totalBorrowed);
  const value_value = toInternationalCurrencySystem_usd(tokenRow?.totalBorrowedMoney);
  const apy = format_apy(borrowAPY);
  return (
    <div className="lg:mb-1.5 lg:rounded-md lg:p-7 xsm:rounded-2xl bg-gray-800 xsm:p-4">
      <div className="font-bold text-lg text-white mb-5">Borrow Info</div>
      {/* only pc */}
      <div className="flex items-stretch xsm:hidden">
        <div className="flex flex-col">
          <span className="text-sm text-gray-300">Total Borrowed</span>
          <div className="flex items-center">
            <span className="font-bold text-lg text-white">
              {toInternationalCurrencySystem_number(tokenRow?.totalBorrowed)}
            </span>
            <span className="text-xs text-gray-300 relative top-0.5 ml-1.5">
              {toInternationalCurrencySystem_usd(tokenRow?.totalBorrowedMoney)}
            </span>
          </div>
        </div>
        <div className="flex flex-col ml-10">
          <span className="text-sm text-gray-300">APY</span>
          <span className="font-bold text-lg text-white">{apy}</span>
        </div>
      </div>
      {/* only mobile */}
      <div className="grid grid-cols-1 gap-y-4 lg:hidden">
        <LabelMobile title="Total Borrowed" value={value} subValue={value_value} subMode="space" />
        <LabelMobile title="APY" value={apy} />
      </div>
      <HrLine />
      <div className="mt-8 xsm:-ml-5">
        <TokenBorrowSuppliesChart
          disableControl={borrowAnimating}
          data={tokenBorrowDays}
          xKey="dayDate"
          yKey="tokenBorrowApy"
          isBorrow
          onPeriodClick={(v) => handlePeriodClick({ borrowPeriod: v })}
        />
      </div>
    </div>
  );
}

function TokenRateModeChart({
  interestRates,
  tokenRow,
}: {
  interestRates: Array<any>;
  tokenRow?: any;
}) {
  const { currentUtilRate } = interestRates?.[0] || {};
  const { borrowApy, supplyApy } = tokenRow || {};
  return (
    <div className="lg:mb-1.5 lg:rounded-md lg:p-7 xsm:rounded-2xl bg-gray-800 xsm:p-4">
      <div className="font-bold text-lg text-white mb-5">Interest Rate Mode</div>

      <div className="grid grid-cols-1 gap-y-4 mb-6 hidden xsm2:block">
        <LabelText
          left="Current Utilization"
          leftIcon={<div className="bg-gray-400 mr-2 h-[2px] w-[10px]" />}
          right={currentUtilRate ? `${currentUtilRate.toFixed(2)}%` : "-"}
        />
        <LabelText
          left="Borrow Rate"
          leftIcon={<div className="rounded-full mr-2 bg-orange h-[10px] w-[10px]" />}
          right={borrowApy ? `${borrowApy.toFixed(2)}%` : "-"}
        />
        <LabelText
          left="Supply Rate"
          leftIcon={<div className="rounded-full mr-2 bg-primary h-[10px] w-[10px]" />}
          right={supplyApy ? `${supplyApy.toFixed(2)}%` : "-"}
        />
      </div>
      <HrLine />
      <div className="flex items-center justify-center h-[300px] xsm2:-ml-4">
        <InterestRateChart data={interestRates} />
        {/* <span className="text-sm text-gray-300 text-opacity-50">Chart is coming soon</span> */}
      </div>
    </div>
  );
}

function TokenUserInfo() {
  const { tokenRow } = useContext(DetailData) as any;
  const { availableBalance: btcAvailableBalance } = useBtcAction({
    tokenId: tokenRow?.tokenId || "",
    decimals: tokenRow?.decimals || 0,
  });
  const { tokenId, tokens, isLpToken, price } = tokenRow;
  const accountId = useAccountId();
  const isMeme = useAppSelector(isMemeCategory);
  const isWrappedNear = tokenRow.symbol === "NEAR";
  const { supplyBalance, maxBorrowAmountPositions } = useUserBalance(tokenId, isWrappedNear);
  const handleSupplyClick = useSupplyTrigger(tokenId);
  const handleBorrowClick = useBorrowTrigger(tokenId);
  const dispatch = useAppDispatch();
  const isBtc = tokenId === NBTCTokenId;
  function getIcons() {
    return (
      <div className="flex items-center justify-center flex-wrap flex-shrink-0">
        {isLpToken ? (
          tokens.map((token: IToken, index) => {
            return (
              <img
                key={token.token_id}
                src={token?.metadata?.icon}
                alt=""
                className={`w-5 h-5 rounded-full relative ${index !== 0 ? "-ml-1.5" : ""}`}
              />
            );
          })
        ) : (
          <img src={tokenRow?.icon} className="w-5 h-5 rounded-full" alt="" />
        )}
      </div>
    );
  }
  function getUserLpUsd() {
    return accountId
      ? `$${digitalProcess(new Decimal(supplyBalance || 0).mul(price || 0).toFixed(), 2)}`
      : "-";
  }
  const totalBorrowAmount = Object.values(maxBorrowAmountPositions)?.reduce(
    (acc, { maxBorrowAmount }) => acc + maxBorrowAmount,
    0,
  );
  const selectedWalletId = window.selector?.store?.getState()?.selectedWalletId;
  const isNBTC = NBTCTokenId === tokenId && selectedWalletId === "btc-wallet";
  return (
    <UserBox className="mb-[29px] xsm:mb-2.5">
      <div className="flex justify-between items-center">
        <span className="text-lg text-white font-bold">Your Info</span>
        {isNBTC ? (
          <span className="flex items-center">
            <span
              className="text-gray-300 text-xs hover:cursor-pointer underline mr-[4px]"
              onClick={() => {
                window.open("https://faucet.bitvmcn.xyz/", "_blank");
              }}
            >
              Claim WBTC
            </span>
            <ThefaucetIcon />
          </span>
        ) : null}
      </div>
      {!isNBTC ? (
        <div className="flex items-center justify-between my-[25px]">
          <span className="text-sm text-gray-300">Available to Supply</span>
          <div className="flex items-center]">
            <span className="text-sm text-white mr-2.5">
              {accountId ? formatWithCommas_number(supplyBalance) : "-"}
            </span>
            <LPTokenCell asset={tokenRow} balance={supplyBalance}>
              {getIcons()}
            </LPTokenCell>
          </div>
        </div>
      ) : (
        <div className="my-[25px]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Available to Supply</span>
            <span className="flex items-center">
              <span
                className="text-toolTipBoxBorderColor text-xs hover:cursor-pointer underline mr-[4px]"
                onClick={() => {
                  window.open("https://ramp.satos.network/", "_blank");
                }}
              >
                BTC Bridge
              </span>
              <SatoshiIcon />
            </span>
          </div>
          {/* <div className="text-xs flex items-center justify-between h-[42px] p-[14px] bg-dark-100 rounded-md mt-[11px]">
            <span className="text-gray-300">NEAR Chain</span>
            <span className="flex items-center">
              <span className="mr-[6px] text-sm">{accountId ? supplyBalance : "-"}</span>
              <BtcChainIcon />
            </span>
          </div> */}
          <div className="text-xs flex items-center justify-between h-[42px] p-[14px] bg-dark-100 rounded-md mt-[11px]">
            <span className="text-gray-300">BTC Chain</span>
            <span className="flex items-center">
              <span className="mr-[6px] text-sm">
                {accountId ? digitalProcess(btcAvailableBalance || 0, 8) : "-"}
              </span>
              <BtcChainIcon />
            </span>
          </div>
        </div>
      )}
      <div
        className={`flex justify-between ${
          !isLpToken && accountId && tokenRow?.can_borrow ? "items-start" : "items-center "
        }`}
      >
        {isLpToken ? (
          <>
            <span className="text-sm text-gray-300">USD Value</span>
            <div>{getUserLpUsd()}</div>
          </>
        ) : (
          <>
            <span className="text-sm text-gray-300">Available to Borrow</span>
            {accountId && tokenRow?.can_borrow && Object.keys(maxBorrowAmountPositions).length ? (
              <div className="flex flex-col items-end gap-2">
                {Object.entries(maxBorrowAmountPositions).map(([position, { maxBorrowAmount }]) => {
                  return (
                    <AvailableBorrowCell
                      key={position}
                      asset={tokenRow}
                      borrowData={[position, maxBorrowAmount]}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center">
                <span className="text-sm text-white mr-2.5">
                  {accountId && tokenRow?.can_borrow ? "0" : "-"}
                </span>
                <img src={tokenRow?.icon} className="w-5 h-5 rounded-full" alt="" />
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-2 mt-[35px]">
        {accountId ? (
          <>
            <YellowSolidButton
              disabled={isBtc ? !+btcAvailableBalance : !+supplyBalance}
              className="w-1 flex-grow"
              onClick={handleSupplyClick}
            >
              Supply
            </YellowSolidButton>
            {tokenRow?.can_borrow && (
              <RedSolidButton
                disabled={!+totalBorrowAmount}
                className="w-1 flex-grow"
                onClick={() => {
                  handleBorrowClick();
                  if (isMeme) {
                    dispatch(updatePositionMEME({ position: DEFAULT_POSITION }));
                  } else {
                    dispatch(updatePosition({ position: DEFAULT_POSITION }));
                  }
                }}
              >
                Borrow
              </RedSolidButton>
            )}
          </>
        ) : (
          <ConnectWalletButton accountId={accountId} className="w-full" />
        )}
      </div>
    </UserBox>
  );
}

function YouSupplied() {
  const { tokenRow, supplied } = useContext(DetailData) as any;
  const { tokenId } = tokenRow;
  const accountId = useAccountId();
  const [icons, totalDailyRewardsMoney] = supplied?.rewards?.reduce(
    (acc, cur) => {
      const { rewards, metadata, config, price } = cur;
      const { icon, decimals } = metadata;
      const dailyRewards = Number(
        shrinkToken(rewards.reward_per_day || 0, decimals + config.extra_decimals),
      );
      acc[1] = new Decimal(acc[1]).plus(dailyRewards * price).toNumber();
      acc[0].push(icon);
      return acc;
    },
    [[], 0],
  ) || [[], 0];
  const handleWithdrawClick = useWithdrawTrigger(tokenId);
  const handleAdjustClick = useAdjustTrigger(tokenId);
  const withdraw_disabled = !supplied || !supplied?.canWithdraw;
  const adjust_disabled = !supplied?.canUseAsCollateral;
  const is_empty = !supplied;
  return (
    <div className=" relative overflow-hidden">
      {is_empty ? (
        <UserBox className="mb-2.5">
          <div className="flex items-start justify-between  pb-2.5 -mx-5 px-5">
            <span className="text-lg text-white font-bold">You Supplied</span>
          </div>
          <div className="flex items-center justify-center py-5">
            <SuppliedEmptyIcon />
          </div>
          <div className="flex items-center justify-center text-base text-gray-300 mb-4 text-opacity-50">
            Your suppling will appear here
          </div>
        </UserBox>
      ) : (
        <UserBox className="mb-2.5">
          <div className="flex items-start justify-between  pb-2.5 -mx-5 px-5">
            <span className="text-lg text-white font-bold">You Supplied</span>
            <div className="flex flex-col items-end">
              <span className="text-lg text-white font-bold">
                {formatWithCommas_number(supplied?.supplied)}
              </span>
              <span className="text-xs text-gray-300">
                {supplied
                  ? formatWithCommas_usd(
                      new Decimal(supplied?.supplied || 0).mul(supplied?.price || 0).toFixed(),
                    )
                  : "$-"}
              </span>
            </div>
          </div>
          <Label title="Collateral" content={formatWithCommas_number(supplied?.collateral)} />
          <div className="flex items-center justify-between gap-2 mt-[35px]">
            <YellowLineButton
              disabled={withdraw_disabled}
              className="w-1 flex-grow"
              onClick={handleWithdrawClick}
            >
              Withdraw
            </YellowLineButton>
            {tokenRow.canUseAsCollateral && (
              <YellowSolidButton
                disabled={adjust_disabled}
                className="w-1 flex-grow"
                onClick={handleAdjustClick}
              >
                Adjust
              </YellowSolidButton>
            )}
          </div>
        </UserBox>
      )}
      <YellowLinearGradient className="absolute left-0 top-0 pointer-events-none" />
    </div>
  );
}

function YouBorrowed() {
  const { tokenRow, borrowed, borrowedLp, assets } = useContext(DetailData) as any;
  const { tokenId } = tokenRow;
  const isMeme = useAppSelector(isMemeCategory);
  const [icons, totalDailyRewardsMoney] = borrowed?.rewards?.reduce(
    (acc, cur) => {
      const { rewards, metadata, config, price } = cur;
      const { icon, decimals } = metadata;
      const dailyRewards = Number(
        shrinkToken(rewards.reward_per_day || 0, decimals + config.extra_decimals),
      );
      acc[1] = new Decimal(acc[1]).plus(dailyRewards * price).toNumber();
      acc[0].push(icon);
      return acc;
    },
    [[], 0],
  ) || [[], 0];
  const dispatch = useAppDispatch();
  const handleRepayClick = useRepayTrigger(tokenId);
  const is_empty = !borrowed && !Object.keys(borrowedLp).length;
  const borrowedList = { ...borrowedLp };
  if (borrowed) {
    borrowedList[DEFAULT_POSITION] = borrowed;
  }
  const totalBorrowedAmount = useMemo(() => {
    return Object.values(borrowedList).reduce((acc, b: any) => acc + b.borrowed || 0, 0);
  }, [borrowedList]) as number;
  function getName(position) {
    if (position === DEFAULT_POSITION) return "(Standard Token as collateral)";
    const a = assets.find((asset: UIAsset) => asset.tokenId === position);
    const symbols = a.tokens.reduce(
      (acc, cur, index) =>
        acc + (cur.metadata?.symbol || "") + (index !== a.tokens.length - 1 ? "-" : ""),
      "",
    );
    return `(${symbols} as collateral)`;
  }
  function getRewardsReactNode(position) {
    const b = borrowedList[position];
    let positionDailyRewardsMoney = "0";
    if (totalBorrowedAmount > 0) {
      positionDailyRewardsMoney = new Decimal(b.borrowed)
        .div(totalBorrowedAmount)
        .mul(totalDailyRewardsMoney)
        .toFixed();
    }
    const RewardsReactNode = b?.rewards?.length ? (
      <div className="flex items-center">
        {icons.map((icon, index) => {
          return <img key={index} src={icon} className="w-4 h-4 rounded-full -ml-0.5" alt="" />;
        })}
        <span className="ml-2">{formatWithCommas_usd(totalDailyRewardsMoney)}</span>
      </div>
    ) : (
      "-"
    );
    return RewardsReactNode;
  }
  return (
    <div className="relative overflow-hidden">
      {is_empty ? (
        <UserBox className="mb-2.5">
          <div className="flex items-start justify-between  pb-2.5 -mx-5 px-5">
            <span className="text-lg text-white font-bold">You Borrowed</span>
          </div>
          <div className="flex items-center justify-center py-5">
            <BorrowedEmptyIcon />
          </div>
          <div className="flex items-center justify-center text-base text-gray-300 mb-4 text-opacity-50">
            Your borrowing will appear here
          </div>
        </UserBox>
      ) : (
        <UserBox className="mb-2.5">
          <div className="flex items-start justify-between  pb-2.5 -mx-5 px-5">
            <span className="text-lg text-white font-bold">You Borrowed</span>
            <div className="flex flex-col items-end">
              <span className="text-lg text-white font-bold">
                {digitalProcess(totalBorrowedAmount, 2)}
              </span>
              <span className="text-xs text-gray-300">
                {formatWithCommas_usd(
                  new Decimal(totalBorrowedAmount).mul(tokenRow?.price || 0).toFixed(),
                )}
              </span>
            </div>
          </div>
          {Object.entries(borrowedList).map(([position, borrowedData]: [string, any]) => (
            <div key={position}>
              <Label
                title="Borrowed"
                subTitle={`${getName(position)}`}
                content={
                  <div className="flex items-center">
                    <span className="text-sm text-white mr-0.5">
                      {formatWithCommas_number(borrowedData?.borrowed || 0)}
                    </span>
                    <span className="text-xs text-gray-300">
                      (
                      {formatWithCommas_usd(
                        new Decimal(borrowedData?.borrowed || 0)
                          .mul(borrowedData?.price || 0)
                          .toFixed(),
                      )}
                      )
                    </span>
                  </div>
                }
              />
              <Label
                title="Your APY"
                content={
                  <APYCell
                    rewards={tokenRow.borrowRewards}
                    baseAPY={tokenRow.borrowApy}
                    page="borrow"
                    tokenId={tokenRow.tokenId}
                  />
                }
              />
              <Label title="Daily rewards" content={getRewardsReactNode(position)} />
              <div className="flex items-center justify-between gap-2 mt-[35px]">
                <RedLineButton
                  className="w-1 flex-grow"
                  onClick={() => {
                    handleRepayClick();
                    if (isMeme) {
                      dispatch(updatePositionMEME({ position }));
                    } else {
                      dispatch(updatePosition({ position }));
                    }
                  }}
                >
                  Repay
                </RedLineButton>
              </div>
            </div>
          ))}
        </UserBox>
      )}
      <RedLinearGradient className="absolute left-0 top-0 pointer-events-none" />
    </div>
  );
}

function OuterLink() {
  const { tokenRow } = useContext(DetailData) as any;
  const { symbol, isLpToken, tokenId } = tokenRow;
  return (
    <div className="mt-7 outline-none">
      {!isLpToken && (
        <LabelOuterLink
          title="Acquire token from"
          content={
            <LabelOuterLinkIcon>
              <REFIcon
                key="1"
                className="lg:opacity-60 lg:hover:opacity-100"
                onClick={() => {
                  window.open("https://dex.rhea.finance/");
                }}
              />
            </LabelOuterLinkIcon>
          }
        />
      )}
      {isLpToken && (
        <LabelOuterLink
          title="Acquire LP token from"
          content={
            <LabelOuterLinkIcon>
              <REFIcon
                key="1"
                className="lg:opacity-60 lg:hover:opacity-100"
                onClick={() => {
                  const pool_id = tokenId.split("-")[1];
                  const is_stable_pool = STABLE_POOL_IDS.includes(pool_id);
                  if (is_stable_pool) {
                    window.open(`https://dex.rhea.finance/sauce/${pool_id}`);
                  } else {
                    window.open(`https://dex.rhea.finance/pool/${pool_id}`);
                  }
                }}
              />
            </LabelOuterLinkIcon>
          }
        />
      )}
      {OuterLinkConfig[symbol] && (
        <LabelOuterLink
          title="Deposit from"
          className="items-start"
          content={
            <div className="flex flex-col gap-1.5">
              <div
                className={`flex items-center justify-end gap-1.5 ${
                  !OuterLinkConfig[symbol]?.kucoin && !OuterLinkConfig[symbol]?.binance
                    ? "hidden"
                    : ""
                }`}
              >
                {OuterLinkConfig[symbol]?.kucoin && (
                  <LabelOuterLinkIcon>
                    <CucoinIcon
                      key="2"
                      className="lg:opacity-60 lg:hover:opacity-100"
                      onClick={() => {
                        window.open(OuterLinkConfig[symbol]?.kucoin);
                      }}
                    />
                  </LabelOuterLinkIcon>
                )}
                {OuterLinkConfig[symbol]?.binance && (
                  <LabelOuterLinkIcon>
                    <BinanceIcon
                      key="3"
                      className="lg:opacity-60 lg:hover:opacity-100"
                      onClick={() => {
                        window.open(OuterLinkConfig[symbol]?.binance);
                      }}
                    />
                  </LabelOuterLinkIcon>
                )}
              </div>
              <div
                className={`flex items-center justify-end gap-1.5 ${
                  !OuterLinkConfig[symbol]?.okx &&
                  !OuterLinkConfig[symbol]?.gateio &&
                  !OuterLinkConfig[symbol]?.coinbase
                    ? "hidden"
                    : ""
                }`}
              >
                {OuterLinkConfig[symbol]?.okx && (
                  <LabelOuterLinkIcon>
                    <OKXIon
                      key="3"
                      className="lg:opacity-60 lg:hover:opacity-100"
                      onClick={() => {
                        window.open(OuterLinkConfig[symbol]?.okx);
                      }}
                    />
                  </LabelOuterLinkIcon>
                )}
                {OuterLinkConfig[symbol]?.gateio && (
                  <LabelOuterLinkIcon>
                    <GateIcon
                      key="3"
                      className="lg:opacity-60 lg:hover:opacity-100"
                      onClick={() => {
                        window.open(OuterLinkConfig[symbol]?.gateio);
                      }}
                    />
                  </LabelOuterLinkIcon>
                )}
                {OuterLinkConfig[symbol]?.coinbase && (
                  <LabelOuterLinkIcon>
                    <CoinbaseIcon
                      key="3"
                      className="lg:opacity-60 lg:hover:opacity-100"
                      onClick={() => {
                        window.open(OuterLinkConfig[symbol]?.coinbase);
                      }}
                    />
                  </LabelOuterLinkIcon>
                )}
              </div>
            </div>
          }
        />
      )}
      {symbol !== "USDt" && symbol !== "USDC" && !isLpToken && (
        <LabelOuterLink
          title="Bridge from"
          content={
            <LabelOuterLinkIcon>
              <RainbowIcon
                key="4"
                className="lg:opacity-60 lg:hover:opacity-100"
                onClick={() => {
                  window.open("https://rainbowbridge.app/");
                }}
              />
            </LabelOuterLinkIcon>
          }
        />
      )}
    </div>
  );
}

function Box({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-7 py-5 border border-dark-50 rounded-md bg-gray-800 ${className}`}>
      {children}
    </div>
  );
}

function UserBox({
  children,
  className = "",
}: {
  children: string | React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-5 pb-[23px] border border-dark-50 lg:rounded-md xsm:rounded-xl bg-dark-110 ${className}`}
    >
      {children}
    </div>
  );
}

function Label({
  title,
  subTitle,
  content,
}: {
  title: string;
  subTitle?: string;
  content: string | React.ReactNode;
}) {
  return (
    <div className={`flex justify-between mt-4 ${subTitle ? "items-start" : "items-center"}`}>
      <div className="flex flex-col">
        <span className="text-sm text-gray-300">{title}</span>
        {subTitle ? <span className="text-sm text-gray-300">{subTitle}</span> : null}
      </div>
      <div className="flex items-center text-sm text-white">{content}</div>
    </div>
  );
}

function LabelOuterLink({
  title,
  content,
  className,
}: {
  title: string;
  content: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={twMerge("flex items-center justify-between mb-5", className)}>
      <span className="text-sm text-gray-300">{title}</span>
      {content}
    </div>
  );
}

function LabelOuterLinkIcon({ children }) {
  return (
    <span className="flex items-center justify-center h-[22px] px-2.5  xsm:h-8 rounded-md bg-white bg-opacity-5 cursor-pointer">
      <span className="">{children}</span>
    </span>
  );
}

function LabelMobile({
  title,
  value,
  subValue,
  subMode,
  hidden,
}: {
  title: string;
  value: string | React.ReactNode;
  subValue?: string;
  subMode?: "line" | "space";
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-300">{title}</span>
      <span className="text-sm text-white">
        {value}
        {subValue && subMode === "space" ? (
          <span className="text-gray-300 ml-1">{subValue}</span>
        ) : (
          ""
        )}
        {subValue && subMode !== "space" ? <span className="text-gray-300">/{subValue}</span> : ""}
      </span>
    </div>
  );
}
function LabelMobileAPY({ tokenRow, title, isMeme }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-300">{title}</span>
      <span className="text-sm text-white">
        <APYCell
          rewards={tokenRow.depositRewards}
          baseAPY={tokenRow.supplyApy}
          page="deposit"
          tokenId={tokenRow.tokenId}
          onlyMarket
          memeCategory={isMeme}
        />
      </span>
    </div>
  );
}

export default TokenDetail;
