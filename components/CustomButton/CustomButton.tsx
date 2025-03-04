import React, { forwardRef, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import styled from "styled-components";
import { LoadingSpinner } from "../LoadingSpinner";

type onClickHandler = (event: React.MouseEvent<HTMLElement>) => any;
type Props = {
  children: string | React.ReactNode;
  onClick?: onClickHandler;
  onMouseEnter?: onClickHandler;
  onMouseLeave?: onClickHandler;
  color?: keyof typeof btnColor;
  size?: keyof typeof btnSize;
  style?: object;
  disabled?: boolean;
  className?: string;
  isLoading?: boolean;
};

const CustomButton = forwardRef((props: Props, ref: any) => {
  const {
    children,
    onClick,
    onMouseEnter,
    onMouseLeave,
    color = "primary",
    size,
    style,
    disabled,
    className,
    isLoading,
  } = props;
  const [isAsyncLoading, setIsAsyncLoading] = useState(false);
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleClick = async (e: any) => {
    e.preventDefault();
    if (!isMounted.current) {
      return;
    }
    setIsAsyncLoading(true);
    try {
      if (typeof onClick === "function") {
        await onClick(e);
      }
    } catch (err) {
      throw e;
    } finally {
      if (isMounted.current) {
        setIsAsyncLoading(false);
      }
    }
  };

  const handleMouseEnter = (e: any) => {
    if (typeof onMouseEnter === "function") {
      onMouseEnter(e);
    }
  };

  const handleMouseLeave = (e: any) => {
    if (typeof onMouseLeave === "function") {
      onMouseLeave(e);
    }
  };
  const isDisabled = disabled || isAsyncLoading;
  const isLoading2 = isLoading !== undefined ? isLoading : isAsyncLoading;
  return (
    <StyledButton
      className={twMerge(
        "border-transparent border rounded-md px-4 transition duration-500 ease select-none",
        getBtnSizeClassName(size),
        isDisabled
          ? "bg-gray-500 hover:bg-gray-500 text-gray-400 border-transparent text-gray-300"
          : getBtnColorClassName(color),
        isLoading2 && "_loading",
        className,
      )}
      type="button"
      style={style}
      ref={ref}
      color={color}
      disabled={isDisabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {isLoading2 ? <LoadingSpinner /> : children}
    </StyledButton>
  );
});

const StyledButton = styled.button`
  &._loading {
    padding: 0;
  }
  .loading-spinner {
    .ldsring {
      border-color: #6d708d;
      height: 25px;
      width: 25px;

      ._spinner {
        height: 20px;
        width: 20px;
      }
    }
  }
`;

const btnColor = {
  primary: "border-primary bg-primary hover:opacity-80 text-black",
  primaryBorder:
    "border-primary border border-opacity-60 text-primary bg-primary hover:opacity-80 bg-opacity-5",
  errorBorder:
    "border border-orange border-opacity-60 text-orange bg-orange bg-opacity-5 hover:opacity-80",
  secondary: "border border-gray-1300 hover:border-gray-400 text-gray-300",
  secondary2: "border border-pink-400 hover:border-pink-400 text-pink-400",
  third: "rounded-full border border-1 border-black text-black font-bold",
  info: "border-warning bg-warning hover:opacity-80 text-black",
  custom: "",
};

const btnSize = {
  lg: "py-3 px-6 text-lg",
  md: "py-2 md:py-2 px-2 md:px-5 text-base md:text-sm min-h-[39px]",
  sm: "py-1 px-2 text-sm",
};

const getBtnColorClassName = (color: string | undefined) => {
  return btnColor[color as keyof typeof btnColor] || color;
};

const getBtnSizeClassName = (size = "md") => {
  return btnSize[size as keyof typeof btnSize] || size;
};

CustomButton.displayName = "CustomButton";
export default CustomButton;
