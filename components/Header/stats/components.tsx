import { isValidElement, useState } from "react";
import { Box, Stack, ButtonGroup, Button, Typography, Tooltip, useTheme } from "@mui/material";
import { TagToolTip } from "../../ToolTip";
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
  labels,
  onClick,
}: {
  title: string | React.ReactElement;
  titleTooltip?: string;
  amount: string | React.ReactElement;
  labels?: any;
  onClick?: () => void;
}) => {
  return (
    <div onClick={() => onClick && onClick()} style={{ minHeight: 81 }} className="md:w-[351px]">
      <div className="flex items-center gap-1">
        {typeof title === "string" ? <div className="h6 text-gray-300">{title}</div> : title}
        {titleTooltip && <TagToolTip title={titleTooltip} />}
      </div>
      <div className="h2 my-1">{amount}</div>
      {/* </Tooltip> */}
      {labels && (
        <Stack direction="row" gap="4px" flexWrap="wrap" alignItems="center">
          {isValidElement(labels) ? (
            <Label>{labels}</Label>
          ) : (
            labels?.map((row, i) => {
              const firstData = row[0];
              if (!firstData) return null;
              if (firstData.type === "component") {
                return firstData.content;
              }
              return (
                <div
                  className="flex gap-1 items-start flex-col md:flex-row md:flex-wrap"
                  key={`${firstData.text}${i}`}
                >
                  <div
                    className="flex md:items-center gap-2 h6 rounded md:rounded-[21px] bg-dark-100 truncate"
                    style={{ padding: "3px 6px 5px" }}
                  >
                    <div style={firstData.textStyle} className="h6 text-gray-300">
                      {firstData.text}
                    </div>
                    <div className="flex flex-col gap-1 md:flex-row">
                      {row?.map((d) => {
                        if (!d.value) {
                          return null;
                        }
                        return (
                          <div
                            style={d.valueStyle}
                            className="flex items-center gap-1"
                            key={`${d.text}${d.value}`}
                          >
                            {d.icon && (
                              <div>
                                <TokenIcon width={15} height={15} icon={d.icon} />
                              </div>
                            )}
                            {d.value}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </Stack>
      )}
    </div>
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
