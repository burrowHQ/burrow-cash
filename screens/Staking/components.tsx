// @ts-nocheck
import { Typography, Stack, Box, useTheme } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";

import { useLayoutEffect, useState } from "react";
import { TOKEN_FORMAT } from "../../store";
import { useAppSelector } from "../../redux/hooks";
import { getAccountRewards } from "../../redux/selectors/getAccountRewards";

export const BrrrLogo = ({ color = "#594A42", width = 44, height = 44, className = "" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="22" cy="22" r="22" fill="#594A42" />
      <path
        d="M6.00049 22.9989C6.00049 30.4656 10.4449 38.7767 12.6672 41.9989C14.0005 42.6656 16.1116 43.2211 17.0005 43.3322C14.556 39.5545 9.86716 30.9322 9.33382 23.9989C8.66716 15.3322 15.0664 11.6491 19.0005 10.6656C24.3338 9.33224 26.6672 9.9989 29.0005 10.9989C32.3003 12.4131 31.1747 16.158 29.3338 17.9989C27.0005 20.3322 21.3338 22.6656 18.3338 22.3322C15.3338 21.9989 17.6672 19.3322 21.3338 18.3322C23.5319 17.7327 26.2227 17.7767 27.3338 17.9989C27.3338 17.9989 28.0005 17.6656 28.6672 16.9989C29.347 16.319 29.7783 15.7767 30.0005 15.3322C29.1116 15.2211 26.7338 14.7322 23.0005 14.9989C18.3338 15.3322 14.5722 18.3789 14.0005 20.6656C13.3338 23.3322 16.0005 27.9989 26.3338 23.3322C36.6672 18.6656 34.3338 12.9989 33.6672 11.6656C33.0005 10.3322 30.3338 6.33225 21.6672 6.99892C13.0005 7.66558 6.00049 13.6656 6.00049 22.9989Z"
        fill="white"
      />
      <path
        d="M34.6672 25.9989C36.2672 22.7989 34.7783 20.3322 33.6672 19.6656C33.9338 19.3989 34.6672 17.7767 35.0005 16.9989C37.3338 18.6656 38.6005 20.7989 38.3338 23.9989C38.0005 27.9989 35.0005 31.6656 29.0005 33.6656C23.0005 35.6656 17.6672 34.3322 16.6672 33.9989C15.6672 33.6656 14.3338 32.9989 14.6672 31.6656C14.9969 30.3464 16.2227 30.5545 16.6672 30.6656C17.556 30.9989 19.8005 31.6656 23.0005 31.6656C27.0005 31.6656 32.6672 29.9989 34.6672 25.9989Z"
        fill="white"
      />
    </svg>
  );
};

export const StakingPill = ({ children, sx = {} }) => (
  <Typography
    sx={{
      fontWeight: "semibold",
      fontSize: "0.65rem",
      background: "#9b8579",
      color: "#fff",
      py: "0.5rem",
      px: "0.8rem",
      borderRadius: 100,
      ...sx,
    }}
  >
    {children}
  </Typography>
);

export const StakingCard = ({
  value,
  color = "#594A42",
  label,
  buttonLabel,
  onClick,
  isDisabled = false,
  isLoading = false,
}) => {
  const theme = useTheme();

  return (
    <Stack
      spacing={2}
      sx={{
        boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.15)",
        p: "1.5rem",
        minWidth: "200px",
        alignItems: "center",
        borderRadius: "0.5rem",
        bgcolor: theme.custom.stakingCardBg,
      }}
    >
      <BrrrLogo color={color} width={40} height={40} />
      <Typography fontSize="1.2rem" fontWeight="semibold" color={color}>
        {value}
      </Typography>
      <Typography fontSize="0.65rem" color="#767676">
        {label}
      </Typography>
      <LoadingButton
        size="small"
        variant="contained"
        onClick={onClick}
        sx={{ minWidth: 130 }}
        disabled={isDisabled}
        loading={isLoading}
      >
        {buttonLabel}
      </LoadingButton>
    </Stack>
  );
};

export const Separator = ({ sx = {} }) => (
  <Box
    flex={1}
    mx={1}
    height="1px"
    bgcolor="rgba(0, 0, 0, 0.01)"
    border="0.5px dashed rgba(0, 0, 0, 0.1)"
    sx={sx}
  />
);
