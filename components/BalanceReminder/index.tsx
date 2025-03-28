import Decimal from "decimal.js";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { RemindCloseIcon, RemindIcon } from "./icon";
import { useAppSelector } from "../../redux/hooks";
import { getAccountId } from "../../redux/accountSelectors";
import { setAccountDetailsOpen, setSelectedTab } from "../../redux/marginTabSlice";
import {
  getMarginAccountSupplied,
  getMarginAccountSuppliedMEME,
} from "../../redux/marginAccountSelectors";
import { useMarginAccount } from "../../hooks/useMarginAccount";
import { getAllAssetsData } from "../../redux/assetsSelectors";
import { shrinkToken } from "../../store";

const BalanceReminder = () => {
  const router = useRouter();
  const { getAssetById, getAssetByIdMEME } = useMarginAccount();
  const accountId = useAppSelector(getAccountId);
  const [shouldShow, setShouldShow] = useState(false);
  const accountSupplied = useAppSelector(getMarginAccountSupplied);
  const accountSuppliedMEME = useAppSelector(getMarginAccountSuppliedMEME);
  const allAssets = useAppSelector(getAllAssetsData);
  const combinedAccountSupplied = [
    ...accountSupplied.map((token) => ({ ...token, type: "main" })),
    ...accountSuppliedMEME.map((token) => ({ ...token, type: "meme" })),
  ];
  const [lastClosedDate, setLastClosedDate] = useState(() =>
    localStorage.getItem("balanceReminderLastClosed"),
  );

  const Unreminded = useMemo(() => {
    const today = new Date().toDateString();
    return !lastClosedDate || lastClosedDate !== today;
  }, [lastClosedDate]);
  const dispatch = useDispatch();
  useEffect(() => {
    const hasValidAccountSupplied =
      combinedAccountSupplied.length > 0 &&
      combinedAccountSupplied.some((token) => {
        const assetDetails =
          token.type === "main" ? getAssetById(token.token_id) : getAssetByIdMEME(token.token_id);
        return (
          assetDetails && token.balance.toString().length >= assetDetails.config.extra_decimals
        );
      });
    const userWithdrawableUsd = combinedAccountSupplied?.reduce((acc, cur) => {
      const asset = allAssets[cur.token_id];
      const b = shrinkToken(cur.balance, asset.metadata.decimals + asset.config.extra_decimals);
      const v = new Decimal(b || 0).mul(asset.price?.usd || 0);
      return acc.plus(v);
    }, new Decimal(0));
    if (accountId && Unreminded && hasValidAccountSupplied && userWithdrawableUsd.gte(0.1)) {
      setShouldShow(true);
    } else {
      setShouldShow(false);
    }
  }, [accountId, router.pathname, Unreminded, combinedAccountSupplied]);
  const handleClaim = () => {
    dispatch(setSelectedTab("account"));
    dispatch(setAccountDetailsOpen(true));
    router.push("/dashboardMarginDetail");
  };
  function closeTip() {
    const today = new Date().toDateString();
    localStorage.setItem("balanceReminderLastClosed", today);
    setLastClosedDate(today);
    setShouldShow(false);
  }
  if (!shouldShow) {
    return null;
  }
  return (
    <div
      className="fixed lg:top-[80px] lg:right-[24px] xsm:top-[64px] xsm:left-[14px] bg-dark-100 shadow-lg py-4 pl-3 pr-4
     border border-dark-50 w-96 rounded-md flex 
     xsm:border-0 xsm:rounded-md xsm:rounded-t-md xsm:bg-dark-230 "
      style={{ zIndex: "50" }}
    >
      <div className="mt-4">
        <RemindIcon />
      </div>
      <div className="text-base ml-2 mr-2 text-gray-300">
        You have assets remaining in Burrow account. Please
        <span
          className="text-primary inline-block cursor-pointer underline mx-1"
          onClick={handleClaim}
        >
          claim
        </span>
        them promptly.
      </div>
      <div className="cursor-pointer" onClick={closeTip}>
        <RemindCloseIcon />
      </div>
    </div>
  );
};
export default BalanceReminder;
