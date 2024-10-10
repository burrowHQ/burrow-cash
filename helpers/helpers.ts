// @ts-nocheck
import millify from "millify";
import { APY_FORMAT, DUST_FORMAT, NUMBER_FORMAT, TOKEN_FORMAT, USD_FORMAT } from "../store";

export const formatTokenValue = (v) => {
  return Number(v).toLocaleString(undefined, TOKEN_FORMAT);
};

export const formatDustValue = (v) => {
  return Number(v).toLocaleString(undefined, DUST_FORMAT);
};

export const formatUSDValue = (v) => {
  return Number(v).toLocaleString(undefined, USD_FORMAT);
};

export const formatAPYValue = (v) => {
  return Number(v).toLocaleString(undefined, APY_FORMAT);
};

export const millifyNumber = (v: string | number, ignoreBelow?: number, isDisplay = false) => {
  const number = Number(v);
  if ((isDisplay && number === 0) || Number.isNaN(number)) {
    return "-";
  }

  if (ignoreBelow && number <= ignoreBelow) {
    return 0;
  }

  return millify(number);
};

export const formatTokenValueWithMilify = (
  v,
  fractionDigits = 2,
  bigNumberFractionDigits = 0,
  milifyThreshold = 1000000,
  zeroPlacement = "-",
) => {
  if (v === 0 && zeroPlacement) {
    return zeroPlacement;
  }
  if (Math.abs(Number(v)) >= milifyThreshold) {
    return bigNumberMilify(Number(v), fractionDigits, bigNumberFractionDigits, zeroPlacement);
  }
  return Number(v).toLocaleString(undefined, TOKEN_FORMAT);
};

export const bigNumberMilify = (
  n,
  fractionDigits = 2,
  bigNumberFractionDigits = 0,
  zeroPlacement = "-",
) => {
  if (n === 0 && zeroPlacement) {
    return zeroPlacement;
  }
  const formatNumber = (num, factor) => {
    return (+(n / factor).toFixed(fractionDigits)).toLocaleString(undefined, NUMBER_FORMAT);
  };

  if (n >= 1e3 && n < 1e6) return `${formatNumber(n, 1e3)}K`;
  if (n >= 1e6 && n < 1e9) return `${formatNumber(n, 1e6)}M`;
  if (n >= 1e9 && n < 1e12) return `${formatNumber(n, 1e9)}B`;
  if (n >= 1e12) return `${formatNumber(n, 1e12)}T`;

  return n.toFixed(fractionDigits);
};

export const removeUndefinedInObj = (obj, removeNull) => {
  Object.keys(obj).forEach((key) => {
    if (removeNull) {
      // eslint-disable-next-line no-unused-expressions
      [undefined, null].includes(obj[key]) && delete obj[key];
    } else {
      // eslint-disable-next-line no-unused-expressions
      obj[key] === undefined && delete obj[key];
    }
  });
};

export const maskMiddleString = (
  str: string,
  hideSymbolLength = 6,
  skipLength = 0,
  hideSymbol = "*",
) => {
  if (!str) {
    return str;
  }
  const value = String(str);
  if (skipLength >= value?.length) {
    skipLength = skipLength - value.length - hideSymbolLength;
  }
  const skip = Math.ceil(skipLength / 2);
  const firstLength = Math.ceil(value.length / 2);
  const first = value.slice(0, firstLength - skip);
  const last = value.slice(firstLength + skip, value.length);
  const masked = hideSymbol.repeat(hideSymbolLength);
  return first + masked + last;
};

export const getDateString = (date) => {
  const today = new Date(date);
  const secNum = today.getSeconds();
  const minNum = today.getMinutes();
  const hourNum = today.getHours();
  const ddNum = today.getDate();
  const mmNum = today.getMonth() + 1; // January is 0!
  const yyyy = today.getFullYear();

  let dd = String(ddNum);
  let mm = String(mmNum);
  let hh = String(hourNum);
  let min = String(minNum);
  let sec = String(secNum);
  if (ddNum < 10) {
    dd = `0${dd}`;
  }

  if (mmNum < 10) {
    mm = `0${mm}`;
  }

  if (hourNum < 10) {
    hh = `0${hh}`;
  }

  if (minNum < 10) {
    min = `0${min}`;
  }

  if (secNum < 10) {
    sec = `0${sec}`;
  }

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
};
export const isMobileDevice = (): boolean => {
  return window.screen.width <= 1023;
};

export const cloneObj = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};
