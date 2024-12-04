import React, { useState, useEffect, useRef } from "react";
import { NearIconMini } from "../../screens/MarginTrading/components/Icon";
import { CloseIcon } from "../Icons/Icons";

interface FailureModalProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  errorMessage?: string;
  type?: "Long" | "Short";
}

const ClosePositionIcon = () => {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="10" fill="#989293" stroke="white" strokeWidth="2" />
      <path d="M17.5 4.5L4.5 18" stroke="white" strokeWidth="2" />
    </svg>
  );
};

const ModalWithFailure = ({
  show,
  onClose,
  title = "Close Position",
  errorMessage = "Operation failed, please try again later",
  type = "Long",
}: FailureModalProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [progress, setProgress] = useState(100);

  // 使用 useRef 来存储 timer
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (show) {
      setIsModalVisible(true);
      startCountdown();
    } else {
      // 使用 setTimeout 来延迟隐藏模态框
      const hideTimeout = setTimeout(() => {
        setIsModalVisible(false);
        clearTimeoutOrInterval(countdownTimerRef.current);
      }, 0);

      return () => clearTimeout(hideTimeout);
    }

    return () => clearTimeoutOrInterval(countdownTimerRef.current);
  }, [show]);

  const clearTimeoutOrInterval = (timerId) => {
    if (timerId) {
      clearInterval(timerId);
      countdownTimerRef.current = null;
    }
  };

  const hideModal = () => {
    // 使用 setTimeout 来避免同步卸载
    setTimeout(() => {
      setIsModalVisible(false);
      onClose();
      clearTimeoutOrInterval(countdownTimerRef.current);

      const cleanUrl = window.location.href.split("?")[0];
      window.history.replaceState({}, "", cleanUrl);
    }, 0);
  };

  const startCountdown = () => {
    setCountdown(10);
    setProgress(100);

    const timerInterval = 1000;
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          hideModal();
          clearTimeoutOrInterval(countdownTimerRef.current);
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
        <div className="z-50 fixed right-5 bottom-10 w-93 bg-dark-100 text-white  border border-gray-1250 rounded-sm">
          <div className="relative w-full p-6 flex flex-col gap-3">
            <div
              onClick={onClose}
              className="absolute rounded-full bg-gray-1250 p-1.5 frcc cursor-pointer hover:opacity-90"
              style={{ top: "-12px", right: "-8px" }}
            >
              <CloseIcon />
            </div>
            <div className="fc">
              <ClosePositionIcon />
              <span className="font-normal text-base ml-2">{title}</span>
              <div
                className={`${
                  type == "Long" ? "text-toolTipBoxBorderColor" : "text-red-50"
                } text-sm ml-auto`}
              >
                Success
              </div>
            </div>
            <div className="w-full h-1 bg-black">
              <div
                className={`h-full ${
                  type == "Long" ? "bg-toolTipBoxBorderColor" : "bg-red-50"
                } transition-all ease-linear`}
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
