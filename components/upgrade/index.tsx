import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { getAccountId, getAccountPortfolio } from "../../redux/accountSelectors";
import { getAssets } from "../../redux/assetsSelectors";
import { getConfig, getConfigMEME } from "../../redux/appSelectors";
import { fetchAssets, fetchRefPrices } from "../../redux/assetsSlice";
import { fetchConfig } from "../../redux/appSlice";
import { fetchConfig as fetchConfigMEME } from "../../redux/appSliceMEME";
import { fetchAccount, logoutAccount } from "../../redux/accountSlice";
import { logoutAccount as logoutAccountMEME } from "../../redux/accountSliceMEME";
import RpcList from "../Rpc";
import { Layout, Modal } from "..";
import { ToastMessage } from "../ToastMessage";
import BalanceReminder from "../BalanceReminder";
import PubTestModal from "../PubTestModal";
import OneClickBtcResultModal from "../Modal/oneClickBtcResultModal";
import Init from "../appInit";
import { RefreshIcon } from "../Header/svg";
import { addUserWallet } from "../../services/common";

export default function Upgrade({ Component, pageProps }) {
  const [upgrading, setUpgrading] = useState<boolean>(true);
  const dispatch = useAppDispatch();
  const accountId = useAppSelector(getAccountId);
  const portfolio = useAppSelector(getAccountPortfolio());
  const assets = useAppSelector(getAssets);
  const config = useAppSelector(getConfig);
  const configMEME = useAppSelector(getConfigMEME);
  useEffect(() => {
    if (
      !portfolio.positions ||
      !Object.keys(assets?.data || {}).length ||
      !config?.booster_token_id ||
      !configMEME?.booster_token_id
    ) {
      setUpgrading(true);
      fetch();
    } else {
      setUpgrading(false);
    }
  }, [
    accountId,
    portfolio.positions,
    Object.keys(assets?.data || {}).length,
    JSON.stringify(config || {}),
    JSON.stringify(configMEME || {}),
  ]);
  const selectedWalletId = window.selector?.store?.getState()?.selectedWalletId;
  useEffect(() => {
    if (accountId && selectedWalletId) {
      const selectedWalletId = window.selector?.store?.getState()?.selectedWalletId;
      const walletType =
        selectedWalletId == "btc-wallet"
          ? JSON.parse(localStorage.getItem("SATOSHI_WALLET_DEFAULT:current-connector-id") || "")
          : selectedWalletId;
      addUserWallet({
        account_id: accountId,
        wallet_address: walletType,
      });
    }
  }, [accountId, selectedWalletId]);
  async function fetch() {
    localStorage.removeItem("persist:root");
    await dispatch(fetchAssets()).then(() => dispatch(fetchRefPrices()));
    await dispatch(fetchConfig());
    await dispatch(fetchConfigMEME());
    if (accountId) {
      await dispatch(fetchAccount());
      // await dispatch(fetchAccountMEME()); No need to obtain a meme account when upgrading
    } else {
      await dispatch(logoutAccount());
      await dispatch(logoutAccountMEME());
    }
  }
  return (
    <div>
      {upgrading ? (
        <div className="flex flex-col items-center justify-center  h-screen">
          <RefreshIcon className="flex-shrink-0 animate-spin h-6 w-6" />
          <span className="flex items-center text-sm text-gray-300 mt-2">
            Refreshing assets data...
          </span>
          <RpcList />
        </div>
      ) : (
        <Layout>
          {/* <Popup className="lg:hidden" /> */}
          <Init />
          <Modal />
          <ToastMessage />
          <Component {...pageProps} />
          {/* <Popup className="xsm:hidden" /> */}
          <BalanceReminder />
          <RpcList />
          <PubTestModal />
          <OneClickBtcResultModal />
        </Layout>
      )}
    </div>
  );
}
