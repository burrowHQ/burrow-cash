import { useEffect, useMemo, useState } from "react";
import { Box, Typography, Stack, Alert, Link, useTheme } from "@mui/material";
import Decimal from "decimal.js";
import { getDepositAmount } from "btc-wallet";
import { BeatLoader } from "react-spinners";
import { twMerge } from "tailwind-merge";
import { actionMapTitle } from "./utils";
import { shrinkToken, TOKEN_FORMAT } from "../../store";
import { useDegenMode } from "../../hooks/hooks";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { toggleUseAsCollateral, updateAmount, showModal } from "../../redux/appSlice";
import {
  toggleUseAsCollateral as toggleUseAsCollateralMEME,
  hideModal as hideModalMEME,
  showModal as showModalMEME,
  updateAmount as updateAmountMEME,
} from "../../redux/appSliceMEME";
import { isInvalid, formatWithCommas_usd } from "../../utils/uiNumber";
import { YellowSolidSubmitButton, RedSolidSubmitButton } from "./button";
import { getCollateralAmount } from "../../redux/selectors/getCollateralAmount";
import { TipIcon, CloseIcon, WarnIcon, JumpTipIcon, ArrowRight } from "./svg";
import ReactToolTip, { TagToolTip } from "../ToolTip";
import { IToken } from "../../interfaces/asset";
import { isMemeCategory } from "../../redux/categorySelectors";
import HtmlTooltip from "../common/html-tooltip";
import { getTotalAccountBalance } from "../../redux/accountSelectors";
import { NBTCTokenId, WBTCTokenId, WNEARTokenId, NBTC_ENV } from "../../utils/config";
import { beautifyPrice, beautifyNumber } from "../../utils/beautyNumber";
import { getAssetsCategory } from "../../redux/assetsSelectors";
import { get_storage_balance_of } from "../../services/common";

export const USNInfo = () => (
  <Box mt="1rem">
    <Alert severity="info">
      <Stack>
        <Box>
          To swap NEAR for USN, use &nbsp;
          <Link
            href="https://swap.decentral-bank.finance/"
            title="DecentralBank SWAP"
            target="blank"
          >
            DecentralBank SWAP
          </Link>
        </Box>
      </Stack>
    </Alert>
  </Box>
);

export const NotConnected = () => {
  const theme = useTheme();
  return (
    <Box
      position="absolute"
      display="flex"
      justifyContent="center"
      alignItems="center"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bgcolor={theme.custom.notConnectedBg}
      zIndex="1"
    >
      <Typography variant="h5" color={theme.palette.info.main}>
        Please connect your wallet
      </Typography>
    </Box>
  );
};

export const CloseButton = ({ onClose, ...props }) => (
  <Box
    onClick={onClose}
    position="absolute"
    right="2rem"
    zIndex="2"
    sx={{ cursor: "pointer" }}
    {...props}
  >
    <CloseIcon />
  </Box>
);

export const ModalTitle = ({ asset, onClose }) => {
  const { action, symbol, isLpToken, tokens } = asset;
  function getSymbols() {
    return (
      <div className="flex items-center flex-shrink-0">
        {isLpToken ? (
          tokens.map((token: IToken, index) => {
            const { metadata } = token;
            return (
              <span className="text-base xsm:text-sm text-whit" key={token.token_id}>
                {metadata?.symbol}
                {index === tokens.length - 1 ? "" : "-"}
              </span>
            );
          })
        ) : (
          <span className="text-base text-white">{symbol}</span>
        )}
      </div>
    );
  }
  return (
    <div className="mb-[20px]">
      <div className="flex items-center justify-between text-lg text-white">
        <div
          className={`flex items-center flex-wrap ${
            tokens?.length > 2 && action === "Adjust" ? "" : "gap-1.5"
          }`}
        >
          {actionMapTitle[action]} <span>{getSymbols()}</span>
        </div>
        <CloseIcon onClick={onClose} className="cursor-pointer" />
      </div>
    </div>
  );
};
export const RepayTab = ({ asset }) => {
  const { action } = asset;
  const isRepay = action === "Repay";
  const { degenMode, isRepayFromDeposits, setRepayFromDeposits } = useDegenMode();
  return (
    <div className="mb-[20px]">
      {isRepay && degenMode.enabled && (
        <div className="flex items-center justify-between border border-dark-50 rounded-md bg-dark-600 h-12 mt-5 p-1.5">
          <span
            onClick={() => setRepayFromDeposits(false)}
            className={`flex items-center justify-center flex-grow w-1 h-full text-sm rounded-md cursor-pointer ${
              isRepayFromDeposits ? "text-gray-300" : "text-white bg-gray-300 bg-opacity-30"
            }`}
          >
            From Wallet
          </span>
          <span
            onClick={() => setRepayFromDeposits(true)}
            className={`flex items-center justify-center flex-grow w-1 h-full text-sm rounded-md cursor-pointer ${
              isRepayFromDeposits ? "text-white bg-gray-300 bg-opacity-30" : "text-gray-300"
            }`}
          >
            From Supplied
          </span>
        </div>
      )}
    </div>
  );
};
export const Available = ({ totalAvailable, available$ }) => (
  <Box mt="1rem" mb="0.5rem" display="flex" justifyContent="flex-end">
    <Typography fontSize="0.75rem" color="grey.500">
      Available: {Number(totalAvailable).toLocaleString(undefined, TOKEN_FORMAT as any)} (
      {available$})
    </Typography>
  </Box>
);

export const HealthFactor = ({ value, title }: { value: number; title?: string }) => {
  const healthFactorColor =
    value === -1
      ? "text-primary"
      : value <= 100
      ? "text-orange"
      : value <= 180
      ? "text-warning"
      : "text-primary";
  const healthFactorDisplayValue = value === -1 ? "10000%" : `${value?.toFixed(2)}%`;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-300">{title || "Health Factor"}</span>
      <span className={`text-sm ${healthFactorColor}`}>{healthFactorDisplayValue}</span>
    </div>
  );
};
export const BorrowLimit = ({ from, to }: { from: string | number; to: string | number }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-300">Borrow limit</span>
      <div className="flex items-center text-sm">
        <span className="text-gray-300 line-through">{formatWithCommas_usd(from)}</span>
        <ArrowRight className="mx-1.5" />
        <span className="text-white">{formatWithCommas_usd(to)}</span>
      </div>
    </div>
  );
};

export const CollateralSwitch = ({ action, canUseAsCollateral, tokenId }) => {
  const [collateralStatus, setCollateralStatus] = useState<boolean>(true);
  const dispatch = useAppDispatch();
  const isMeme = useAppSelector(isMemeCategory);
  const showToggle = action === "Supply";
  useEffect(() => {
    if (!canUseAsCollateral) {
      if (isMeme) {
        dispatch(toggleUseAsCollateralMEME({ useAsCollateral: false }));
      } else {
        dispatch(toggleUseAsCollateral({ useAsCollateral: false }));
      }
      setCollateralStatus(false);
    } else {
      if (isMeme) {
        dispatch(toggleUseAsCollateralMEME({ useAsCollateral: true }));
      } else {
        dispatch(toggleUseAsCollateral({ useAsCollateral: true }));
      }
      setCollateralStatus(true);
    }
  }, [tokenId, isMeme]);
  useEffect(() => {
    if (!canUseAsCollateral) {
      if (isMeme) {
        dispatch(toggleUseAsCollateralMEME({ useAsCollateral: false }));
      } else {
        dispatch(toggleUseAsCollateral({ useAsCollateral: false }));
      }
      setCollateralStatus(false);
    } else {
      if (isMeme) {
        dispatch(toggleUseAsCollateralMEME({ useAsCollateral: collateralStatus }));
      } else {
        dispatch(toggleUseAsCollateral({ useAsCollateral: collateralStatus }));
      }
    }
  }, [collateralStatus, isMeme]);
  const handleSwitchToggle = (checked: boolean) => {
    setCollateralStatus(checked);
  };
  if (!showToggle) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-300">Use as Collateral</span>
      <div className="flex items-center">
        {!canUseAsCollateral && (
          <ReactToolTip type="warn" content="This asset can't be used as collateral yet" />
        )}
        <Switch
          onChange={handleSwitchToggle}
          checked={collateralStatus}
          disabled={!canUseAsCollateral}
        />
      </div>
    </div>
  );
};

export const CollateralTip = () => {
  return (
    <div className="flex items-center gap-2.5">
      <WarnIcon />
      <span className="text-gray-300 text-sm">This asset cannot be used as collateral yet</span>
    </div>
  );
};

const Switch = ({ onChange, checked, disabled }) => {
  if (checked) {
    return (
      <div
        onClick={() => {
          onChange(false);
        }}
        className="flex items-center justify-end w-[36px] h-5 rounded-xl border border-dark-50 bg-primary cursor-pointer p-0.5"
      >
        <span className="w-4 h-4 rounded-full bg-linear_gradient_dark shadow-100" />
      </div>
    );
  } else {
    return (
      <div
        onClick={() => {
          if (!disabled) {
            onChange(true);
          }
        }}
        className="flex items-center w-[36px] h-5 rounded-xl border border-dark-50 bg-dark-600 cursor-pointer p-0.5"
      >
        <span className="w-4 h-4 rounded-full bg-gray-300 shadow-100" />
      </div>
    );
  }
};

export const Rates = ({ rates }) => {
  if (!rates) return null;
  return rates.map(({ label, value, value$ }) => (
    <div key={label} className="flex items-center justify-between">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex items-center">
        <span className="text-sm text-white">{value}</span>
        {!isInvalid(value$) && (
          <span className="text-xs text-gray-300 ml-1.5">({formatWithCommas_usd(value$)})</span>
        )}
      </div>
    </div>
  ));
};

export const SubmitButton = ({ action, disabled, onClick, loading }) => {
  if (action === "Borrow" || action === "Repay")
    return (
      <RedSolidSubmitButton disabled={disabled || loading} onClick={onClick}>
        {loading ? <BeatLoader size={5} color="#16161B" /> : action}
      </RedSolidSubmitButton>
    );

  return (
    <YellowSolidSubmitButton disabled={disabled || loading} onClick={onClick}>
      {loading ? <BeatLoader size={5} color="#16161B" /> : action === "Adjust" ? "Confirm" : action}
    </YellowSolidSubmitButton>
  );
};

export const Alerts = ({ data, errorClassName }: any) => {
  const sort = (b: any, a: any) => {
    if (b[1].severity === "error") return 1;
    if (a[1].severity === "error") return -1;
    return 0;
  };

  return (
    <div className={`flex flex-col gap-4 ${Object.entries(data).length ? "my-5" : "my-3.5"}`}>
      {Object.entries(data)
        .sort(sort)
        .map(([alert]) => {
          if (data[alert].severity === "warning") {
            return <AlertWarning key={alert} title={data[alert].title} />;
          } else {
            return (
              <AlertError
                className={twMerge("pb-5 -mb-7", errorClassName || "")}
                key={alert}
                title={data[alert].title}
              />
            );
          }
        })}
    </div>
  );
};

export const AlertWarning = ({ title, className }: { title: string; className?: string }) => {
  return <div className={`text-warning text-sm ${className || ""}`}>{title}</div>;
};

export const AlertError = ({ title, className }: { title: string; className?: string }) => {
  return (
    <div
      className={`flex items-start gap-2 text-orange text-sm bg-orange bg-opacity-10 rounded-md p-3 ${
        className || ""
      }`}
    >
      <TipIcon className="flex-shrink-0 relative top-1" />
      {title}
    </div>
  );
};

export function useWithdrawTrigger(tokenId: string) {
  const dispatch = useAppDispatch();
  const isMeme = useAppSelector(isMemeCategory);
  return () => {
    if (isMeme) {
      dispatch(showModalMEME({ action: "Withdraw", tokenId, amount: "0" }));
    } else {
      dispatch(showModal({ action: "Withdraw", tokenId, amount: "0" }));
    }
  };
}

export function useAdjustTrigger(tokenId: string, memeCategory?: boolean) {
  const dispatch = useAppDispatch();
  const isMemeCur = useAppSelector(isMemeCategory);
  let isMeme: boolean;
  if (typeof memeCategory !== "boolean") {
    isMeme = isMemeCur;
  } else {
    isMeme = memeCategory;
  }
  const amount = useAppSelector(getCollateralAmount(tokenId, isMeme)) as string;
  return () => {
    if (isMeme) {
      dispatch(showModalMEME({ action: "Adjust", tokenId, amount }));
    } else {
      dispatch(showModal({ action: "Adjust", tokenId, amount }));
    }
  };
}

export function useSupplyTrigger(tokenId: string) {
  const dispatch = useAppDispatch();
  const isMeme = useAppSelector(isMemeCategory);
  return () => {
    if (isMeme) {
      dispatch(showModalMEME({ action: "Supply", tokenId, amount: "0" }));
    } else {
      dispatch(showModal({ action: "Supply", tokenId, amount: "0" }));
    }
  };
}

export function useBorrowTrigger(tokenId: string) {
  const dispatch = useAppDispatch();
  const isMeme = useAppSelector(isMemeCategory);
  return () => {
    if (isMeme) {
      dispatch(showModalMEME({ action: "Borrow", tokenId, amount: "0" }));
    } else {
      dispatch(showModal({ action: "Borrow", tokenId, amount: "0" }));
    }
  };
}

export function useRepayTrigger(tokenId: string, position?: string) {
  const dispatch = useAppDispatch();
  const isMeme = useAppSelector(isMemeCategory);
  return () => {
    if (isMeme) {
      dispatch(showModalMEME({ action: "Repay", tokenId, amount: "0", position }));
    } else {
      dispatch(showModal({ action: "Repay", tokenId, amount: "0", position }));
    }
  };
}

export const Receive = ({ value, loading }: { value: string; loading: boolean }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-300">Received Amount</span>
      {loading ? <BeatLoader size={5} color="#ffffff" /> : <span className="text-sm">{value}</span>}
    </div>
  );
};
export const Fee = ({ value, loading }: { value: string; loading: boolean }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-300">Fee</span>
      {loading ? <BeatLoader size={5} color="#ffffff" /> : <span className="text-sm">{value}</span>}
    </div>
  );
};

export const BtcOneClickTab = ({ nbtcTab, setNbtcTab, isMeme }) => {
  const dispatch = useAppDispatch();
  function switchTab(chain: string) {
    setNbtcTab(chain);
    if (isMeme) {
      dispatch(updateAmountMEME({ isMax: false, amount: "0" }));
    } else {
      dispatch(updateAmount({ isMax: false, amount: "0" }));
    }
  }
  return (
    <div className="mb-[20px]">
      <div
        className="flex items-center justify-between border border-dark-50 rounded-md bg-dark-600 h-12 mt-5 p-1.5"
        data-tour="modal-tabs"
      >
        <span
          onClick={() => switchTab("btc")}
          className={`flex items-center justify-center flex-grow w-1 h-full text-sm rounded-md cursor-pointer ${
            nbtcTab == "btc" ? "text-white bg-gray-300 bg-opacity-30" : "text-gray-300"
          }`}
        >
          BTC Chain
        </span>
        <span
          onClick={() => switchTab("near")}
          className={`flex items-center justify-center flex-grow w-1 h-full text-sm rounded-md cursor-pointer ${
            nbtcTab == "near" ? "text-white bg-gray-300 bg-opacity-30" : "text-gray-300"
          }`}
          data-tour="modal-near-tab"
        >
          NEAR Chain
        </span>
      </div>
    </div>
  );
};
export function FeeContainer({
  loading,
  transactionsNumOnNear,
  transactionsGasOnNear,
  bridgeProtocolFee,
  className,
  storage,
  isDeposit,
}: {
  loading: boolean;
  transactionsNumOnNear?: string | number;
  transactionsGasOnNear?: string | number; // T
  bridgeProtocolFee?: string | number;
  isDeposit?: boolean;
  storage?: {
    contractId?: string;
    amount: string;
  };
  className?: string;
}) {
  const [repayAmount, setRepayAmount] = useState<string | number>("0");
  const [extraFeeLoading, setExtraFeeLoading] = useState<boolean>(false);
  const [storageDepositOnNear, setStorageDepositOnNear] = useState<string>("0");
  const [isNewAccount, setIsNewAccount] = useState<boolean>(false);
  const selectedWalletId = window.selector?.store?.getState()?.selectedWalletId;
  const isBtcWallet = selectedWalletId === "btc-wallet";
  const isEmpty =
    new Decimal(transactionsNumOnNear || 0).eq(0) && new Decimal(bridgeProtocolFee || 0).eq(0);
  useEffect(() => {
    if (isBtcWallet && !isEmpty) {
      getExtraFee();
    }
  }, [isBtcWallet, JSON.stringify(storage || 0), isEmpty]);
  async function getExtraFee() {
    setExtraFeeLoading(true);
    const { repayAmount, newAccountMinDepositAmount } = await getDepositAmount("0", {
      env: NBTC_ENV,
    });
    if (storage?.contractId) {
      const res = await get_storage_balance_of({
        accountId: window.accountId,
        contractId: storage?.contractId,
      });
      if (!res) {
        setStorageDepositOnNear(storage?.amount || "0");
      }
    }
    const _repayAmount = shrinkToken(repayAmount || 0, 8, 8);
    setRepayAmount(_repayAmount || 0);
    setIsNewAccount(!!Number(newAccountMinDepositAmount || 0));
    setExtraFeeLoading(false);
  }
  if (!isBtcWallet) return null;
  if (isEmpty || loading || extraFeeLoading) {
    return (
      <div className={twMerge(`flex items-center justify-between`, className || "")}>
        <span className="flex items-center gap-1.5 text-sm text-gray-300">Fee</span>
        {loading || extraFeeLoading ? (
          <BeatLoader size={5} color="#ffffff" />
        ) : (
          <span className="text-white border-b border-dashed text-sm">$0</span>
        )}
      </div>
    );
  } else if (isNewAccount) {
    // bridge for new account
    return (
      <div className="flex flex-col gap-4">
        <div className={twMerge(`flex items-center justify-between`, className || "")}>
          <span className="flex items-center gap-1.5 text-sm text-gray-300">
            Bridge Fee{" "}
            <TagToolTip
              title={
                <div>
                  Account Initial requires 3000 satoshi, with 2000 satoshi used for bridge cost.
                </div>
              }
            />
          </span>
          <BridgeFeeDetailForNewAccount />
        </div>
        <div className={twMerge(`flex items-center justify-between`, className || "")}>
          <span className="flex items-center gap-1.5 text-sm text-gray-300">
            Gas Reservation{" "}
            <TagToolTip
              title={<div>800 satoshi will be retained in your mapped account as gas.</div>}
            />
          </span>
          <ReservationDetailForNewAccount />
        </div>
      </div>
    );
  } else if (new Decimal(bridgeProtocolFee || 0).gt(0)) {
    // bridge for old user
    return (
      <div className="flex flex-col gap-4">
        <div className={twMerge(`flex items-center justify-between`, className || "")}>
          <span className="flex items-center gap-1.5 text-sm text-gray-300">Fee</span>
          <FeeDetailBridge
            bridgeProtocolFee={bridgeProtocolFee}
            storageDepositOnNear={storageDepositOnNear}
            isDeposit={isDeposit}
          />
        </div>
      </div>
    );
  } else {
    // transtions on near chain
    return (
      <div className={twMerge(`flex items-center justify-between`, className || "")}>
        <span className="flex items-center gap-1.5 text-sm text-gray-300">
          Fee{" "}
          <TagToolTip
            title={
              <div className="flex flex-col gap-1">
                <p>1. Near{">"}0.5, Estimated amount, final deduction may vary.</p>
                <p>
                  2. Near{"<"} 0.5, Estimated amount, final deduction may vary. NEAR shortage will
                  trigger nBTC swap, possibly increasing NEAR balance after completion.
                </p>
              </div>
            }
          />
        </span>
        <FeeDetail
          transactionsNumOnNear={transactionsNumOnNear}
          transactionsGasOnNear={transactionsGasOnNear}
          storageDepositOnNear={storageDepositOnNear}
        />
      </div>
    );
  }
}
const FeeDetail = ({
  transactionsNumOnNear,
  transactionsGasOnNear,
  storageDepositOnNear,
}: {
  transactionsNumOnNear?: string | number;
  transactionsGasOnNear?: string | number;
  storageDepositOnNear?: string | number;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [nearNumPerT] = useState(0.0001);
  const [signatureFeePertTx] = useState(10);
  const [nearGasPerTx] = useState(50);
  const totalNEARBalance = useAppSelector(getTotalAccountBalance);
  const assets = useAppSelector(getAssetsCategory(false));
  const prices = useMemo(() => {
    return {
      [WBTCTokenId]: assets?.data?.[WBTCTokenId]?.price?.usd || 0,
      [NBTCTokenId]: assets?.data?.[NBTCTokenId]?.price?.usd || 0,
      [WNEARTokenId]: assets?.data?.[WNEARTokenId]?.price?.usd || 0,
    };
  }, [JSON.stringify(assets || {})]);
  console.log("------------------before", {
    transactionsNumOnNear,
    transactionsGasOnNear,
    storageDepositOnNear,
    prices,
  });
  const { near_gas_num, nbtc_gas_num, storage_deposit_num, totalValue } = useMemo(() => {
    let totalValue = new Decimal(0);
    let near_gas_num = new Decimal(0);
    let nbtc_gas_num = new Decimal(0);
    let storage_deposit_num = new Decimal(0);
    const nbtcPrice = prices[NBTCTokenId] || 0;
    const nearPrice = prices[WNEARTokenId] || 0;
    // transtions on near chain
    const target: any = {};
    const signatureFee = new Decimal(transactionsNumOnNear || 0).mul(signatureFeePertTx);
    nbtc_gas_num = new Decimal(shrinkToken(signatureFee.toFixed(0), 8));
    const v_s = new Decimal(nbtc_gas_num).mul(nbtcPrice);
    totalValue = totalValue.plus(v_s);
    if (Number(storageDepositOnNear || 0) > 0) {
      storage_deposit_num = new Decimal(storageDepositOnNear || 0);
      const v_storage = storage_deposit_num.mul(nearPrice);
      totalValue = totalValue.plus(v_storage);
      target.storage_deposit_num = storage_deposit_num;
    }
    if (new Decimal(totalNEARBalance || 0).gt(0.5)) {
      // use near as gas, each tx as 50T
      const NEARGasT = new Decimal(transactionsNumOnNear || 0).mul(nearGasPerTx);
      near_gas_num = NEARGasT.mul(nearNumPerT);
      const v_n = new Decimal(near_gas_num).mul(nearPrice);
      totalValue = totalValue.plus(v_n);
      target.near_gas_num = near_gas_num;
      target.nbtc_gas_num = nbtc_gas_num;
    } else {
      // use nbtc as gas
      const gas_v = new Decimal(transactionsGasOnNear || 0).mul(nearNumPerT).mul(nearPrice);
      totalValue = totalValue.plus(gas_v);
      if (new Decimal(nbtcPrice).gt(0)) {
        nbtc_gas_num = nbtc_gas_num.plus(gas_v.div(nbtcPrice).toFixed());
      }
      target.nbtc_gas_num = nbtc_gas_num;
    }
    target.totalValue = totalValue;
    return target;
  }, [
    transactionsNumOnNear,
    transactionsGasOnNear,
    storageDepositOnNear,
    JSON.stringify(prices || {}),
  ]);
  return (
    <HtmlTooltip
      open={showTooltip}
      placement="top"
      onOpen={() => setShowTooltip(true)}
      onClose={() => setShowTooltip(false)}
      title={
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-6">
            <span>Gas Fee</span>
            <div className="flex items-center gap-2">
              {near_gas_num?.gt(0) ? (
                <div className="flex items-center gap-1.5">
                  <img
                    src="https://img.rhea.finance/images/near-icon.png"
                    alt=""
                    className="w-4 h-4 rounded-full"
                  />
                  <span className="text-white">{beautifyPrice(near_gas_num.toFixed())}</span>
                </div>
              ) : null}
              {nbtc_gas_num?.gt(0) ? (
                <div className="flex items-center gap-1.5">
                  <img
                    src="https://img.rhea.finance/images/nbtc-icon.jpg"
                    alt=""
                    className="w-4 h-4 rounded-full"
                  />
                  <span className="text-white">
                    {beautifyNumber({
                      num: nbtc_gas_num.toFixed(),
                      maxDecimal: 8,
                    })}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
          {storage_deposit_num?.gt(0) ? (
            <div className="flex items-center justify-between gap-6">
              <span>Register Fee</span>
              <div className="flex items-center gap-1.5">
                <img
                  src="https://img.rhea.finance/images/near-icon.png"
                  alt=""
                  className="w-4 h-4 rounded-full"
                />
                <span className="text-white">{beautifyPrice(storage_deposit_num.toFixed())}</span>
              </div>
            </div>
          ) : null}
        </div>
      }
    >
      <span
        className="text-white border-b border-dashed text-sm"
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
      >
        {beautifyPrice(totalValue?.toFixed() || 0, true)}
      </span>
    </HtmlTooltip>
  );
};
const FeeDetailBridge = ({
  bridgeProtocolFee,
  storageDepositOnNear,
  isDeposit,
}: {
  bridgeProtocolFee?: string | number;
  storageDepositOnNear?: string | number;
  isDeposit?: boolean;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const assets = useAppSelector(getAssetsCategory(false));
  const prices = useMemo(() => {
    return {
      [WBTCTokenId]: assets?.data?.[WBTCTokenId]?.price?.usd || 0,
      [NBTCTokenId]: assets?.data?.[NBTCTokenId]?.price?.usd || 0,
      [WNEARTokenId]: assets?.data?.[WNEARTokenId]?.price?.usd || 0,
    };
  }, [JSON.stringify(assets || {})]);
  const { storage_deposit_num, deposit_bridge_fee, withdraw_bridge_fee, totalValue } =
    useMemo(() => {
      let totalValue = new Decimal(0);
      let deposit_bridge_fee = new Decimal(0);
      let withdraw_bridge_fee = new Decimal(0);
      let storage_deposit_num = new Decimal(0);
      const btcPrice = prices[WBTCTokenId] || 0;
      const nbtcPrice = prices[NBTCTokenId] || 0;
      const nearPrice = prices[WNEARTokenId] || 0;
      const bridgeProtocolFee8 = new Decimal(bridgeProtocolFee || 0).toFixed(8);
      if (isDeposit) {
        // onClick supply
        deposit_bridge_fee = new Decimal(bridgeProtocolFee8 || 0);
        totalValue = deposit_bridge_fee.mul(btcPrice);
        if (Number(storageDepositOnNear || 0) > 0) {
          storage_deposit_num = new Decimal(storageDepositOnNear || 0);
          const v_storage = storage_deposit_num.mul(nearPrice);
          totalValue = totalValue.plus(v_storage);
        }
        return {
          deposit_bridge_fee,
          storage_deposit_num,
          totalValue,
        } as any;
      } else {
        // onClick withdraw
        withdraw_bridge_fee = new Decimal(bridgeProtocolFee8);
        totalValue = withdraw_bridge_fee.mul(nbtcPrice);
        return {
          withdraw_bridge_fee,
          totalValue,
        } as any;
      }
    }, [bridgeProtocolFee, storageDepositOnNear, isDeposit, JSON.stringify(prices || {})]);
  return (
    <HtmlTooltip
      open={showTooltip}
      placement="top"
      onOpen={() => setShowTooltip(true)}
      onClose={() => setShowTooltip(false)}
      title={
        <div className="flex flex-col gap-2">
          {deposit_bridge_fee?.gt(0) ? (
            <div className="flex items-center justify-between gap-6">
              <span>Bridge Fee</span>
              <div className="flex items-center gap-1.5">
                <img
                  src="https://img.rhea.finance/images/btc-icon.png"
                  alt=""
                  className="w-4 h-4 rounded-full"
                />
                <span className="text-white">
                  {beautifyNumber({
                    num: deposit_bridge_fee.toFixed(),
                    maxDecimal: 8,
                  })}
                </span>
              </div>
            </div>
          ) : null}
          {withdraw_bridge_fee?.gt(0) ? (
            <div className="flex items-center justify-between gap-6">
              <span>Bridge Fee</span>
              <div className="flex items-center gap-1.5">
                <img
                  src="https://img.rhea.finance/images/nbtc-icon.jpg"
                  alt=""
                  className="w-4 h-4 rounded-full"
                />
                <span className="text-white">
                  {beautifyNumber({
                    num: withdraw_bridge_fee.toFixed(),
                    maxDecimal: 8,
                  })}
                </span>
              </div>
            </div>
          ) : null}
          {storage_deposit_num?.gt(0) ? (
            <div className="flex items-center justify-between gap-6">
              <span>Register Fee</span>
              <div className="flex items-center gap-1.5">
                <img
                  src="https://img.rhea.finance/images/near-icon.png"
                  alt=""
                  className="w-4 h-4 rounded-full"
                />
                <span className="text-white">{beautifyPrice(storage_deposit_num.toFixed())}</span>
              </div>
            </div>
          ) : null}
        </div>
      }
    >
      <span
        className="text-white border-b border-dashed text-sm"
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
      >
        {beautifyPrice(totalValue?.toFixed() || 0, true)}
      </span>
    </HtmlTooltip>
  );
};
const BridgeFeeDetailForNewAccount = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const assets = useAppSelector(getAssetsCategory(false));
  const prices = useMemo(() => {
    return {
      [WBTCTokenId]: assets?.data?.[WBTCTokenId]?.price?.usd || 0,
      [NBTCTokenId]: assets?.data?.[NBTCTokenId]?.price?.usd || 0,
      [WNEARTokenId]: assets?.data?.[WNEARTokenId]?.price?.usd || 0,
    };
  }, [JSON.stringify(assets || {})]);
  const { totalValue } = useMemo(() => {
    let totalValue = new Decimal(0);
    const deposit_bridge_fee = new Decimal(0.00005);
    const btcPrice = prices[WBTCTokenId] || 0;
    totalValue = deposit_bridge_fee.mul(btcPrice);
    return {
      totalValue,
    };
  }, [JSON.stringify(prices || {})]);
  return (
    <HtmlTooltip
      open={showTooltip}
      placement="top"
      onOpen={() => setShowTooltip(true)}
      onClose={() => setShowTooltip(false)}
      title={
        <div className="flex items-center justify-between gap-6">
          <span>
            <img
              src="https://img.rhea.finance/images/btc-icon.png"
              alt=""
              className="w-4 h-4 rounded-full"
            />
          </span>
          <span className="text-white">0.00005</span>
        </div>
      }
    >
      <span
        className="text-white border-b border-dashed text-sm"
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
      >
        {beautifyPrice(totalValue?.toFixed() || 0, true)}
      </span>
    </HtmlTooltip>
  );
};
const ReservationDetailForNewAccount = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const assets = useAppSelector(getAssetsCategory(false));
  const prices = useMemo(() => {
    return {
      [WBTCTokenId]: assets?.data?.[WBTCTokenId]?.price?.usd || 0,
      [NBTCTokenId]: assets?.data?.[NBTCTokenId]?.price?.usd || 0,
      [WNEARTokenId]: assets?.data?.[WNEARTokenId]?.price?.usd || 0,
    };
  }, [JSON.stringify(assets || {})]);
  const { totalValue } = useMemo(() => {
    let totalValue = new Decimal(0);
    const _fee = new Decimal(0.000008);
    const btcPrice = prices[WBTCTokenId] || 0;
    totalValue = _fee.mul(btcPrice);
    return {
      totalValue,
    };
  }, [JSON.stringify(prices || {})]);
  return (
    <HtmlTooltip
      open={showTooltip}
      placement="top"
      onOpen={() => setShowTooltip(true)}
      onClose={() => setShowTooltip(false)}
      title={
        <div className="flex items-center justify-between gap-6">
          <span>
            <img
              src="https://img.rhea.finance/images/btc-icon.png"
              alt=""
              className="w-4 h-4 rounded-full"
            />
          </span>
          <span className="text-white">0.000008</span>
        </div>
      }
    >
      <span
        className="text-white border-b border-dashed text-sm"
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
      >
        {beautifyPrice(totalValue?.toFixed() || 0, true)}
      </span>
    </HtmlTooltip>
  );
};
