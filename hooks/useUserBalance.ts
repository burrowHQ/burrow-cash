import Decimal from "decimal.js";
import { useAppSelector } from "../redux/hooks";
import { getAssetDataByTokenId } from "../redux/appSelectors";
import { getBorrowMaxAmount } from "../redux/selectors/getBorrowMaxAmount";
import { NEAR_STORAGE_DEPOSIT } from "../store";
import { useBtcAction } from "./useBtcBalance";

export function useUserBalance(tokenId: string, isWrappedNear: boolean) {
  const asset = useAppSelector(getAssetDataByTokenId(tokenId));
  const maxBorrowAmountPositions = useAppSelector(getBorrowMaxAmount(tokenId));
  const { available, availableNEAR } = asset;
  // get supply balance
  let supplyBalance = "0";
  if (isWrappedNear) {
    supplyBalance = Decimal.max(
      new Decimal(available || 0).plus(availableNEAR || 0).minus(NEAR_STORAGE_DEPOSIT),
      0,
    ).toFixed();
  } else {
    supplyBalance = new Decimal(available || 0).toFixed();
  }
  return {
    supplyBalance,
    maxBorrowAmountPositions,
  };
}
