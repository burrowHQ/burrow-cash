import Decimal from "decimal.js";

export function deepCopy(o) {
  if (!o) return o;
  return JSON.parse(JSON.stringify(o));
}
