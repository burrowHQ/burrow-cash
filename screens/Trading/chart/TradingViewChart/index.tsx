import { type Ref, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Script from "next/script";
import { formatMessage } from "@formatjs/intl";
import {
  type ChartingLibraryWidgetOptions,
  type EntityId,
  type IChartingLibraryWidget,
  LanguageCode,
  type ResolutionString,
  type Timezone,
  widget,
} from "../../../../public/static/charting_library";
import datafeed from "./datafeed";
import Loading from "../loading";
import { useDebouncedEffect } from "../../../../hooks/useDebouncedEffect";
import { useLocale, useTranslate } from "../../../../hooks/useLocale";
import { formatFileUrl } from "../../../../utils/format";

export type TradingViewChartProps = { symbol: string; className?: string; onLoaded?: () => void };
export type TradingViewChartExposes =
  | {
      setHorizontalLines: (params: Record<string, number[]>) => void;
      setRectangle: (min: number, max: number) => void;
      resetChart: () => void;
    }
  | undefined;

export default forwardRef(TradingViewChart);

function TradingViewChart(
  { className, symbol, onLoaded }: TradingViewChartProps,
  ref: Ref<TradingViewChartExposes>,
) {
  useImperativeHandle(ref, () => ({ setHorizontalLines, setRectangle, resetChart }));

  const t = (key: string) => {
    return key;
  };
  const tvWidgetRef = useRef<IChartingLibraryWidget>();

  const [loading, setLoading] = useState(false);

  useDebouncedEffect(
    () => {
      try {
        console.log("symbol", symbol);
        if (!symbol) return;
        if (!tvWidgetRef.current || loading) initTradingView(symbol);
        else {
          tvWidgetRef.current?.setSymbol(symbol, getStoredInterval(), resetChart);
        }
      } catch (error) {
        console.error("TradingViewChart", error);
      }
    },
    [symbol],
    50,
  );

  const locale = "en";

  function initTradingView(symbol: string) {
    console.log(symbol, "symbol");
    setLoading(true);
    console.log("initTradingView", symbol);
    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol,
      theme: "dark",
      datafeed,

      interval: getStoredInterval(),
      container: "TVChartContainer",
      library_path: formatFileUrl("/static/charting_library/"),
      locale,
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
      // toolbar_bg: "#E6E6E6",
      // loading_screen: {
      //   backgroundColor: "#E6E6E6",
      //   foregroundColor: "#E6E6E6",
      // },
      // overrides: {
      //   "paneProperties.background": "#E6E6E6",
      //   "paneProperties.backgroundType": "solid",
      // },
      custom_css_url: "./custom-theme.css",
    };

    tvWidgetRef.current = new widget(widgetOptions);
    tvWidgetRef.current.applyOverrides({
      "mainSeriesProperties.statusViewStyle.symbolTextSource": "ticker",
    });
    tvWidgetRef.current.onChartReady(() => {
      setLoading(false);
      onLoaded?.();
      const widget = tvWidgetRef.current;
      if (!widget) return;
      // https://www.tradingview.com/charting-library-docs/latest/api/enums/Charting_Library.SeriesType
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

  function resetChart(ids?: EntityId[]) {
    const chart = tvWidgetRef.current?.activeChart();
    if (ids) {
      ids.forEach((id) => {
        chart?.removeEntity(id);
      });
    } else {
      const shapes = chart?.getAllShapes();
      shapes?.forEach((shape) => {
        chart?.removeEntity(shape.id);
      });
    }
  }

  const shapeEntityIds = useRef<EntityId[]>([]);

  function setHorizontalLines(params: Record<string, number[]>) {
    if (shapeEntityIds.current.length > 0) {
      resetChart(shapeEntityIds.current);
      shapeEntityIds.current = [];
    }

    Object.keys(params).forEach((key) => {
      const prices = params[key];
      if (!prices.length) return;
      params[key].forEach((price) => {
        const res = tvWidgetRef.current?.activeChart().createShape(
          { time: 0, price },
          {
            shape: "horizontal_line",
            lock: true,
            disableSelection: true,
            disableSave: true,
            disableUndo: true,
            text: key === "wait" ? t("TrandingView.Wait") : "",
            overrides: {
              showLabel: key === "wait",
              showPrice: false,
              linecolor: key === "buy" ? "#00A368" : key === "sell" ? "#EA3F68" : "#BBBBBB",
              linewidth: 2,
              linestyle: key === "wait" ? 1 : 0,
              textcolor: "#AAA",
              vertLabelsAlign: "middle",
            },
            zOrder: "top",
          },
        );
        if (res) {
          shapeEntityIds.current.push(res);
        }
      });
    });
  }

  const rectangleEntityIds = useRef<EntityId[]>([]);

  function setRectangle(min: number, max: number) {
    const startTime = Math.floor(Date.now() / 1000); // 当前时间（以秒为单位）
    const endTime = startTime + 2 * 86400;
    if (rectangleEntityIds.current.length > 0) {
      resetChart(rectangleEntityIds.current);
      rectangleEntityIds.current = [];
    }
    const res = tvWidgetRef.current?.activeChart().createMultipointShape(
      [
        { time: startTime, price: min },
        { time: endTime, price: max },
      ],
      {
        shape: "rectangle",
        lock: true,
        disableSelection: true,
        disableSave: true,
        disableUndo: true,
        text: "Mining Range",
        overrides: {
          showLabel: true,
          backgroundColor: "rgba(249, 216, 22, 0.08)",
          color: "#F9D816",
          textColor: "#AAA",
          vertLabelsAlign: "bottom",
          horzLabelsAlign: "right",
          extendLeft: true,
          extendRight: true,
        },
        zOrder: "top",
      },
    );
    if (res) {
      rectangleEntityIds.current.push(res);
    }
  }

  return (
    <>
      <Script src={formatFileUrl("/static/charting_library/charting_library.standalone.js")} />
      <div className="relative h-full">
        <Loading loading={loading}>
          <div id="TVChartContainer" className={`w-full ${className}`} />
        </Loading>
      </div>
    </>
  );
}

function getStoredInterval() {
  const intervalStorageValue = localStorage.getItem(
    "tradingview.chart.lastUsedTimeBasedResolution",
  );
  return (intervalStorageValue ?? "5") as ResolutionString;
}

const fullscreenIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M5 19h2.923q.213 0 .356.144t.144.357q0 .212-.144.356q-.143.143-.356.143H4.808q-.344 0-.576-.232Q4 19.536 4 19.192v-3.115q0-.213.144-.356q.144-.144.357-.144q.212 0 .356.144q.143.143.143.356zm14.02 0v-2.923q0-.213.143-.356t.357-.144q.213 0 .356.144q.143.143.143.356v3.115q0 .344-.232.576q-.232.232-.575.232h-3.116q-.212 0-.356-.144t-.144-.357q0-.212.144-.356q.144-.143.356-.143zM5 5v2.923q0 .213-.144.356t-.357.144q-.212 0-.356-.144Q4 8.136 4 7.923V4.808q0-.344.232-.576Q4.464 4 4.808 4h3.115q.213 0 .356.144q.144.144.144.357q0 .212-.144.356Q8.136 5 7.923 5zm14.02 0h-2.924q-.212 0-.356-.144t-.144-.357q0-.212.144-.356q.144-.143.356-.143h3.116q.343 0 .575.232q.232.232.232.576v3.115q0 .213-.144.356q-.144.144-.356.144q-.213 0-.356-.144q-.144-.143-.144-.356z" />
  </svg>`;

const exitFullscreenIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M7.423 20v-3.423H4v-1h4.423V20zm8.173 0v-4.423h4.423v1h-3.423V20zM4 8.423v-1h3.423V4h1v4.423zm11.596 0V4h1v3.423h3.423v1z" />
  </svg>`;
