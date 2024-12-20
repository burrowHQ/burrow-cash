import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { RemindCloseIcon, RemindIcon } from "./icon";
import { useAppSelector } from "../../redux/hooks";
import { getAccountId } from "../../redux/accountSelectors";
import { setActiveTab, setSelectedTab } from "../../redux/marginTabSlice";

const BalanceReminder = () => {
  const router = useRouter();
  const accountId = useAppSelector(getAccountId);
  const [shouldShow, setShouldShow] = useState(false);
  const Unreminded = useMemo(() => {
    const lastClosedDate = localStorage.getItem("balanceReminderLastClosed");
    const today = new Date().toDateString();
    return !lastClosedDate || lastClosedDate !== today;
  }, []);
  const dispatch = useDispatch();
  useEffect(() => {
    if (accountId && Unreminded) {
      setShouldShow(true);
      // setPersonalDataUpdatedSerialNumber(personalDataUpdatedSerialNumber + 1);
    } else {
      setShouldShow(false);
    }
  }, [accountId, router.pathname, Unreminded]);
  const handleClaim = () => {
    dispatch(setActiveTab("my"));
    dispatch(setSelectedTab("account"));
    router.push("/marginTrading");
  };
  function closeTip() {
    const today = new Date().toDateString();
    localStorage.setItem("balanceReminderLastClosed", today);
    setShouldShow(false);
  }
  if (!shouldShow) {
    return null;
  }
  return (
    <div
      className="fixed top-[80px] right-[24px]  border border-gray-1250 bg-dark-100 shadow-lg py-4 pl-3 pr-4
     border border-dark-300 w-96 rounded-md flex 
       xsm:bottom-8 xsm:right-0 xsm:left-0 xsm:top-auto xsm:transform-none xsm:w-screen
     xsm:border-0 xsm:rounded-none xsm:rounded-t-md xsm:bg-dark-230"
      style={{ zIndex: "98" }}
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
