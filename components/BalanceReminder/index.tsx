import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { RemindCloseIcon, RemindIcon } from "./icon";
import { useAppSelector } from "../../redux/hooks";
import { getAccountId } from "../../redux/accountSelectors";
import { setAccountDetailsOpen, setActiveTab, setSelectedTab } from "../../redux/marginTabSlice";
import {
  getMarginAccountSupplied,
  getMarginAccountSuppliedMEME,
} from "../../redux/marginAccountSelectors";
import { useMarginAccount } from "../../hooks/useMarginAccount";

const BalanceReminder = () => {
  const router = useRouter();
  const { getAssetById, getAssetByIdMEME } = useMarginAccount();
  const accountId = useAppSelector(getAccountId);
  const [shouldShow, setShouldShow] = useState(false);
  const accountSupplied = useAppSelector(getMarginAccountSupplied);
  const accountSuppliedMEME = useAppSelector(getMarginAccountSuppliedMEME);
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

    if (accountId && Unreminded && hasValidAccountSupplied) {
      setShouldShow(true);
    } else {
      setShouldShow(false);
    }
  }, [accountId, router.pathname, Unreminded, combinedAccountSupplied]);
  const handleClaim = () => {
    dispatch(setActiveTab("my"));
    dispatch(setSelectedTab("account"));
    dispatch(setAccountDetailsOpen(true));
    router.push("/marginTrading");
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
      className="fixed lg:top-[80px] lg:right-[24px] xsm:top-[64px] xsm:left-[14px] border border-gray-1250 bg-dark-100 shadow-lg py-4 pl-3 pr-4
     border border-dark-300 w-96 rounded-md flex 
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
