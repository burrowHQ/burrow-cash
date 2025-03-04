import { Snackbar } from "@mui/material";
import React from "react";
import { useToastMessage } from "../../hooks/hooks";

export const ToastMessage = () => {
  const { toastMessage, showToast } = useToastMessage();

  const handleClose = () => {
    showToast("");
  };

  return (
    <Snackbar
      open={!!toastMessage}
      autoHideDuration={1000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <div className="flex items-center justify-center border border-dark-50 text-sm text-white rounded-md bg-dark-100 px-2 py-1">
        {toastMessage}
      </div>
    </Snackbar>
  );
};
