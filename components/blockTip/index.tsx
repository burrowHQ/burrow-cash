import { useEffect, useState } from "react";
import { get_blocked } from "../../api/get-blocked";

export default function BlockTip() {
  const [isBlocked, setIsBlocked] = useState(false);
  const blockFeatureEnabled = true;
  useEffect(() => {
    if (blockFeatureEnabled) {
      checkBlockedStatus();
    }
  }, [blockFeatureEnabled]);
  function checkBlockedStatus() {
    get_blocked().then((res) => {
      if (res.blocked === true) {
        const blockConfirmationTime = localStorage.getItem("blockConfirmationTime");
        if (blockConfirmationTime) {
          const currentTime = new Date().getTime();
          const weekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
          if (currentTime - parseInt(blockConfirmationTime, 10) < weekInMilliseconds) {
            setIsBlocked(false);
          } else {
            setIsBlocked(true);
          }
        } else {
          setIsBlocked(true);
        }
      }
    });
  }
  function handleBlockConfirmation() {
    const currentTime = new Date().getTime();
    localStorage.setItem("blockConfirmationTime", currentTime.toString());
    setIsBlocked(false);
  }
  if (!(isBlocked && blockFeatureEnabled)) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center"
      style={{
        zIndex: "999999999",
        backdropFilter: "blur(6px)",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div
        className="text-white text-center bg-dark-100 px-5 pt-9 pb-7 rounded-md border border-dark-300"
        style={{ width: "278px" }}
      >
        <p className="text-sm">
          You are prohibited from accessing app.burrow.finance due to your location or other
          infringement of the Terms of Services.
        </p>
        <div
          onClick={handleBlockConfirmation}
          className="mt-6 border border-primary h-9 flex items-center justify-center rounded-md text-sm text-black text-primary cursor-pointer ml-1.5 mr-1.5"
        >
          Confirm
        </div>
      </div>
    </div>
  );
}
