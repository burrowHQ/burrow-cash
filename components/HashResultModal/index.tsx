import React from "react";
import { createRoot } from "react-dom/client";
import ModalWithCountdown from "./ModalWithCountdown";
import ModalWithFailure from "./ModalWithFailure";

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
let root: ReturnType<typeof createRoot> | null = null;

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
    root = createRoot(container);
  }

  const handleClose = () => {
    if (root) {
      root.unmount();
    }
    if (container) {
      container.remove();
      container = null;
      root = null;
    }
  };

  root?.render(<ModalWithCountdown show onClose={handleClose} {...params} />);
};

// ... existing code ...

export const showPositionFailure = (params: {
  title?: string;
  errorMessage?: string;
  type?: "Long" | "Short";
}) => {
  if (!container) {
    container = document.createElement("div");
    container.id = "position-result-container";
    document.body.appendChild(container);
    root = createRoot(container);
  }

  const handleClose = () => {
    if (root) {
      root.unmount();
    }
    if (container) {
      container.remove();
      container = null;
      root = null;
    }
  };

  root?.render(<ModalWithFailure show onClose={handleClose} {...params} />);
};
