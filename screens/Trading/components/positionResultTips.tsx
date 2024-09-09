import React, { useState, useEffect } from "react";
import { NearIcon, NearIconMini } from "../../MarginTrading/components/Icon";
import { CloseIcon } from "../../../components/Icons/Icons";

const ModalWithCountdown = ({ show, onClose }) => {
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
      style={{ width: `${progress}%`, backgroundColor: "#D2FF3A", height: "3px" }}
    />
  );

  return (
    <div>
      {isModalVisible && (
        <div className="z-50 fixed right-5 bottom-10 w-93 h-36 bg-dark-100 text-white border-gray-1050 border rounded-sm">
          <div className="relatvie w-full h-full p-6 flex flex-col justify-between">
            <div onClick={onClose} className="absolute" style={{ top: "-6px", right: "-4px" }}>
              <CloseIcon />
            </div>
            <div className="fc">
              <div className="fc">
                <NearIconMini />
                <span className="font-normal text-base px-2">Open Position</span>
                <div
                  className="text-sm text-toolTipBoxBorderColor rounded-sm p-1"
                  style={{ backgroundColor: "rgba(210, 255, 58, 0.1)" }}
                >
                  Long Near
                </div>
              </div>
              <div className="text-gray-1000 text-sm ml-auto">Filled</div>
            </div>
            <div className="fc justify-between text-sm font-normal">
              <span className="text-gray-300">Price</span>
              <span>$3.34</span>
            </div>
            <div className="fc justify-between text-sm font-normal">
              <span className="text-gray-300">Position Size</span>
              <span>
                45.2435 NEAR
                <span className="text-xs text-gray-300">($149.35)</span>
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
