import { useState, useRef } from "react";
import Script from "next/script";
import { useDebounce } from "react-use";
import {
  type ChartingLibraryWidgetOptions,
  type EntityId,
  type IChartingLibraryWidget,
  type ResolutionString,
  type Timezone,
  widget,
} from "../../../public/charting_library";
import datafeed from "./datafeed";
import { storageStore } from "../../../utils/commonUtils";
import { LoadingCircle } from "../../LoadingSpinner";

const tvStorage = storageStore("tradingview");
export default function TradingViewChart() {
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState("NEAR_USDC");
  const tvWidgetRef = useRef<IChartingLibraryWidget>();
  useDebounce(
    () => {
      try {
        setLoading(true);
        initTradingView(symbol);
      } catch (error) {
        console.error("TradingViewChart", error);
      }
    },
    300,
    [symbol],
  );
  function initTradingView(symbol: string) {
    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol,
      theme: "dark",
      datafeed,
      interval: tvStorage?.get("interval") || ("30" as ResolutionString),
      container: "TVChartContainer",
      library_path: "https://assets.deltatrade.ai/assets/static/charting_library/",
      locale: "en",
      disabled_features: [
        "use_localstorage_for_settings",
        "header_symbol_search",
        "header_quick_search",
        "header_screenshot",
        "header_compare",
        "header_fullscreen_button",
        "header_saveload",
      ],
      enabled_features: ["hide_left_toolbar_by_default"],
      charts_storage_url: "https://saveload.tradingview.com",
      charts_storage_api_version: "1.1",
      client_id: "tradingview.com",
      user_id: "public_user_id",
      fullscreen: false,
      autosize: true,
      header_widget_buttons_mode: "compact",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone as Timezone,
      studies_overrides: {},
      loading_screen: {
        backgroundColor: "#23253a",
        foregroundColor: "#23253a",
      },
      overrides: {
        "paneProperties.background": "#23253a",
        "paneProperties.backgroundType": "solid",
        "paneProperties.vertGridProperties.color": "rgba(255,255,255, 0.03)",
        "paneProperties.horzGridProperties.color": "rgba(255,255,255, 0.03)",
        "paneProperties.separatorColor": "transparent",
        "scalesProperties.textColor": "#C0C4E9",
        // "paneProperties.crossHairProperties.color": "red",
      },
      // custom_css_url: "https://img.ref.finance/images/custom-theme.css", // TODO-now
      custom_css_url:
        "https://ref-new-1.s3.us-east-1.amazonaws.com/images/static/charting_library/custom-theme.css", // TODO-now
    };
    tvWidgetRef.current = new widget(widgetOptions);
    tvWidgetRef.current.applyOverrides({
      "mainSeriesProperties.statusViewStyle.symbolTextSource": "ticker",
    });
    tvWidgetRef.current.onChartReady(() => {
      setLoading(false);
      const widget = tvWidgetRef.current;
      if (!widget) return;
      widget
        .chart()
        .onIntervalChanged()
        .subscribe(null, function (interval, obj) {
          tvStorage?.set("interval", interval);
        });
      widget.chart().setChartType(10); // 1: Candles 10: Baseline
      widget.activeChart().createStudy("Volume", true, false, { id: "volume", visible: true });
      widget?.headerReady().then(() => {
        const button = widget.createButton({ align: "right", useTradingViewStyle: false });
        button.addEventListener("click", function () {
          const ele = document.querySelector("#TVChartContainer");
          ele?.classList.toggle("fullscreen");
          if (ele?.classList.contains("fullscreen")) {
            button.innerHTML = exitFullscreenIcon;
            button.setAttribute("title", "Exit Fullscreen");
          } else {
            button.innerHTML = fullscreenIcon;
            button.setAttribute("title", "Fullscreen");
          }
        });
        button.innerHTML = fullscreenIcon;
        button.setAttribute("title", "Fullscreen");
        button.style.cursor = "pointer";
      });
    });
  }
  return (
    <>
      {/* <Script src="https://assets.deltatrade.ai/assets/static/charting_library/charting_library.standalone.js" />  TODO-now */}
      <div className="flex items-center justify-center relative w-full h-full">
        {loading ? <LoadingCircle className="absolute animate-spin" /> : null}
        <div id="TVChartContainer" className="w-full h-full" />
      </div>
    </>
  );
}

const fullscreenIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
<path fill="currentColor" d="M5 19h2.923q.213 0 .356.144t.144.357q0 .212-.144.356q-.143.143-.356.143H4.808q-.344 0-.576-.232Q4 19.536 4 19.192v-3.115q0-.213.144-.356q.144-.144.357-.144q.212 0 .356.144q.143.143.143.356zm14.02 0v-2.923q0-.213.143-.356t.357-.144q.213 0 .356.144q.143.143.143.356v3.115q0 .344-.232.576q-.232.232-.575.232h-3.116q-.212 0-.356-.144t-.144-.357q0-.212.144-.356q.144-.143.356-.143zM5 5v2.923q0 .213-.144.356t-.357.144q-.212 0-.356-.144Q4 8.136 4 7.923V4.808q0-.344.232-.576Q4.464 4 4.808 4h3.115q.213 0 .356.144q.144.144.144.357q0 .212-.144.356Q8.136 5 7.923 5zm14.02 0h-2.924q-.212 0-.356-.144t-.144-.357q0-.212.144-.356q.144-.143.356-.143h3.116q.343 0 .575.232q.232.232.232.576v3.115q0 .213-.144.356q-.144.144-.356.144q-.213 0-.356-.144q-.144-.143-.144-.356z" />
</svg>`;

const exitFullscreenIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
<path fill="currentColor" d="M7.423 20v-3.423H4v-1h4.423V20zm8.173 0v-4.423h4.423v1h-3.423V20zM4 8.423v-1h3.423V4h1v4.423zm11.596 0V4h1v3.423h3.423v1z" />
</svg>`;
