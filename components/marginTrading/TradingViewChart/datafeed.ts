import dayjs from "dayjs";
import {
  type ChartingLibraryWidgetOptions,
  type DatafeedConfiguration,
  type ResolutionString,
  type SearchSymbolResultItem,
  type LibrarySymbolInfo,
} from "../../../public/charting_library";
import { pairServices } from "../../../services/tradingView";

interface SymbolInfo extends LibrarySymbolInfo {
  full_name: string;
}

const lastBarsCache = new Map();

const supported_resolutions = ["1", "5", "15", "30", "1H", "1D", "1W", "1M"] as ResolutionString[];

const configurationData: DatafeedConfiguration = {
  supported_resolutions,
  exchanges: [
    {
      value: "Burrow",
      name: "Burrow",
      desc: "Burrow",
    },
  ],
  supports_marks: true,
  supports_timescale_marks: true,
};

const getAllSymbols = async () => {
  // TODO-now query from margin_config
  const supportPairs = [
    {
      description: "NEAR/USDC",
      exchange: "Burrow",
      full_name: "NEAR/USDC",
      symbol: "NEAR_USDC",
      type: "crypto",
    },
  ] as SearchSymbolResultItem[];
  return supportPairs;
};
function getPairDecimals(symbol: string) {
  // TODO-now caculate by token price
  return 2;
}

let pullingQueryPriceTimer: any = null;
let currentSymbolInfo: SymbolInfo | null = null;

const datafeed: ChartingLibraryWidgetOptions["datafeed"] = {
  onReady: (callback) => {
    setTimeout(() => callback(configurationData));
  },

  searchSymbols: async (userInput, exchange, symbolType, onResultReadyCallback) => {
    const symbols = await getAllSymbols();
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
    const symbols = await getAllSymbols();
    const symbolItem = symbols.find(
      ({ symbol, full_name }) =>
        symbol.toLowerCase().includes(symbolName.toLowerCase()) ||
        full_name.toLowerCase().includes(symbolName.toLowerCase()),
    );
    if (!symbolItem) {
      onResolveErrorCallback("cannot resolve symbol");
      return;
    }
    const priceDecimals = getPairDecimals(symbolItem.symbol);
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
        symbol: symbolInfo.ticker ?? "",
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
      const [base, quote] = currentSymbolInfo.name.includes("_")
        ? currentSymbolInfo.name.split("_")
        : currentSymbolInfo.name.split("/");
      // TODO-now query token id by symbol
      // const pairId = `${getTokenAddress(base)}:${getTokenAddress(quote)}`;
      const pairId = "wrap.near:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";
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

export default datafeed;
