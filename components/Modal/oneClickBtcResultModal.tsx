import React from "react";
import Modal from "react-modal";
import { isMobileDevice } from "../../helpers/helpers";
import {
  CloseIcon,
  BTCChainIcon,
  NEARChainIcon,
  LineLeft,
  LineRight,
  WaitIcon,
  CompletedIcon,
  LinkIcon,
} from "./svg";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { getOneClickBtcModalOpen, getOneClickBtcResultStatus } from "../../redux/appSelectors";
import { hideOneClickBtcModal, setOneClickBtcStatus } from "../../redux/appSlice";

export default function OneClickBtcResultModal() {
  const dispatch = useAppDispatch();
  // const isOpen = useAppSelector(getOneClickBtcModalOpen);
  const isOpen = true;
  const status = useAppSelector(getOneClickBtcResultStatus);
  const mobile = isMobileDevice();
  function closeModal() {
    dispatch(hideOneClickBtcModal());
    dispatch(setOneClickBtcStatus({ status: {} }));
  }
  function goExplore(chain: string, hash) {
    if (chain == "NEAR") {
      window.open(`https://nearblocks.io/txns/${hash}`);
    } else if (chain == "BTC") {
      window.open(`https://mempool.space/tx/${hash}`);
    }
  }
  const cardWidth = mobile ? "95vw" : "430px";
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={(e) => {
        // e.stopPropagation();
        // closeModal();
      }}
      style={{
        overlay: {
          backdropFilter: "blur(15px)",
          WebkitBackdropFilter: "blur(15px)",
        },
        content: {
          outline: "none",
          transform: "translate(-50%, -50%)",
        },
      }}
    >
      <div
        style={{ width: cardWidth, maxHeight: "95vh" }}
        className="outline-none  bg-dark-100 border border-dark-50 overflow-auto rounded-2xl  xsm:rounded-lg p-5"
      >
        <div className="flex justify-between mb-4">
          <span className="text-white text-base gotham_bold xsm:text-xl">Transaction Detail</span>
          <CloseIcon className="cursor-pointer" onClick={closeModal} />
        </div>
        {status?.fromChainHash ? (
          <div className="flex items-center justify-between w-[150px] mx-auto my-5">
            {status?.fromChain == "BTC" ? (
              <BTCChainIcon className="flex-shrink-0" />
            ) : (
              <NEARChainIcon className="flex-shrink-0" />
            )}
            <LineLeft className="flex-shrink-0" />
            {status?.toChainHash ? (
              <CompletedIcon className="flex-shrink-0" />
            ) : (
              <WaitIcon className="flex-shrink-0 animate-waiting" />
            )}
            <LineRight className="flex-shrink-0" />
            {status?.toChain == "BTC" ? (
              <BTCChainIcon className="flex-shrink-0" />
            ) : (
              <NEARChainIcon className="flex-shrink-0" />
            )}
          </div>
        ) : null}

        <div className="text-base text-gray-300">
          {!status?.fromChainHash && !status?.toChainHash
            ? status?.failedText
            : status?.toChainHash
            ? status?.successText
            : "Your transaction require 2-3 Bitcoin block confirmation base on the size you deposit /ramp-ed."}
        </div>
        {status?.fromChainHash ? (
          <div className="flex flex-col mt-6 text-sm text-gray-300">
            <p>Track your transaction here:</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div
                onClick={() => {
                  goExplore(status?.fromChain, status?.fromChainHash);
                }}
                className="flex items-center justify-center cursor-pointer bg-white bg-opacity-10 rounded-lg text-xs text-gray-300 py-1.5 gap-1.5 w-[85px]"
              >
                SRC TX <LinkIcon />
              </div>
              {status?.toChainHash ? (
                <div
                  onClick={() => {
                    goExplore(status?.toChain, status?.toChainHash);
                  }}
                  className="flex items-center justify-center cursor-pointer bg-white bg-opacity-10 rounded-lg text-xs text-gray-300 py-1.5 gap-1.5  w-[85px]"
                >
                  TARGET TX <LinkIcon />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div
          onClick={closeModal}
          className="flex items-center justify-center h-[36px] w-[100px] rounded-md text-base font-bold hover:opacity-80 outline-none bg-primary text-dark-200 cursor-pointer mx-auto mt-6"
        >
          Confirm
        </div>
      </div>
    </Modal>
  );
}
