import { useState, useEffect, useRef, createContext, useContext } from "react";
import { Button, Box, useTheme, Modal as MUIModal } from "@mui/material";
import type { WalletSelector } from "@near-wallet-selector/core";
import { BeatLoader } from "react-spinners";
import { useDebounce } from "react-use";
import { fetchAssets, fetchRefPrices } from "../../redux/assetsSlice";
import { fetchAssetsMEME } from "../../redux/assetsSliceMEME";
import { logoutAccount, fetchAccount, setAccountId } from "../../redux/accountSlice";
import { logoutAccount as logoutAccountMEME, fetchAccountMEME } from "../../redux/accountSliceMEME";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { getBurrow, accountTrim, standardizeAsset } from "../../utils";
import { hideModal as _hideModal } from "../../redux/appSlice";
import { hideModal as _hideModalMEME } from "../../redux/appSliceMEME";
import { getAccountBalance, getAccountId } from "../../redux/accountSelectors";
import { getAccountRewards } from "../../redux/selectors/getAccountRewards";
import { trackConnectWallet, trackLogout } from "../../utils/telemetry";
import Disclaimer from "../Disclaimer";
import { useDisclaimer } from "../../hooks/useDisclaimer";
import { NearSolidIcon, ArrowDownIcon, CloseIcon, GuideIcon, GuideCloseIcon } from "./svg";
import ClaimAllRewards from "../ClaimAllRewards";
import { formatWithCommas_usd } from "../../utils/uiNumber";
import { isMobileDevice } from "../../helpers/helpers";
import CopyToClipboardComponent from "./CopyToClipboardComponent";
import CustomButton from "../CustomButton/CustomButton";
import { fetchMarginAccount } from "../../redux/marginAccountSlice";
import { fetchMarginAccountMEME } from "../../redux/marginAccountSliceMEME";
import BeginnerGuideWrapper from "../BeginnerGuide/BeginnerGuideWrapper";
import { useGuide } from "../BeginnerGuide/GuideContext";

const WalletContext = createContext(null) as any;
const WalletButton = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const isMobile = isMobileDevice();
  const balance = useAppSelector(getAccountBalance);
  const accountId = useAppSelector(getAccountId);
  const [isDisclaimerOpen, setDisclaimer] = useState(false);
  const { getDisclaimer: hasAgreedDisclaimer } = useDisclaimer();
  const [show_account_detail, set_show_account_detail] = useState(false);
  const { markWalletGuideCompleted } = useGuide();

  const selectorRef = useRef<WalletSelector>();
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [currentWallet, setCurrentWallet] = useState<any>(null);
  const rewards = useAppSelector(getAccountRewards());
  const hideModal = () => {
    dispatch(_hideModal());
    dispatch(_hideModalMEME());
  };
  const fetchData = (id?: string) => {
    dispatch(setAccountId(id));
    dispatch(fetchAccount());
    dispatch(fetchAccountMEME());
    dispatch(fetchMarginAccount());
    dispatch(fetchMarginAccountMEME());
    dispatch(fetchAssets()).then(() => dispatch(fetchRefPrices()));
    dispatch(fetchAssetsMEME()).then(() => dispatch(fetchRefPrices()));
  };

  const signOut = () => {
    dispatch(logoutAccount());
    dispatch(logoutAccountMEME());
  };

  const onMount = async () => {
    let walletSelector = selector;
    if (!selector) {
      const { selector: s } = await getBurrow({ fetchData, hideModal, signOut });
      walletSelector = s;
      selectorRef.current = s;
      setSelector(s);
      window.selector = s;
    }

    if (walletSelector) {
      const wallet: any = await walletSelector?.wallet();
      if (wallet) {
        setCurrentWallet(wallet);
      }
    }
  };

  useDebounce(
    () => {
      onMount();
    },
    500,
    [accountId],
  );

  const onWalletButtonClick = async () => {
    markWalletGuideCompleted();
    if (!hasAgreedDisclaimer) {
      setDisclaimer(true);
      return;
    }
    if (accountId) return;
    trackConnectWallet();
    window.modal.show();
  };

  const handleSignOut = async () => {
    const { signOut: signOutBurrow } = await getBurrow();
    if (typeof signOutBurrow === "function") {
      signOutBurrow();
    }
    trackLogout();
    setDisclaimer(false);
  };
  const handleSwitchWallet = async () => {
    await handleSignOut();
  };

  const getUnClaimRewards = () => formatWithCommas_usd(rewards.totalUnClaimUSD);
  return (
    <WalletContext.Provider
      value={{
        balance,
        show_account_detail,
        set_show_account_detail,
        accountId,
        handleSwitchWallet,
        handleSignOut,
        getUnClaimRewards,
        isMobile,
        rewards,
        currentWallet,
      }}
    >
      <Box
        sx={{
          gridArea: "wallet",
          marginRight: 0,
          display: "flex",
          alignItems: "center",
          position: "relative",
          zIndex: 999,
        }}
      >
        {accountId ? (
          <Account />
        ) : (
          <BeginnerGuideWrapper>
            {() => (
              <div className="relative">
                <Button
                  size="small"
                  sx={{
                    justifySelf: "end",
                    alignItems: "center",
                    cursor: accountId ? "default" : "pointer",
                    color: "#000",
                    textTransform: "none",
                    padding: "0 20px",
                    borderRadius: "6px",
                    opacity: 1,
                    ":hover": {
                      backgroundColor: "#00F7A5",
                      opacity: 0.8,
                    },
                    [theme.breakpoints.down("lg")]: {
                      height: "30px",
                      fontSize: "14px",
                    },
                    [theme.breakpoints.up("lg")]: {
                      height: "40px",
                      fontSize: "16px",
                    },
                  }}
                  variant={accountId ? "outlined" : "contained"}
                  onClick={onWalletButtonClick}
                  disableRipple={!!accountId}
                >
                  Connect Wallet
                </Button>
              </div>
            )}
          </BeginnerGuideWrapper>
        )}
        <Disclaimer isOpen={isDisclaimerOpen} onClose={() => setDisclaimer(false)} />
      </Box>
    </WalletContext.Provider>
  );
};

function Account() {
  const { balance, show_account_detail, set_show_account_detail, accountId, isMobile } = useContext(
    WalletContext,
  ) as any;

  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function handleOpen() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    set_show_account_detail(true);
  }

  function handleClose() {
    closeTimeoutRef.current = setTimeout(() => {
      set_show_account_detail(false);
    }, 150);
  }

  function handleSwitch() {
    set_show_account_detail(!show_account_detail);
  }

  return (
    <div className="flex items-center gap-4">
      {/* near balance */}
      {!isMobile && (
        <div className="flex items-center gap-2 border border-dark-50 bg-gray-800 px-2.5 py-2 rounded-md">
          <NearSolidIcon />
          <span className="text-base text-white font-bold">
            {balance === "..." ? "..." : Number.parseFloat(balance).toFixed(2)}
          </span>
        </div>
      )}

      {/* account */}
      <div
        className="flex flex-col items-end"
        onMouseEnter={() => {
          if (!isMobile) {
            handleOpen();
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            handleClose();
          }
        }}
        onClick={() => {
          if (isMobile) {
            handleSwitch();
          }
        }}
      >
        <div
          style={{ minWidth: "150px" }}
          className={`flex items-center justify-between border border-primary rounded-md px-3 py-2 xsm:py-1 text-base xsm:text-sm font-bold text-white cursor-pointer ${
            show_account_detail ? " bg-primary bg-opacity-20" : ""
          }`}
        >
          <span className="flex-grow flex justify-center mr-2">{accountTrim(accountId)}</span>
          <span className={`${show_account_detail ? "transform rotate-180" : ""}`}>
            <ArrowDownIcon />
          </span>
        </div>
        {!isMobile && (
          <div
            style={{ zIndex: 9999 }}
            className={`absolute top-12 pt-1 ${show_account_detail ? "" : "hidden"}`}
            onMouseEnter={handleOpen}
            onMouseLeave={handleClose}
          >
            <AccountDetail />
          </div>
        )}
      </div>
      {isMobile && (
        <MUIModal open={show_account_detail} onClose={handleClose}>
          <div className="relative outline-none">
            {/* body */}
            <AccountDetail onClose={handleClose} />
          </div>
        </MUIModal>
      )}
    </div>
  );
}

function AccountDetail({ onClose }: { onClose?: () => void }) {
  const {
    balance,
    accountId,
    handleSwitchWallet,
    getUnClaimRewards,
    isMobile,
    rewards,
    currentWallet,
  } = useContext(WalletContext) as any;
  const changeWalletDisable = currentWallet?.id === "keypom";
  return (
    <div className="border border-dark-50 bg-dark-110 lg:rounded-md p-4 xsm:rounded-b-xl xsm:p-6">
      {isMobile && (
        <div className="relative flex items-center w-full justify-between h-[60px] mb-5">
          <span className="text-gray-300 text-xl">Account</span>
          <CloseIcon onClick={onClose} />
          <div className="absolute h-px -left-6 -right-6 bottom-0 bg-dark-50" />
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className=" text-white text-lg">{accountTrim(accountId)}</span>
          <CopyToClipboardComponent text={accountId} className="ml-2" />
        </div>
        {isMobile && (
          <div className="flex items-center">
            <span className="text-sm text-white font-bold mr-1.5">
              {balance === "..." ? "..." : Number.parseFloat(balance).toFixed(2)}
            </span>
            <NearSolidIcon className="transform scale-75" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center text-xs text-gray-300 xsm:text-sm">
          {currentWallet?.metadata?.iconUrl && (
            <span className="mr-1" style={{ marginLeft: -2 }}>
              <img src={currentWallet.metadata.iconUrl} className="w-3 h-3 mr-1" alt="" />
            </span>
          )}
          {currentWallet?.metadata?.name}
        </div>
      </div>
      <div className="flex items-center justify-between w-full gap-2 my-3.5">
        <CustomButton
          style={{
            width: 104,
            height: 30,
            minHeight: 0,
          }}
          disabled={changeWalletDisable}
          color="primaryBorder"
          className="flex flex-grow items-center justify-center text-sm font-bold py-1"
          onClick={() => {
            if (!changeWalletDisable) {
              if (onClose) {
                onClose();
              }
              handleSwitchWallet();
            }
          }}
        >
          Change
        </CustomButton>

        <CustomButton
          style={{
            width: 104,
            height: 30,
            minHeight: 0,
          }}
          disabled={changeWalletDisable}
          color="errorBorder"
          className="flex flex-grow items-center justify-center text-sm font-bold py-1"
          onClick={() => {
            if (!changeWalletDisable) {
              if (onClose) {
                onClose();
              }
              handleSwitchWallet();
            }
          }}
        >
          Disconnect
        </CustomButton>
      </div>
      <div className="flex lg:items-center justify-between xsm:items-end">
        <div className="relative flex flex-col xsm:top-1">
          <span className="lg:text-xs text-gray-300 xsm:text-sm">Rewards</span>
          <span className="lg:text-base text-white font-bold xsm:text-xl">
            {getUnClaimRewards()}
          </span>
        </div>
        {Object.keys(rewards?.sumRewards || {}).length ? (
          <ClaimAllRewards Button={ClaimButtonInAccount} location="menu" />
        ) : null}
      </div>
    </div>
  );
}

const ClaimButtonInAccount = (props) => {
  const { loading, disabled, ...restProps } = props;
  return (
    <div
      {...restProps}
      className="flex items-center justify-center bg-primary rounded-md cursor-pointer text-sm font-bold text-dark-200 hover:opacity-80 w-20 h-8"
    >
      {loading ? <BeatLoader size={5} color="#16161B" /> : <>Claim</>}
    </div>
  );
};

export const ConnectWalletButton = ({
  accountId,
  className,
  isShort,
  loading,
}: {
  accountId;
  className?: string;
  isShort?: boolean;
  loading?: boolean;
}) => {
  const [isDisclaimerOpen, setDisclaimer] = useState(false);
  const { getDisclaimer: hasAgreedDisclaimer } = useDisclaimer();

  const onWalletButtonClick = async () => {
    if (!hasAgreedDisclaimer) {
      setDisclaimer(true);
      return;
    }
    if (accountId) return;
    trackConnectWallet();
    window.modal.show();
  };

  return (
    <>
      <Button
        size="small"
        className={`${className || ""}`}
        sx={{
          justifySelf: "end",
          alignItems: "center",
          cursor: accountId ? "default" : "pointer",
          color: "#000",
          textTransform: "none",
          fontSize: "16px",
          padding: "0 20px",
          height: className?.includes("h-") ? undefined : "42px",
          borderRadius: "6px",
          ":hover": {
            backgroundColor: "#00F7A5",
            opacity: "0.8",
          },
          backgroundColor: isShort ? "#FF6947" : "#00F7A5",
        }}
        variant={accountId ? "outlined" : "contained"}
        onClick={onWalletButtonClick}
        disableRipple={!!accountId}
      >
        {loading ? <BeatLoader size={4} color="black" /> : <>Connect Wallet</>}
      </Button>
      <Disclaimer isOpen={isDisclaimerOpen} onClose={() => setDisclaimer(false)} />
    </>
  );
};

export default WalletButton;
