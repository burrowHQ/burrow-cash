import { useState, createContext, useEffect } from "react";
import { Modal as MUIModal, Box, useTheme } from "@mui/material";
import { Wrapper } from "../../../components/Modal/style";
import TradingOperate from "./TradingOperate";
import { CloseIcon } from "../../../components/Modal/svg";

export default function TradingOperateMobile({ open, onClose, id }) {
  const theme = useTheme();
  return (
    <MUIModal open={open} onClose={onClose}>
      <Wrapper
        sx={{
          "& *::-webkit-scrollbar": {
            backgroundColor: theme.custom.scrollbarBg,
          },
        }}
      >
        <Box sx={{ p: ["16px", "20px"] }}>
          <div className="cursor-pointer  w-full flex items-center justify-end">
            <CloseIcon onClick={onClose} />
          </div>
          <TradingOperate onMobileClose={onClose} id={id} />
        </Box>
      </Wrapper>
    </MUIModal>
  );
}
