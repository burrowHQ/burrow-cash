import React, { useState, useEffect } from "react";
import { CloseIcon } from "../Icons/Icons";
import { FilledIcon } from "./ModalWithCountdown";
import { toInternationalCurrencySystem_number } from "../../utils/uiNumber";

interface ShowChangeCollateralParams {
  show: boolean;
  onClose: () => void;
  title?: string;
  type?: "Long" | "Short";
  icon: string;
  symbol: string;
  collateral: string;
}

const ModalWithChangeCollateral = ({
  show,
  onClose,
  title = "Change Collateral",
  type = "Long",
  icon = "",
  symbol = "",
  collateral = "0",
}: ShowChangeCollateralParams) => {
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
      clearTimeoutOrInterval(countdownTimer); //
    }
    return () => clearTimeoutOrInterval(countdownTimer); //
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
        backgroundColor: type == "Long" ? "#00F7A5" : "#ff6ba9",
        height: "3px",
      }}
    />
  );
  return (
    <div>
      {isModalVisible && (
        <div className="z-50 fixed lg:right-5 bottom-10 lg:w-93 xsm:w-[94vw] xsm:ml-[3vw] bg-dark-100 text-white  border border-gray-1250 rounded-sm">
          <div className="relatvie w-full h-full p-6 flex flex-col justify-between">
            <div
              onClick={hideModal}
              className="absolute rounded-full bg-gray-1250 p-1.5 frcc cursor-pointer hover:opacity-90"
              style={{ top: "-12px", right: "-8px" }}
            >
              <CloseIcon />
            </div>
            <div className="fc mb-5">
              <div className="fc">
                {icon ? (
                  <img
                    src={icon}
                    alt=""
                    className="mr-2"
                    style={{ width: "22px", height: "22px" }}
                  />
                ) : null}
                <span className="font-normal text-base pr-2">{title}</span>
                <div
                  className={`text-sm ${
                    type == "Long" ? "text-toolTipBoxBorderColor" : "text-red-50"
                  } rounded-sm p-1`}
                  style={{ backgroundColor: "rgba(210, 255, 58, 0.1)" }}
                >
                  {type}
                </div>
              </div>
              <div className="text-[#6FA300] text-sm ml-auto flex items-center">
                <span className="mr-1">Filled</span>
                <FilledIcon />
              </div>
            </div>
            {/* <div className="fc justify-between text-sm font-normal mb-4">
              <span className="text-gray-300">symbol</span>
              <span>{symbol}</span>
            </div> */}
            <div className="fc justify-between text-sm font-normal">
              <span className="text-gray-300">collateral({symbol})</span>
              <span>{toInternationalCurrencySystem_number(Number(collateral))}</span>
            </div>
            <div className="absolute bottom-0 z-50 w-full left-0">{renderProgressBar()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalWithChangeCollateral;
