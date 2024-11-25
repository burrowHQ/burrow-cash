import React, { useState, useEffect } from "react";
import { NearIconMini } from "../../screens/MarginTrading/components/Icon";
import { CloseIcon } from "../Icons/Icons";

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
        <div className="z-50 fixed right-5 bottom-10 w-93 bg-dark-100 text-white border-gray-1050 border rounded-sm">
          <div className="relative w-full p-6 flex flex-col gap-3">
            <div onClick={onClose} className="absolute" style={{ top: "-6px", right: "-4px" }}>
              <CloseIcon />
            </div>
            <div className="fc">
              <NearIconMini />
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
