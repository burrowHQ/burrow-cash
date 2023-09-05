import { isValidElement } from "react";
import { Box, Stack, ButtonGroup, Button, Typography, Tooltip, useTheme } from "@mui/material";
import { MdInfoOutline } from "@react-icons/all-files/md/MdInfoOutline";

import { useAccountId } from "../../../hooks/hooks";
import { useStatsToggle } from "../../../hooks/useStatsToggle";
import TokenIcon from "../../TokenIcon";

export const StatsToggleButtons = () => {
  const { protocolStats, setStats } = useStatsToggle();
  const accountId = useAccountId();
  const theme = useTheme();

  const buttonStyles = {
    borderRadius: "4px",
    px: "1.5rem",
    color: "white",
    borderColor: theme.custom.userMenuColor,
    background: theme.custom.userMenuColor,
    fontSize: "0.75rem",
    textTransform: "none",
  } as any;

  const buttonActiveStyles = {
    background: "white",
    border: `2px solid ${theme.custom.userMenuColor} !important`,
    color: "#191f53",
    "&:hover": {
      background: "white",
    },
  };

  const msx = {
    ...buttonStyles,
    ...(protocolStats ? {} : buttonActiveStyles),
  };

  const psx = {
    ...buttonStyles,
    ...(protocolStats ? buttonActiveStyles : {}),
  };

  if (!accountId) return null;

  return (
    <ButtonGroup disableElevation variant="text" size="small" sx={{ height: "2rem" }}>
      <Button sx={msx} onClick={() => setStats(false)}>
        My Stats
      </Button>
      <Button sx={psx} onClick={() => setStats(true)}>
        Protocol
      </Button>
    </ButtonGroup>
  );
};

const COLORS = {
  green: {
    bgcolor: "rgba(172, 255, 255, 0.1)",
    color: "#ACFFD1",
  },
  yellow: {
    bgcolor: "rgba(255, 255, 172, 0.1)",
    color: "#FFAC00",
  },
  red: {
    bgcolor: "rgba(255, 172, 172, 0.1)",
    color: "#FFACAC",
  },
};

const getColor = (color = "green") => COLORS[color];

export const Stat = ({
  title,
  titleTooltip = "",
  amount,
  tooltip = "",
  labels,
  onClick,
}: {
  title: string | React.ReactElement;
  titleTooltip?: string | React.ReactElement;
  amount: string;
  tooltip?: string;
  labels?: any;
  onClick?: () => void;
}) => {
  return (
    <Stack onClick={() => onClick && onClick()} sx={{ cursor: onClick ? "pointer" : "inherit" }}>
      <Stack justifyContent="end">
        <Tooltip
          title={titleTooltip}
          placement="top"
          arrow
          componentsProps={
            {
              // tooltip: { style: { backgroundColor: "rgba(255,255,255,0.1)" } },
              // arrow: { style: { color: "rgba(255,255,255,0.1)" } },
            }
          }
        >
          <Stack direction="row" alignItems="end" width="max-content">
            {typeof title === "string" ? <div className="h6 text-gray-300">{title}</div> : title}
            {titleTooltip && (
              <MdInfoOutline
                style={{
                  marginLeft: "3px",
                  color: "white",
                  position: "relative",
                  top: "0px",
                }}
              />
            )}
          </Stack>
        </Tooltip>
      </Stack>
      <Tooltip title={tooltip} placement="top" arrow>
        <div className="h2">{amount}</div>
      </Tooltip>
      {labels && (
        <Stack direction="row" gap="4px" flexWrap="wrap">
          {isValidElement(labels) ? (
            <Label>{labels}</Label>
          ) : (
            labels?.map((row, i) => (
              <div className="flex gap-1 items-start flex-col md:flex-row" key={i}>
                {row?.map((d) => {
                  if (!d.value) {
                    return null;
                  }
                  return (
                    <div
                      key={`${d.text}${d.value}`}
                      className="flex items-center gap-2 h5 rounded-[21px] bg-dark-100 truncate"
                      style={{ padding: "3px 8px 5px" }}
                    >
                      <div style={d.textStyle} className="h5 text-gray-300">
                        {d.text}
                      </div>
                      <div style={d.valueStyle} className="flex items-center gap-1">
                        {d.icon && (
                          <div>
                            <TokenIcon width={15} height={15} icon={d.icon} />
                          </div>
                        )}
                        {d.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </Stack>
      )}
    </Stack>
  );
};

const Label = ({ children, tooltip = "", bgcolor = "rgba(172, 255, 255, 0.1)", ...props }) => (
  <Tooltip title={tooltip} placement="top" arrow>
    <Stack
      direction="row"
      gap="4px"
      bgcolor={bgcolor}
      borderRadius="4px"
      py="4px"
      px="6px"
      fontSize="0.6875rem"
      position="relative"
      {...props}
    >
      {children}
    </Stack>
  </Tooltip>
);
