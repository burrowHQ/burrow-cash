import { styled } from "@mui/material/styles";
import { Toolbar, Link, MenuItem } from "@mui/material";
import { display } from "@mui/system";

export const Wrapper = styled(Toolbar)(({ theme }) => ({
  display: "grid",
  color: "white",
  [theme.breakpoints.down("sm")]: {
    alignItems: "start",
    marginTop: "0.5rem",
    gridTemplateAreas: `
    "logo wallet"
    "menu menu"`,
  },
  [theme.breakpoints.up("sm")]: {
    gridTemplateAreas: `"logo menu wallet"`,
    gridTemplateColumns: "auto auto 1fr",
    gap: "5rem",
  },
}));

export const Logo = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  gridArea: "logo",
  justifySelf: "start",
  alignSelf: "center",
  gap: "8px",
  cursor: "pointer",
}));

export const Menu = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gridArea: "menu",
  // gap: "0.5rem",
  gap: "55px",
  gridTemplateColumns: "repeat(4, 1fr)",
  marginRight: "auto",
  [theme.breakpoints.down("sm")]: {
    margin: "0 auto",
    marginTop: "1rem",
  },
}));

export const LinkStyled = styled(Link)(({ theme }) => ({
  color: "white",
  textDecoration: "none",
  fontFamily: "work-sans",
  textAlign: "center",
  fontSize: "16px",
  lineHeight: 1.75,
  letterSpacing: "0.02857rem",
  paddingTop: 4,
  paddingBottom: 4,
  cursor: "pointer",
  ":hover": {
    opacity: "0.8",
  },
}));

export const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  color: theme.custom.text,
  "&:hover": {
    backgroundColor: theme.palette.primary.light,
  },
}));

export const WrapperMobile = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

export const WalletMobile = styled("div")(() => ({
  display: "flex",
}));
export const WrapperMenuMobile = styled("div")(() => ({
  backgroundColor: "#202026",
  borderBottomLeftRadius: "12px",
  borderBottomRightRadius: "12px",
  outline: "none",
  paddingTop: "16px",
}));
