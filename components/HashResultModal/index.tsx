import React from "react";
import ReactDOM from "react-dom";
import ModalWithCountdown from "./ModalWithCountdown";

interface ShowPositionResultParams {
  title?: string;
  type?: "Long" | "Short";
  price?: string;
  transactionHashes?: string;
  positionSize?: {
    amount: string;
    symbol: string;
    usdValue: string;
  };
}

let container: HTMLDivElement | null = null;

export const showPositionResult = (params: ShowPositionResultParams) => {
  if (params.transactionHashes) {
    const shownTxs = localStorage.getItem("shownTransactions") || "[]";
    const shownTxArray = JSON.parse(shownTxs);

    if (shownTxArray.includes(params.transactionHashes)) {
      return;
    }

    shownTxArray.push(params.transactionHashes);
    if (shownTxArray.length > 100) {
      shownTxArray.shift();
    }
    localStorage.setItem("shownTransactions", JSON.stringify(shownTxArray));
  }

  if (!container) {
    container = document.createElement("div");
    container.id = "position-result-container";
    document.body.appendChild(container);
  }

  const handleClose = () => {
    if (container) {
      ReactDOM.unmountComponentAtNode(container);
      container.remove();
      container = null;
    }
  };

  ReactDOM.render(<ModalWithCountdown show onClose={handleClose} {...params} />, container);
};
