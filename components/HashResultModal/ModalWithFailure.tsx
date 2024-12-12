import React, { useState, useEffect } from "react";
import { NearIconMini } from "../../screens/MarginTrading/components/Icon";
import { CloseIcon } from "../Icons/Icons";

const ClosePositionIcon = () => {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="10" fill="#989293" stroke="white" strokeWidth="2" />
      <path d="M17.5 4.5L4.5 18" stroke="white" strokeWidth="2" />
    </svg>
  );
};
interface FailureModalProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  errorMessage?: string;
  type?: "Long" | "Short";
}

const ModalWithFailure = ({
  show,
  onClose,
  title = "Transaction Failed",
  errorMessage = "Operation failed, please try again later",
  type = "Long",
}: FailureModalProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [progress, setProgress] = useState(100);
  let countdownTimer;

  useEffect(() => {
    if (show) {
      setIsModalVisible(true);
      startCountdown();
    } else {
      setIsModalVisible(false);
      clearTimeoutOrInterval(countdownTimer);
    }
    return () => clearTimeoutOrInterval(countdownTimer);
  }, [show]);

  const clearTimeoutOrInterval = (timerId) => {
    if (timerId) {
      clearInterval(timerId);
      countdownTimer = null;
    }
  };

  const hideModal = () => {
    setIsModalVisible(false);
    onClose();
    clearTimeout(countdownTimer);
    const cleanUrl = window.location.href.split("?")[0];
    window.history.replaceState({}, "", cleanUrl);
  };

  const startCountdown = () => {
    setCountdown(10);
    setProgress(100);

    const timerInterval = 1000;
    countdownTimer = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          hideModal();
          clearTimeoutOrInterval(countdownTimer);
          return 0;
        }
        return prevCountdown - 1;
      });
      setProgress((prevProgress) => Math.max(prevProgress - 10, 0));
    }, timerInterval);
  };

  return (
    <div>
      {isModalVisible && (
        <div className="z-50 fixed right-5 bottom-10 w-93 bg-dark-100 text-white border-gray-1250 border rounded-sm">
          <div className="relative w-full p-6 flex flex-col gap-3">
            <div
              onClick={hideModal}
              className="absolute rounded-full bg-gray-1250 p-1.5 frcc cursor-pointer hover:opacity-90"
              style={{ top: "-12px", right: "-8px" }}
            >
              <CloseIcon />
            </div>
            <div className="fc">
              <ClosePositionIcon />
              <span className="font-normal text-base px-2">{title}</span>
              <div className="text-red-50 text-sm ml-auto">Failed</div>
            </div>
            <div className="text-sm text-red-50">{errorMessage}</div>
            <div className="w-full h-1 bg-black">
              <div
                className="h-full bg-red-50 transition-all ease-linear"
                style={{
                  width: `${progress}%`,
                  transitionDuration: "950ms",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalWithFailure;
