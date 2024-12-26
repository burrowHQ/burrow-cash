import React from "react";
import { createRoot } from "react-dom/client";
import ModalWithCountdown from "./ModalWithCountdown";
import ModalWithFailure from "./ModalWithFailure";
import ModalWithClosePosition from "./ModalWithClosePosition";
import ModalWithChangeCollateral from "./ModalWithChangeCollateral";
import ModalWithCheckTxBeforeShowToast from "./ModalWithCheckTxBeforeShowToast";

interface ShowPositionResultParams {
  title?: string;
  type?: "Long" | "Short";
  price?: string;
  transactionHashes?: string;
  positionSize?: {
    amount: string;
    symbol: string;
    totalPrice: string;
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

export const showPositionClose = (params: { title?: string; type?: "Long" | "Short" }) => {
  if (!container) {
    container = document.createElement("div");
    container.id = "position-result-container";
    document.body.appendChild(container);
    root = createRoot(container);
  }
  const handleClose = () => {
    localStorage?.removeItem("marginPopType");
    if (root) {
      root.unmount();
    }
    if (container) {
      container.remove();
      container = null;
      root = null;
    }
  };
  root?.render(<ModalWithClosePosition show onClose={handleClose} {...params} />);
};

interface ShowChangeCollateralParams {
  title?: string;
  type?: "Long" | "Short";
  icon: string;
  symbol: string;
  collateral: string;
}

export const showChangeCollateralPosition = (params: ShowChangeCollateralParams) => {
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
    localStorage?.removeItem("marginTransactionType");
  };

  root?.render(<ModalWithChangeCollateral show onClose={handleClose} {...params} />);
};

interface ShowCheckTxBeforeShowToast {
  txHash: string;
}

export const showCheckTxBeforeShowToast = (params: ShowCheckTxBeforeShowToast) => {
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
    localStorage?.removeItem("marginTransactionType");
  };

  root?.render(<ModalWithCheckTxBeforeShowToast show onClose={handleClose} {...params} />);
};
