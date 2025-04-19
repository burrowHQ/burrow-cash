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
    dispatch(setOneClickBtcStatus({ status: {} }));
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
          <span className="text-white text-2xl gotham_bold xsm:text-xl">
            {status?.title || "BTC"}
          </span>
          <CloseIcon className="cursor-pointer" onClick={closeModal} />
        </div>
        <span className="text-base  text-gray-300">
          {status?.content || "BTC operation was successful!"}
        </span>
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
