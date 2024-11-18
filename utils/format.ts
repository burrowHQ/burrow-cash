import Big from "big.js";
import { TOKENS } from "../screens/Trading/chart/TradingViewChart/config";

export function formatFileUrl(key: string, options?: { useS3Url: boolean }) {
  return `${
    options?.useS3Url
      ? process.env.NEXT_PUBLIC_AWS_S3_ORIGIN_URL
      : process.env.NEXT_PUBLIC_AWS_S3_URL
  }/assets${key}`;
}

export function formatSymbol(symbol?: string) {
  // if (process.env.NEXT_PUBLIC_NETWORK !== 'mainnet' && symbol?.includes('USDC.e'))
  //   return symbol.replace('USDC.e', 'USDC');
  return symbol || "";
}

export function formatUSDPrice(
  val: string | number | undefined,
  options?: {
    symbol?: string;
    showSign?: boolean;
    decimals?: number;
    rm?: Big.RoundingMode;
  } & Intl.NumberFormatOptions,
) {
  const sign = options?.showSign ? "$" : "";
  if (!val || !Number(val)) return `${sign}0`;

  const decimals =
    options?.decimals ??
    (new Big(val).abs().lt(1) ? (options?.symbol ? TOKENS[options.symbol]?.priceDecimals : 2) : 2);
  const min = new Big(10).pow(-(decimals ?? 2));
  const bigVal = new Big(val);
  if (bigVal.abs().lt(min)) return `< ${bigVal.lt(0) ? "-" : ""}${sign}${min}`;
  return new Intl.NumberFormat("en-US", {
    style: options?.showSign ? "currency" : "decimal",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    ...options,
  }).format(bigVal.round(decimals, options?.rm ?? Big.roundHalfUp).toNumber());
}

export function parseDisplayPrice(
  val: string | number | undefined,
  symbol: string,
  options?: { rm?: Big.RoundingMode },
) {
  const result = formatUSDPrice(val, { symbol, showSign: false, rm: options?.rm });
  if (!result) return "0";
  return result.replace(/^[^-0-9.]+|[^-0-9.]/g, "");
}

export function getTokenByAddress(address: string, chain?: Chain, network?: NetworkId) {
  if (typeof window === "undefined") return;
  if (!address) return;
  const _chain = chain || "near";
  const _network = network || process.env.NEXT_PUBLIC_NETWORK;
  const res = Object.values(TOKENS).find(
    (token) => token.addresses?.[_chain]?.[_network] === address,
  );
  const decimals = getTokenDecimals(res?.symbol!, chain);
  return { ...res, decimals } as Token.TokenMeta;
}

export function getTokenDecimals(symbol: string, chain?: Chain) {
  if (typeof window === "undefined") return;
  const _chain = chain || "near";
  const decimalsKey = _chain === "solana" ? "SolanaDecimals" : "decimals";
  return TOKENS[symbol]?.[decimalsKey] || TOKENS[symbol]?.decimals;
}

export function getTokenAddress(symbol: string, chain?: Chain, network?: NetworkId) {
  if (typeof window === "undefined") return;
  const _chain = chain || "near";
  const _network = network || process.env.NEXT_PUBLIC_NETWORK;
  return TOKENS[symbol]?.addresses?.[_chain]?.[_network];
}
