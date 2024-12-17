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
import { fetchAccount, logoutAccount } from "../redux/accountSlice";
import { fetchConfig } from "../redux/appSlice";
import { fetchMarginAccount } from "../redux/marginAccountSlice";
import { fetchMarginConfig } from "../redux/marginConfigSlice";
import { ToastMessage } from "../components/ToastMessage";
import Popup from "../components/popup";
import RpcList from "../components/Rpc";
import PubTestModal from "../components/PubTestModal";
import { getAccountId, getAccountPortfolio } from "../redux/accountSelectors";
import { getAssets } from "../redux/assetsSelectors";
import { getConfig } from "../redux/appSelectors";
import { fetchAllPools } from "../redux/poolSlice";
import "./slip.css";

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
    dispatch(fetchAccount());
    dispatch(fetchConfig());
    dispatch(fetchMarginAccount());
    dispatch(fetchMarginConfig());
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
  const portfolio = useAppSelector(getAccountPortfolio);
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
    } else {
      await dispatch(logoutAccount());
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
          <RpcList />
          <PubTestModal />
        </Layout>
      )}
    </div>
  );
}
export default function MyApp({ Component, pageProps }: AppProps) {
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  useEffect(() => {
    router.events.on("routeChangeStart", () => {
      setProgress(30);
    });
    router.events.on("routeChangeComplete", () => {
      setProgress(100);
    });
  }, []);
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
    </ErrorBoundary>
  );
}
