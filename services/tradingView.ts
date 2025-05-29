import { SymbolInfo, SearchSymbolResultItemInfo } from "../interfaces/tradingView";

const apiDomain = "https://api.deltatrade.ai/api";
interface PairPrice {
  pair_id: string;
  basePrice: string;
  quotePrice: string;
  pairPrice: string;
}
interface KlineItem {
  pair: string;
  price: string;
  low: string;
  high: string;
  time: number;
}

export const pairServices = {
  async query() {
    const res = await fetch(`${apiDomain}/pair/list?type=all`);
    const data = await res.json();
    const list = data.data || [];
    return (
      list?.map((item) => {
        const symbol = `${item.base_token.symbol}_${item.quote_token.symbol}`;
        return {
          ...item,
          symbol,
        };
      }) || []
    );
  },
  async queryPrice() {
    const res = await fetch(`${apiDomain}/prices`);
    const data = await res.json();
    const prices = data.data || {};
    return prices;
  },
  async queryDeltaKline(params: { pair_id: string; start: number; end: number; limit: number }) {
    const { pair_id, start, end, limit } = params;
    const pair_id_replace1 = pair_id.replace(
      "usdt.tether-token.near",
      "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
    );
    const pair_id_replace2 = pair_id_replace1.replace(
      "6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near",
      "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
    );
    if (!pair_id) return [];
    const res = await fetch(
      `${apiDomain}/klines?pair_id=${pair_id_replace2}&start=${start}&end=${end}&limit=${limit}`,
    );
    const data = await res.json();
    return data.data || [];
  },
  async queryPairPrice(pair_id: string | string[]) {
    const ids: string[] = Array.isArray(pair_id) ? pair_id : [pair_id];
    const pairs = await this.query();
    const prices = await this.queryPrice();
    const result = {} as Record<string, PairPrice>;
    ids.map((id) => {
      const [baseToken, quoteToken] = id.split(":");
      const basePrice = prices?.[baseToken] || "0";
      const quotePrice = prices?.[quoteToken] || "0";
      const pairPrice = pairs.find((p) => p.pair_id === id)?.pair_price || "0";
      result[id] = { pair_id: id, basePrice, quotePrice, pairPrice };
    });
    return result;
  },
  async queryTradingViewHistory(params: {
    symbolInfo: SymbolInfo;
    resolution: string;
    from: number;
    to: number;
  }) {
    try {
      return mockData(params);
    } catch (error) {
      console.log("fetch tv data error");
    }
  },
};
async function mockData(params: {
  symbolInfo: SymbolInfo;
  resolution: string;
  from: number;
  to: number;
}) {
  if (!params.symbolInfo) return;
  const { base, quote } = params.symbolInfo;
  const pairId = `${base}:${quote}`;
  let priceData: {
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
    time: number;
  }[] = [];

  const resolutionMapping: Record<string, number> = {
    "1": 1, // 1 minute
    "5": 5, // 5 minutes
    "15": 15, // 15 minutes
    "30": 30, // 30 minutes
    "60": 60, // 1 hour
    "1D": 1440, // 1 day (24 hours * 60 minutes)
    "1W": 10080, // 1 week (7 days * 24 hours * 60 minutes)
    "1M": 43200, // 1 month (30 days * 24 hours * 60 minutes)
  };
  const interval = resolutionMapping[params.resolution];
  const determineMinimumInterval = (interVal: number): number => {
    if (!interVal) return 1;

    if (interVal >= 1440) {
      // 1 day or more
      return 1440; // 1 day in minutes
    } else if (interVal >= 60) {
      // 1 hour or more
      return 60; // 1 hour in minutes
    } else if (interVal >= 15) {
      // 15 minutes or more
      return 15; // 15 minutes
    } else if (interVal >= 5) {
      // 5 minutes or more
      return 5; // 5 minutes
    } else {
      return 1; // default to 1 minute for smallest intervals
    }
  };
  // minutes diff
  const timeDiff = (params.to - params.from) / 60;
  const limit = Math.floor(timeDiff / interval);
  const res = (await pairServices.queryDeltaKline({
    pair_id: pairId,
    start: params.from * 1000,
    end: params.to * 1000,
    limit: limit || 1,
  })) as KlineItem[];
  const klineData = res.map((item) => ({
    name: item.time,
    value: Number(item.price),
  }));
  const pairPrice = await pairServices.queryPairPrice(pairId);
  const price = Number(pairPrice[pairId].pairPrice);
  if (klineData.length) {
    priceData = convertToTradingView(
      klineData,
      price,
      interval * 60,
      determineMinimumInterval(interval) * 60,
      interval <= 5 ? 0 : 0.006,
    );
  } else {
    priceData = Array.from({ length: limit }).map((_, i) => ({
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 0,
      time: params.to - (100 - i) * interval * 60,
    }));
  }
  return {
    s: "ok",
    a: priceData.map((d) => d.close),
    t: priceData.map((d) => d.time),
    c: priceData.map((d) => d.close),
    o: priceData.map((d) => d.open),
    h: priceData.map((d) => d.high),
    l: priceData.map((d) => d.low),
    v: priceData.map((d) => d.volume),
  };
}
function convertToTradingView(
  data: { name: number; value: number }[],
  currentPrice: number,
  resolution: number,
  minimumInterval: number,
  baseFluctuationRatio?: number,
) {
  const priceData: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    time: number;
  }[] = [];
  let lastClose: number | undefined = undefined;
  const intervalsPerPeriod = resolution / minimumInterval;

  data.forEach((hourData, index) => {
    const basePrice = hourData.value;
    let open: number = lastClose ?? basePrice;
    const fluctuationRatio = baseFluctuationRatio ?? 1;
    let direction: number;

    if (lastClose !== undefined) {
      direction = basePrice > lastClose ? 1 : -1;
    } else {
      direction = Math.random() > 0.5 ? 1 : -1;
    }

    for (let j = 0; j < intervalsPerPeriod; j++) {
      const fluctuation = Math.random() * fluctuationRatio * basePrice;
      let close = open + direction * fluctuation * (0.1 + 0.9 * Math.random());
      if (j === 0) {
        close = basePrice;
      }

      const high = Math.max(open, close) + fluctuation * 0.1;
      const low = Math.min(open, close) - fluctuation * 0.1;

      // Calculate time for each interval point
      const time = hourData.name + j * minimumInterval;
      priceData.push({
        open: parseFloat(open.toFixed(12)),
        high: parseFloat(high.toFixed(12)),
        low: parseFloat(low.toFixed(12)),
        close: parseFloat(close.toFixed(12)),
        volume: 0,
        time,
      });

      open = close; // Update open for next interval
      lastClose = close; // Update lastClose for next data point
    }
  });
  return priceData;
}
