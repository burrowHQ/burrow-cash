import Decimal from "decimal.js";
import dayjs from "dayjs";
import {
  type ChartingLibraryWidgetOptions,
  type DatafeedConfiguration,
  type ResolutionString,
} from "../../../public/charting_library";
import { pairServices } from "../../../services/tradingView";
import { SymbolInfo, SearchSymbolResultItemInfo } from "../../../interfaces/tradingView";
import { store } from "../../../redux/store";
import { standardizeAsset } from "../../../utils";

const lastBarsCache = new Map();
const supported_resolutions = ["1", "5", "15", "30", "1H", "1D", "1W", "1M"] as ResolutionString[];
const configurationData: DatafeedConfiguration = {
  supported_resolutions,
  exchanges: [
    {
      value: "Rhea Lending",
      name: "Rhea Lending",
      desc: "Rhea Lending",
    },
  ],
  supports_marks: true,
  supports_timescale_marks: true,
};
const getAllSymbols = async (isMeme?: boolean) => {
  const currentState = store.getState();
  const {
    marginConfig: marginConfigMain,
    assets: assetsMain,
    assetsMEME,
    marginConfigMEME,
  } = currentState;
  const baseIds: string[] = [];
  const quoteIds: string[] = [];
  const assets = isMeme ? assetsMEME : assetsMain;
  const marginConfig = isMeme ? marginConfigMEME : marginConfigMain;
  Object.entries(marginConfig.registered_tokens).forEach(([id, level]) => {
    if (level == 1) baseIds.push(id);
    if (level == 2) quoteIds.push(id);
  });
  const supportPairs: SearchSymbolResultItemInfo[] = [];
  baseIds.forEach((baseId) => {
    const baseMeta = standardizeAsset(assets.data[baseId].metadata);
    const baseSymbol = baseMeta.symbol;
    quoteIds.forEach((quoteId) => {
      const quoteMeta = standardizeAsset(assets.data[quoteId].metadata);
      const quoteSymbol = quoteMeta.symbol;
      supportPairs.push({
        description: `${baseSymbol}/${quoteSymbol}`,
        exchange: "Rhea Lending",
        full_name: `${baseSymbol}/${quoteSymbol}`,
        symbol: `${baseSymbol}_${quoteSymbol}`,
        type: "crypto",
        base: baseId,
        quote: quoteId,
      });
    });
  });
  return supportPairs;
};
function getPairDecimals(symbolInfo: SearchSymbolResultItemInfo, isMeme?: boolean) {
  const currentState = store.getState();
  const { assets: assetsMain, assetsMEME } = currentState;
  const assets = isMeme ? assetsMEME : assetsMain;
  const { base, quote } = symbolInfo;
  const basePrice = assets.data?.[base]?.price?.usd || 0;
  const quotePrice = assets.data?.[quote]?.price?.usd || 0;
  if (!+basePrice || !+quotePrice) return 2;
  const pair_price_decimal = new Decimal(basePrice).div(quotePrice);
  const pair_price = new Decimal(basePrice).div(quotePrice).toFixed();
  if (pair_price_decimal.gte(1)) {
    return 2;
  } else {
    const decimalPart = pair_price.split(".")[1] || "";
    const leadingZeros = decimalPart.match(/^0*/)?.[0].length || 0;
    return leadingZeros + 2;
  }
}

let pullingQueryPriceTimer: any = null;
let currentSymbolInfo: SymbolInfo | null = null;

function getDataFeed(isMeme?: boolean) {
  const datafeed: ChartingLibraryWidgetOptions["datafeed"] = {
    onReady: (callback) => {
      setTimeout(() => callback(configurationData));
    },

    searchSymbols: async (userInput, exchange, symbolType, onResultReadyCallback) => {
      const symbols = await getAllSymbols(isMeme);
      onResultReadyCallback(
        symbols.filter(
          ({ symbol, full_name }) =>
            symbol.toLowerCase().includes(userInput.toLowerCase()) ||
            full_name.toLowerCase().includes(userInput.toLowerCase()),
        ),
      );
    },

    resolveSymbol: async (
      symbolName,
      onSymbolResolvedCallback,
      onResolveErrorCallback,
      extension,
    ) => {
      const symbols = await getAllSymbols(isMeme);
      const symbolItem = symbols.find(
        ({ symbol, full_name }) =>
          symbol.toLowerCase().includes(symbolName.toLowerCase()) ||
          full_name.toLowerCase().includes(symbolName.toLowerCase()),
      );
      if (!symbolItem) {
        onResolveErrorCallback("cannot resolve symbol");
        return;
      }
      const priceDecimals = getPairDecimals(symbolItem, isMeme);
      const symbolInfo: SymbolInfo = {
        ticker: symbolItem.full_name,
        name: symbolItem.full_name,
        description: symbolItem.description,
        type: symbolItem.type,
        session: "24x7",
        timezone: "Etc/UTC",
        exchange: symbolItem.exchange,
        minmov: 1,
        pricescale: 10 ** priceDecimals,
        has_intraday: true,
        visible_plots_set: "ohlc",
        has_weekly_and_monthly: true,
        supported_resolutions: configurationData.supported_resolutions ?? [],
        volume_precision: priceDecimals,
        data_status: "streaming",
        full_name: symbolItem.full_name,
        listed_exchange: "",
        format: "price",
        base: symbolItem.base,
        quote: symbolItem.quote,
      };
      onSymbolResolvedCallback(symbolInfo);
      return "";
    },

    getBars: async (
      symbolInfo: SymbolInfo,
      resolution,
      periodParams,
      onHistoryCallback,
      onErrorCallback,
    ) => {
      const { from, to, firstDataRequest } = periodParams;
      let _from = from;
      if (resolution === "1D") {
        _from = dayjs().subtract(1, "month").startOf("day").valueOf() / 1000;
      } else if (resolution === "1W") {
        _from = dayjs().subtract(6, "week").startOf("week").valueOf() / 1000;
      } else if (resolution === "1M") {
        _from = dayjs().subtract(1, "year").startOf("month").valueOf() / 1000;
      }
      try {
        const data = await pairServices.queryTradingViewHistory({
          symbolInfo,
          resolution,
          from: _from,
          to,
        });

        if (!data || data["s"] !== "ok") {
          onHistoryCallback([], { noData: true });
          return;
        }

        const bars = data["t"]
          .map((time, i) => {
            return {
              time,
              low: data["l"][i],
              high: data["h"][i],
              open: data["o"][i],
              close: data["c"][i],
              volume: data["v"][i],
            };
          })
          .filter((bar) => bar.time >= _from * 1000 && bar.time <= to * 1000); // Filter bars within the requested period

        if (bars.length === 0) {
          onHistoryCallback([], { noData: true });
          return;
        }

        if (firstDataRequest) {
          lastBarsCache.set(symbolInfo.full_name, {
            ...bars[bars.length - 1],
          });
        }
        onHistoryCallback(bars, { noData: false });
      } catch (error: any) {
        console.error("getBars error", error);
        onHistoryCallback([], { noData: true });
        onErrorCallback(error);
      }
      onHistoryCallback([], { noData: true });
    },

    subscribeBars: (
      symbolInfo: SymbolInfo,
      resolution,
      onRealtimeCallback,
      subscriberId,
      onResetCacheNeededCallback,
    ) => {
      if (pullingQueryPriceTimer) {
        clearInterval(pullingQueryPriceTimer);
      }
      currentSymbolInfo = symbolInfo;
      const fetchPrice = async () => {
        if (!currentSymbolInfo?.name) return;
        const { base, quote } = currentSymbolInfo;
        const pairId = `${base}:${quote}`;
        const pairPrice = await pairServices.queryPairPrice(pairId);
        console.log("subscribe price", currentSymbolInfo.name, pairPrice[pairId]?.pairPrice);
        const price = Number(pairPrice?.[pairId]?.pairPrice || 0);
        const bar = {
          time: Date.now(),
          low: price,
          high: price,
          open: price,
          close: price,
          volume: 0,
        };

        onRealtimeCallback(bar);
      };
      pullingQueryPriceTimer = setInterval(fetchPrice, 30000);
    },

    unsubscribeBars: (id) => {
      console.log("unsubscribeBars", id);
      id === "custom" && clearInterval(pullingQueryPriceTimer);
    },
  };
  return datafeed;
}

export default getDataFeed;
