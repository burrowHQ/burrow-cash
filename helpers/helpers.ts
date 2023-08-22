import millify from "millify";
import { APY_FORMAT, DUST_FORMAT, TOKEN_FORMAT, USD_FORMAT } from "../store";

export const formatTokenValue = (v) => {
  return Number(v).toLocaleString(undefined, TOKEN_FORMAT);
};

export const formatDustValue = (v) => {
  return Number(v).toLocaleString(undefined, DUST_FORMAT);
};

export const formatUSDValue = (v) => {
  return Number(v).toLocaleString(undefined, USD_FORMAT);
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

export const removeUndefinedInObj = (obj, removeNull) => {
  Object.keys(obj).forEach((key) => {
    if (removeNull) {
      [undefined, null].includes(obj[key]) && delete obj[key];
    } else {
      obj[key] === undefined && delete obj[key];
    }
  });
};

export const maskMiddleString = (
  value: string,
  hideSymbolLength = 6,
  skipLength = 0,
  hideSymbol = "*",
) => {
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
