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
import { GuideProvider } from "../components/BeginnerGuide/GuideContext";

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
            <GuideProvider>
              <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>RHEA Finance</title>
              </Head>
              <Upgrade Component={Component} pageProps={pageProps} />
              <ModalGAPrivacy />
            </GuideProvider>
          </PersistGate>
        </Provider>
      </BtcWalletSelectorContextProvider>
    </ErrorBoundary>
  );
}
