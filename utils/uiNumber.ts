import Decimal from "decimal.js";
import { formatWithCommas, toInternationalCurrencySystem } from "./number";

export const formatWithCommas_usd = (v) => {
  if (isInvalid(v)) return "$-";
  const decimal = new Decimal(v);
  if (decimal.eq(0)) {
    return "$0";
  } else if (decimal.lt(0.01)) {
    return "<$0.01";
  } else if (decimal.lt(10000)) {
    return `$${formatWithCommas(decimal.toFixed(2, Decimal.ROUND_HALF_UP))}`;
  } else {
    return `$${formatWithCommas(decimal.toFixed(0, Decimal.ROUND_HALF_UP))}`;
  }
};
export const formatWithCommas_number = (v, d?: number | any) => {
  if (isInvalid(v)) return "-";
  const decimal = new Decimal(v);
  if (decimal.eq(0)) {
    return "0";
  } else if (decimal.lt(0.01)) {
    return "<0.01";
  } else {
    return `${formatWithCommas(decimal.toFixed(isInvalid(d) ? 2 : d, Decimal.ROUND_HALF_UP))}`;
  }
};

export const toInternationalCurrencySystem_number = (v) => {
  if (isInvalid(v)) return "-";
  const absDecimal = new Decimal(Decimal.abs(v));
  const decimal = new Decimal(v);
  if (absDecimal.eq(0)) {
    return "0";
  } else if (absDecimal.lt(0.01)) {
    return decimal.lt(0) ? "-<0.01" : "<0.01";
  } else {
    return decimal.lt(0)
      ? `-${toInternationalCurrencySystem(decimal.toFixed())}`
      : toInternationalCurrencySystem(decimal.toFixed());
  }
};
export const toInternationalCurrencySystem_usd = (v) => {
  if (isInvalid(v)) return "$-";
  const decimal = new Decimal(v);
  if (decimal.eq(0)) {
    return "$0";
  } else if (decimal.lt(0.01)) {
    return "<$0.01";
  } else {
    return `$${toInternationalCurrencySystem(decimal.toFixed())}`;
  }
};

export const format_apy = (v) => {
  if (isInvalid(v)) return "-%";
  const decimal = new Decimal(v);
  if (decimal.eq(0)) {
    return "0%";
  } else if (decimal.lt(0.01) && decimal.gt(0)) {
    return "<0.01%";
  } else {
    return `${decimal.toFixed(2, Decimal.ROUND_HALF_UP)}%`;
  }
};

export function digitalProcess(v: string | number, precision: number = 2) {
  if (isInvalid(v)) return "-";
  let zero = "";
  for (let i = 0; i < precision - 1; i++) {
    zero += "0";
  }
  zero = `0.${zero}1`;
  const decimal = new Decimal(v);
  if (decimal.eq(0)) {
    return "0";
  } else if (decimal.lt(zero)) {
    return `<${zero}`;
  } else {
    return `${decimal.toFixed(precision)}`;
  }
}

export const isInvalid = (v) => {
  if (v === "" || v === undefined || v == null) return true;
  return false;
};

export const toDecimal = (v) => {
  return new Decimal(v).toFixed();
};
