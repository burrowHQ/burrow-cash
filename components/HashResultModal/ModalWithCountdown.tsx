import React, { useState, useEffect } from "react";
import { NearIcon, NearIconMini } from "../../screens/MarginTrading/components/Icon";
import { CloseIcon } from "../Icons/Icons";
import { beautifyPrice } from "../../utils/beautyNumber";

interface PositionResultProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  type?: "Long" | "Short";
  positionSize?: {
    amount: string;
    baseTokenSymbol: string;
    quoteTokenSymbol: string;
    totalPrice: string;
    entryPrice: string;
  };
}

export const FilledIcon = () => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="10" fill="#00F7A5" />
      <path d="M5 9.21053L8.87097 13L15 7" stroke="#2E304B" strokeWidth="2" />
    </svg>
  );
};

const ModalWithCountdown = ({
  show,
  onClose,
  title = "Open Position",
  type = "Long",
  positionSize = {
    amount: "0",
    baseTokenSymbol: "",
    quoteTokenSymbol: "",
    totalPrice: "$0.00",
    entryPrice: "0",
  },
}: PositionResultProps) => {
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
  }, [show, countdown]);

  const clearTimeoutOrInterval = (timerId) => {
    if (timerId) {
      clearInterval(timerId);
      countdownTimer = null;
    }
  };

  const hideModal = () => {
    setIsModalVisible(false);
    clearTimeout(countdownTimer);
    const cleanUrl = window.location.href.split("?")[0];
    window.history.replaceState({}, "", cleanUrl);
    onClose();
  };

  const startCountdown = () => {
    const timerInterval = 450;

    countdownTimer = setInterval(() => {
      if (countdown > 0) {
        setCountdown((prevCountdown) => prevCountdown - 1);
        setProgress((prevProgress) => Math.max(prevProgress - 10, 0));
      } else {
        hideModal();
      }
    }, timerInterval);
  };

  const renderProgressBar = () => (
    <div
      className="rounded-sm"
      style={{
        width: `${progress}%`,
        backgroundColor: type == "Long" ? "#00F7A5" : "#FFE3CC",
        height: "3px",
      }}
    />
  );

  return (
    <div>
      {isModalVisible && (
        <div className="z-50 fixed lg:right-5 bottom-10 lg:w-93 xsm:w-[94vw] xsm:ml-[3vw] bg-dark-110 text-white  border border-dark-50 rounded-sm">
          <div className="relatvie w-full h-full p-6 flex flex-col justify-between">
            <div
              onClick={hideModal}
              className="absolute rounded-full bg-gray-1250 p-1.5 frcc cursor-pointer hover:opacity-90"
              style={{ top: "-12px", right: "-8px" }}
            >
              <CloseIcon />
            </div>
            <div className="fc">
              <div className="fc">
                <span className="font-normal text-base pr-2">{title}</span>
                <div
                  className={`text-sm ${
                    type == "Long"
                      ? "text-primary bg-primary bg-opacity-10"
                      : "text-orange bg-orange bg-opacity-10"
                  } rounded-sm p-1`}
                  style={{
                    maxWidth: "120px",
                    whiteSpace: "normal",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {type} {positionSize.baseTokenSymbol}
                </div>
              </div>
              <div className="text-primary text-sm ml-auto flex items-center">
                <span className="mr-1">Filled</span>
                <FilledIcon />
              </div>
            </div>
            <div className="fc justify-between text-sm font-normal">
              <span className="text-gray-300">Entry Price</span>
              <span className="flex items-center gap-0.5">
                {beautifyPrice(Number(positionSize.entryPrice))}
                <span className="text-xs text-gray-30">({positionSize.quoteTokenSymbol})</span>
              </span>
            </div>
            <div className="fc justify-between text-sm font-normal">
              <span className="text-gray-300">Position Size</span>
              <span>
                {beautifyPrice(Number(positionSize.amount))} {positionSize.baseTokenSymbol}
                <span className="text-xs text-gray-300">
                  (${beautifyPrice(Number(positionSize.totalPrice))})
                </span>
              </span>
            </div>
            <div className="absolute bottom-0 z-50 w-full left-0">{renderProgressBar()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalWithCountdown;
