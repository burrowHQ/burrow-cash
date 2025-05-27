import React, { useState } from "react";
import Modal from "react-modal";
import { isMobileDevice } from "../../helpers/helpers";
import { CloseIcon } from "../Modal/svg";

export default function MaintenanceModal({
  isOpen,
  onRequestClose,
}: {
  isOpen: boolean;
  onRequestClose: any;
}) {
  const mobile = isMobileDevice();
  function closeModal() {
    onRequestClose();
  }
  const cardWidth = mobile ? "95vw" : "420px";
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
        className="flex flex-col items-center outline-none  bg-dark-100 border border-dark-50 overflow-auto rounded-2xl  xsm:rounded-lg p-5 text-center"
      >
        <span className="text-base  text-gray-300">
          The OneClick Deposit feature is currently under maintenance; Withdrawals are not affected.
        </span>
        <div
          onClick={closeModal}
          className="flex items-center justify-center h-[32px] rounded-md text-base font-bold hover:opacity-80 outline-none bg-primary text-dark-200 cursor-pointer w-[90px] mt-4"
        >
          Got it
        </div>
      </div>
    </Modal>
  );
}
