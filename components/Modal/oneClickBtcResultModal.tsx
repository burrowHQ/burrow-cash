import React from "react";
import Modal from "react-modal";
import { isMobileDevice } from "../../helpers/helpers";
import { CloseIcon } from "./svg";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { getOneClickBtcModalOpen, getOneClickBtcResultStatus } from "../../redux/appSelectors";
import { hideOneClickBtcModal, setOneClickBtcStatus } from "../../redux/appSlice";

export default function OneClickBtcResultModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(getOneClickBtcModalOpen);
  const status = useAppSelector(getOneClickBtcResultStatus);
  const mobile = isMobileDevice();
  function closeModal() {
    dispatch(hideOneClickBtcModal());
    dispatch(setOneClickBtcStatus({ status: "" }));
  }
  const cardWidth = mobile ? "95vw" : "430px";
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={(e) => {
        e.stopPropagation();
        closeModal();
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
          <span className="text-white text-2xl gotham_bold xsm:text-xl">BTC</span>
          <CloseIcon className="cursor-pointer" onClick={closeModal} />
        </div>
        <span className="text-base  text-gray-300">
          {status == "success" ? "the BTC operation was successful!" : "the BTC operation failed!"}
        </span>
      </div>
    </Modal>
  );
}
