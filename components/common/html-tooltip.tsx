import { Tooltip, styled, TooltipProps, tooltipClasses } from "@mui/material";

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip placement={props.placement || "top-start"} {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#2E304B",
    boxShadow: "0px 0px 10px 4px #00000026",
    color: "#C0C4E9",
    border: "1px solid #4F5178",
    borderRadius: "6px",
    padding: "8px 8px",
    fontSize: "12px",
    fontFamily: "work-sans",
    fontWeight: "normal",
  },
}));

export default HtmlTooltip;
