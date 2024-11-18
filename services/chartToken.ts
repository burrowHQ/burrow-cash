import { CHAINS } from "../screens/Trading/chart/TradingViewChart/config";
import { botInnerApiPrefix, request, type WrapperResponse } from ".";
import { getTokenAddress, getTokenByAddress, parseDisplayPrice } from "../utils/format";

interface PriceReport {
  contract_address: string;
  symbol: string;
  price_list: { date_time: number; price: string }[];
}

interface PairPrice {
  pair_id: string;
  basePrice: string;
  quotePrice: string;
  pairPrice: string;
}

export interface KlineItem {
  pair: string;
  price: string;
  low: string;
  high: string;
  time: number;
}
export const pairServices = {
  pairs: {} as Record<Chain, BotModel.BotPair[]>,
  async queryAll() {
    if (CHAINS.every((chain) => this.pairs[chain]?.length)) return this.pairs;
    const res = await Promise.all(CHAINS.map((chain) => this.query(chain)));
    return res.reduce((acc, cur, i) => {
      acc[CHAINS[i]] = cur;
      return acc;
    }, {} as Record<Chain, BotModel.BotPair[]>);
  },
  async query(chain: Chain) {
    if (this.pairs[chain]?.length) return this.pairs[chain];
    if (this.pairs[chain]?.length) return this.pairs[chain];
    const { data } = await request<WrapperResponse<BotModel.BotPair[]>>(
      botInnerApiPrefix("/bot/grid/pairs", chain),
    ).catch(() => ({ data: [] }));
    data?.forEach((item) => {
      item.symbol = `${item.base_token.symbol}_${item.quote_token.symbol}`;
      item.chain = chain;
    });
    this.pairs[chain] = data || [];
    return data || [];
  },

  async queryPairPrice(pair_id: string | string[]) {
    const ids: string[] = Array.isArray(pair_id) ? pair_id : [pair_id];
    const prices = await this.queryPrice();
    const result = {} as Record<string, PairPrice>;
    ids.map((id) => {
      const [baseToken, quoteToken] = id.split(":");
      const basePrice = prices?.[baseToken] || "0";
      const quotePrice = prices?.[quoteToken] || "0";
      const pairPrice = parseDisplayPrice(
        Number(basePrice) / Number(quotePrice),
        getTokenByAddress(baseToken)?.symbol!,
      );
      result[id] = { pair_id: id, basePrice, quotePrice, pairPrice };
    });
    return result;
  },

  async queryPrice<T extends string | string[]>(tokens?: T) {
    const _tokens = Array.isArray(tokens) ? tokens : tokens ? [tokens] : [];
    const { data } = await request<WrapperResponse<Record<string, string>>>(
      generateUrl(botInnerApiPrefix("/prices", "near"), {
        tokens: _tokens?.join(","),
      }),
      { cacheTimeout: 10000 },
    );
    return data;
  },
  tickers: {} as Record<string, BotModel.PairTicker>,
  async queryTicker(pair_id: string | string[]) {
    const ids = Array.isArray(pair_id) ? pair_id : [pair_id];
    const pairPrices = await this.queryPairPrice(ids);
    const tickers = await Promise.all(
      ids.map(async (id) => {
        const { data } = await request<WrapperResponse<BotModel.PairTicker>>(
          generateUrl(botInnerApiPrefix("/bot/grid/ticker", "near"), { pair_id: id }),
          { cacheTimeout: 60000 },
        ).catch(() => ({ data: undefined }));
        if (!data) return this.tickers[id];
        const price = pairPrices[id].pairPrice;
        const newData = {
          ...data,
          last_price: price,
        };
        this.tickers[id] = newData;
        return newData;
      }),
    );
    const result = tickers.reduce((acc, cur) => {
      acc[cur.pair_id] = cur;
      return acc;
    }, {} as Record<string, BotModel.PairTicker>);
    return result;
  },
  async queryPriceByIndexer(symbol: string) {
    const { price } = await request<{ price: string }>(
      generateUrl(`${process.env.NEXT_PUBLIC_INDEXER_HOST}/get-token-price`, {
        token_id: getTokenAddress(symbol, "near", "mainnet"),
      }),
    );
    return price;
  },

  async queryPriceReport({
    base,
    quote,
    dimension = "M",
  }: {
    base: string;
    quote: string;
    dimension?: "D" | "W" | "M" | "Y";
  }) {
    const { price_list } = await request<PriceReport>(
      generateUrl(`${process.env.NEXT_PUBLIC_INDEXER_HOST}/token-price-report`, {
        token: getTokenAddress(base, "near", "mainnet"),
        base_token: getTokenAddress(quote, "near", "mainnet"),
        dimension,
      }),
      { retryCount: 0 },
    );
    const res = price_list.map(({ date_time, price }) => ({
      name: date_time,
      value: Number(price),
    }));
    return res;
  },
  async queryHistoryPriceReport({ base, quote }: { base: string; quote: string }) {
    const { price_list } = await request<PriceReport>(
      generateUrl(`${process.env.NEXT_PUBLIC_INDEXER_HOST}/history-token-price-report`, {
        token: getTokenAddress(base, "near", "mainnet"),
        base_token: getTokenAddress(quote, "near", "mainnet"),
      }),
      { retryCount: 0 },
    );
    const res = price_list.map(({ date_time, price }) => ({
      name: date_time,
      value: Number(price),
    }));
    return res;
  },

  async queryDeltaKline(params: { pair_id: string; start: number; end: number; limit: number }) {
    if (!params.pair_id) return [];
    const url = generateUrl(botInnerApiPrefix("/klines", "near"), { ...params });
    const res = await request<WrapperResponse<KlineItem[]>>(url);
    return res.data || [];
  },

  async queryTradingViewHistory(params: {
    symbol: string;
    resolution: string;
    from: number;
    to: number;
  }) {
    try {
      return mockData(params);
    } catch (error) {
      return mockData(params);
    }
  },
};

export function generateUrl(
  url = "",
  query: Record<string, any>,
  hashes: Record<string, any> = {},
) {
  const queryStringParts = [];
  for (const key in query) {
    const value = query[key];
    if ([undefined, null, ""].includes(value)) continue;
    if (Array.isArray(value)) {
      value.forEach((_value) => {
        queryStringParts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(_value)}`);
      });
    } else {
      queryStringParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  const queryString = queryStringParts.join("&");
  if (queryString) {
    url += url.includes("?") ? "&" : "?";
    url += queryString;
  }

  const hashStringParts = [];
  for (const key in hashes) {
    const value = hashes[key];
    if ([undefined, null, ""].includes(value)) continue;
    hashStringParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  const hashString = hashStringParts.join("&");
  if (hashString) {
    url += `#${hashString}`;
  }

  return url;
}

async function mockData(params: { symbol: string; resolution: string; from: number; to: number }) {
  if (params.symbol) {
    const [base, quote] = params.symbol.includes("_")
      ? params.symbol.split("_")
      : params.symbol.split("/");
    const pairId = `${getTokenAddress(base)}:${getTokenAddress(quote)}`;

    let priceData: {
      open: number;
      high: number;
      low: number;
      close: number;
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
    const determineMinimumInterval = (interVal: number): number => {
      if (!interVal) return 1;

      if (interval >= 1440) {
        // 1 day or more
        return 1440; // 1 day in minutes
      } else if (interval >= 60) {
        // 1 hour or more
        return 60; // 1 hour in minutes
      } else if (interval >= 15) {
        // 15 minutes or more
        return 15; // 15 minutes
      } else if (interval >= 5) {
        // 5 minutes or more
        return 5; // 5 minutes
      } else {
        return 1; // default to 1 minute for smallest intervals
      }
    };

    const interval = resolutionMapping[params.resolution];

    // minutes diff
    const timeDiff = (params.to - params.from) / 60;
    const limit = Math.floor(timeDiff / interval);

    const res = (await pairServices
      .queryDeltaKline({
        pair_id: pairId,
        start: params.from * 1000,
        end: params.to * 1000,
        limit: limit || 1,
      })
      .catch(() => [])) as KlineItem[];

    const klineData = res.map((item) => ({
      name: item.time,
      value: Number(item.price),
    }));

    const pairPrice = await pairServices.queryPairPrice(pairId);
    const price = Number(pairPrice[pairId].pairPrice);

    // const priceReport = await pairServices.queryHistoryPriceReport({ base, quote }).catch(() => []);
    if (klineData.length) {
      // priceData = convertToTradingView(priceReport, price, 15 * 60, 5 * 60, 0.006);

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
  let lastClose: number | undefined;
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

      // if (index === data.length - 1) {
      //   close = currentPrice;
      // } else
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
