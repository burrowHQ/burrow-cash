import Decimal from "decimal.js";
import * as math from "mathjs";

export function formatWithCommas(value: string): string {
  const pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(value)) {
    value = value.replace(pattern, "$1,$2");
  }
  return value;
}

export const toInternationalCurrencySystem = (labelValue: string, percent?: number) => {
  const hasPercent = !(percent === undefined || percent == null);
  return Math.abs(Number(labelValue)) >= 1.0e9
    ? `${(Math.abs(Number(labelValue)) / 1.0e9).toFixed(percent || 2)}B`
    : Math.abs(Number(labelValue)) >= 1.0e6
    ? `${(Math.abs(Number(labelValue)) / 1.0e6).toFixed(percent || 2)}M`
    : Math.abs(Number(labelValue)) >= 1.0e3
    ? `${(Math.abs(Number(labelValue)) / 1.0e3).toFixed(percent || 2)}K`
    : Math.abs(Number(labelValue)).toFixed(hasPercent ? percent : 2);
};

export const toPrecision = (
  number: string,
  precision: number,
  withCommas = false,
  atLeastOne = true,
): string => {
  if (typeof number === "undefined") return "0";

  const [whole, decimal = ""] = number.split(".");

  let str = `${withCommas ? formatWithCommas(whole) : whole}.${decimal.slice(
    0,
    precision,
  )}`.replace(/\.$/, "");
  if (atLeastOne && Number(str) === 0 && str.length > 1) {
    const n = str.lastIndexOf("0");
    str = str.slice(0, n) + str.slice(n).replace("0", "1");
  }

  return str;
};
export const percentLess = (percent: number, num: number | string) => {
  return math.format(math.evaluate(`${num} - ${percentOf(percent, num)}`), {
    notation: "fixed",
  });
};

export const percentOf = (percent: number, num: number | string) => {
  return math.evaluate(`${convertToPercentDecimal(percent)} * ${num}`);
};
export const convertToPercentDecimal = (percent: number) => {
  return math.divide(percent, 100);
};
