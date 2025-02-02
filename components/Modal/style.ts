import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

export const Wrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  display: "flex",
  backgroundColor: "#2E304B",
  border: "1px solid #4F5178",
  boxShadow: "0px 0px 10px 4px #00000026",
  flexDirection: "column",
  overflow: "auto",
  [theme.breakpoints.down("sm")]: {
    position: "absolute",
    width: "100%",
    bottom: "32px",
    left: "0",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
  },
  [theme.breakpoints.up("sm")]: {
    top: "50%",
    transform: "translateY(-50%)",
    left: "calc(50% - 210px)",
    display: "flex",
    maxHeight: "80vh",
    width: "420px",
    borderRadius: "6px",
  },
}));
