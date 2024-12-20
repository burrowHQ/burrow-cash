import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { RemindCloseIcon, RemindIcon } from "./icon";

const BalanceReminder = () => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleClaim = () => {
    localStorage.setItem("marginTradingTab", "my");
    localStorage.setItem("marginTradingYoursTab", "account");
    router.push("/marginTrading");
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed top-[80px] right-[30px]  border border-gray-1250 bg-dark-100 shadow-lg py-4 pl-3 pr-4
     border border-dark-300 w-96 rounded-md flex"
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
      <div className="cursor-pointer" onClick={handleClose}>
        <RemindCloseIcon />
      </div>
    </div>
  );
};
export default BalanceReminder;
