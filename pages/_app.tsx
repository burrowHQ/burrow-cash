import { useEffect, useState } from "react";
import Head from "next/head";
import { Provider } from "react-redux";
import type { AppProps } from "next/app";
import { PersistGate } from "redux-persist/integration/react";
import { init, ErrorBoundary } from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import posthogJs from "posthog-js";
import { useIdle, useInterval } from "react-use";
import ModalReact from "react-modal";

import "../styles/global.css";
import LoadingBar from "react-top-loading-bar";
import { useRouter } from "next/router";
import { store, persistor } from "../redux/store";
import { FallbackError, Layout, Modal } from "../components";
import { posthog, isPostHogEnabled } from "../utils/telemetry";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { fetchAssets, fetchRefPrices } from "../redux/assetsSlice";
import { fetchAssetsMEME } from "../redux/assetsSliceMEME";
import { fetchAccount, logoutAccount } from "../redux/accountSlice";
import { fetchAccountMEME, logoutAccount as logoutAccountMEME } from "../redux/accountSliceMEME";
import { fetchConfig } from "../redux/appSlice";
import { fetchConfig as fetchMemeConfig } from "../redux/appSliceMEME";
import { fetchMarginAccount } from "../redux/marginAccountSlice";
import { fetchMarginAccountMEME } from "../redux/marginAccountSliceMEME";
import { fetchMarginConfig } from "../redux/marginConfigSlice";
import { fetchMarginConfigMEME } from "../redux/marginConfigSliceMEME";
import { ToastMessage } from "../components/ToastMessage";
import RpcList from "../components/Rpc";
import PubTestModal from "../components/PubTestModal";
import { getAccountId, getAccountPortfolio } from "../redux/accountSelectors";
import { getAssets } from "../redux/assetsSelectors";
import { getConfig } from "../redux/appSelectors";
import { fetchAllPools } from "../redux/poolSlice";
import "./slip.css";
import { get_blocked } from "../api/get-blocked";
import Popup from "../components/popup";
import BalanceReminder from "../components/BalanceReminder";

ModalReact.defaultStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(20, 22, 43, 0.8)",
    zIndex: 100,
    outline: "none",
  },
  content: {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -65%)",
    outline: "none",
  },
};

ModalReact.setAppElement("#root");

const SENTRY_ORG = process.env.NEXT_PUBLIC_SENTRY_ORG as string;
const SENTRY_PID = process.env.NEXT_PUBLIC_SENTRY_PID as unknown as number;

const integrations = [new Integrations.BrowserTracing()] as Array<
  Integrations.BrowserTracing | any
>;

if (isPostHogEnabled) {
  integrations.push(new posthogJs.SentryIntegration(posthog, SENTRY_ORG, SENTRY_PID));
}

init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_DEFAULT_NETWORK,
  integrations,
  tracesSampleRate: 0.1,
  release: "v1",
});

const IDLE_INTERVAL = 90e3;
const REFETCH_INTERVAL = 60e3;

const Init = () => {
  const isIdle = useIdle(IDLE_INTERVAL);
  const dispatch = useAppDispatch();

  const fetchData = () => {
    dispatch(fetchAssets()).then(() => dispatch(fetchRefPrices()));
    dispatch(fetchAssetsMEME()).then(() => dispatch(fetchRefPrices()));
    dispatch(fetchAccount());
    dispatch(fetchAccountMEME());
    dispatch(fetchConfig());
    dispatch(fetchMemeConfig());
    dispatch(fetchMarginAccount());
    dispatch(fetchMarginAccountMEME());
    dispatch(fetchMarginConfig());
    dispatch(fetchMarginConfigMEME());
    dispatch(fetchAllPools());
  };
  useEffect(fetchData, []);
  useInterval(fetchData, !isIdle ? REFETCH_INTERVAL : null);

  return null;
};
function Upgrade({ Component, pageProps }) {
  const [upgrading, setUpgrading] = useState<boolean>(true);
  const dispatch = useAppDispatch();
  const accountId = useAppSelector(getAccountId);
  const portfolio = useAppSelector(getAccountPortfolio());
  const assets = useAppSelector(getAssets);
  const config = useAppSelector(getConfig);
  useEffect(() => {
    if (
      !portfolio.positions ||
      !Object.keys(assets?.data || {}).length ||
      !config?.booster_token_id
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
  ]);
  async function fetch() {
    localStorage.removeItem("persist:root");
    await dispatch(fetchAssets()).then(() => dispatch(fetchRefPrices()));
    await dispatch(fetchConfig());
    if (accountId) {
      await dispatch(fetchAccount());
      await dispatch(fetchAccountMEME());
    } else {
      await dispatch(logoutAccount());
      await dispatch(logoutAccountMEME());
    }
  }
  return (
    <div>
      {upgrading ? (
        <div className="flex flex-col items-center justify-center  h-screen">
          <img src="/loading-brrr.gif" alt="" width="75px" />
          <span className="flex items-center text-sm text-gray-300 mt-2">
            Refreshing assets data...
          </span>
          <RpcList />
        </div>
      ) : (
        <Layout>
          <Popup className="lg:hidden" />
          <Init />
          <Modal />
          <ToastMessage />
          <Component {...pageProps} />
          <Popup className="xsm:hidden" />
          <BalanceReminder />
          <RpcList />
          <PubTestModal />
        </Layout>
      )}
    </div>
  );
}
export default function MyApp({ Component, pageProps }: AppProps) {
  const [progress, setProgress] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const blockFeatureEnabled = true;
  // const blockFeatureEnabled = false;
  const router = useRouter();
  useEffect(() => {
    if (blockFeatureEnabled) {
      checkBlockedStatus();
    }
  }, [blockFeatureEnabled]);
  useEffect(() => {
    router.events.on("routeChangeStart", () => {
      setProgress(30);
    });
    router.events.on("routeChangeComplete", () => {
      setProgress(100);
    });
  }, []);
  function checkBlockedStatus() {
    get_blocked().then((res) => {
      if (res.blocked === true) {
        const blockConfirmationTime = localStorage.getItem("blockConfirmationTime");
        if (blockConfirmationTime) {
          const currentTime = new Date().getTime();
          const weekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
          if (currentTime - parseInt(blockConfirmationTime, 10) < weekInMilliseconds) {
            setIsBlocked(false);
          } else {
            setIsBlocked(true);
          }
        } else {
          setIsBlocked(true);
        }
      }
    });
  }
  function handleBlockConfirmation() {
    const currentTime = new Date().getTime();
    localStorage.setItem("blockConfirmationTime", currentTime.toString());
    setIsBlocked(false);
  }
  return (
    <ErrorBoundary fallback={FallbackError}>
      <LoadingBar
        color="#D2FF3A"
        height={3}
        progress={progress}
        onLoaderFinished={() => setProgress(0)}
      />
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <Head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Burrow Finance</title>
          </Head>
          <Upgrade Component={Component} pageProps={pageProps} />
        </PersistGate>
      </Provider>
      {isBlocked && blockFeatureEnabled && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center"
          style={{
            zIndex: "999999999",
            backdropFilter: "blur(6px)",
            height: "100vh",
            overflow: "hidden",
          }}
        >
          <div
            className="text-white text-center bg-dark-100 px-5 pt-9 pb-7 rounded-md border border-dark-300"
            style={{ width: "278px" }}
          >
            <p className="text-sm">
              You are prohibited from accessing app.burrow.finance due to your location or other
              infringement of the Terms of Services.
            </p>
            <div
              onClick={handleBlockConfirmation}
              className="mt-6 border border-primary h-9 flex items-center justify-center rounded-md text-sm text-black text-primary cursor-pointer ml-1.5 mr-1.5"
            >
              Confirm
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}
