import Head from "next/head";
import { Provider } from "react-redux";
import { BtcWalletSelectorContextProvider } from "btc-wallet";
import type { AppProps } from "next/app";
import { PersistGate } from "redux-persist/integration/react";
import { ErrorBoundary } from "@sentry/react";
import dynamic from "next/dynamic";
import { store, persistor } from "../redux/store";
import { FallbackError } from "../components";
import Upgrade from "../components/upgrade";
import ProcessBar from "../components/process";
import BlockContryTip from "../components/blockTip";
import "../styles/global.css";

const ModalGAPrivacy = dynamic(() => import("../components/modalGAPrivacy/modalGAPrivacy"), {
  ssr: false,
});

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary fallback={FallbackError}>
      <ProcessBar />
      <BlockContryTip />
      <BtcWalletSelectorContextProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <Head>
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>Burrow Finance</title>
            </Head>
            <Upgrade Component={Component} pageProps={pageProps} />
            <ModalGAPrivacy />
          </PersistGate>
        </Provider>
      </BtcWalletSelectorContextProvider>
    </ErrorBoundary>
  );
}
