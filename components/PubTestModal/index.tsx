import React, { useState } from "react";
import Modal from "react-modal";
import { isMobileDevice } from "../../helpers/helpers";
import { CloseIcon } from "../Modal/svg";

export default function PubTestModal() {
  const [isOpen, setIsOpen] = useState(localStorage.getItem("pub-testnet-modal-show") !== "1");
  const mobile = isMobileDevice();
  function closeModal() {
    setIsOpen(false);
    localStorage.setItem("pub-testnet-modal-show", "1");
  }
  const cardWidth = mobile ? "95vw" : "430px";
  // eslint-disable-next-line no-restricted-globals
  if (location.hostname !== "test.burrow.fun") return null;
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
          <span className="text-white text-2xl gotham_bold xsm:text-xl">public testnet</span>
          <CloseIcon className="cursor-pointer" onClick={closeModal} />
        </div>
        <span className="text-base  text-gray-300">
          This URL is for a public testnet, intended for testing purposes only. Please log in using
          a testnet wallet.
        </span>
      </div>
    </Modal>
  );
}
