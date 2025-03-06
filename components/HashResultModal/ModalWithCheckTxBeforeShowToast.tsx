import React, { useState, useEffect } from "react";
import { CloseIcon, TransactionSuccessfulIcon } from "../Icons/Icons";
import { FilledIcon } from "./ModalWithCountdown";
import { toInternationalCurrencySystem_number } from "../../utils/uiNumber";
import getConfig, { defaultNetwork } from "../../utils/config";

interface ShowChangeCollateralParams {
  show: boolean;
  onClose: () => void;
  txHash: string;
}

const ModalWithCheckTxBeforeShowToast = ({ show, onClose, txHash }: ShowChangeCollateralParams) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [progress, setProgress] = useState(100);
  const config = getConfig();
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
        backgroundColor: "#00F7A5",
        height: "3px",
      }}
    />
  );
  return (
    <div>
      {isModalVisible && (
        <div className="z-50 fixed lg:right-5 bottom-10 lg:w-93 xsm:w-[94vw] xsm:ml-[3vw] bg-dark-110 text-white  border border-dark-50 rounded-sm">
          <div className="relatvie w-full h-full p-4 flex flex-col justify-between">
            <div
              onClick={hideModal}
              className="absolute rounded-full bg-gray-1250 p-1.5 frcc cursor-pointer hover:opacity-90"
              style={{ top: "-12px", right: "-8px" }}
            >
              <CloseIcon />
            </div>
            <div className="fc mb-1">
              <div className="fc">
                <TransactionSuccessfulIcon />
                <span className="font-normal text-base ml-2"> Transaction successful</span>
              </div>
              <div className="text-primary text-sm ml-auto flex items-center">
                <span className="mr-1">Filled</span>
                <FilledIcon />
              </div>
            </div>
            {txHash ? (
              <span
                className="inline-flex decoration-1 hover:text-white text-base text-gray-60  cursor-pointer underline"
                style={{
                  textDecorationThickness: "1px",
                  paddingLeft: "24px",
                }}
                onClick={() => {
                  window.open(`${config.explorerUrl}/txns/${txHash}`);
                }}
              >
                Click to view
              </span>
            ) : null}
            <div className="absolute bottom-0 z-50 w-full left-0">{renderProgressBar()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalWithCheckTxBeforeShowToast;
