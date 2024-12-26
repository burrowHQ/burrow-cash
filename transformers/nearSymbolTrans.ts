import { nearTokenId } from "../utils";

export const getSymbolById = (id: string, symbol: string): string => {
  if (id === nearTokenId) return "NEAR";
  return symbol;
};
