import React, { useCallback } from "react";
import { Hourglass } from "react95";

type Props = {
  loading?: boolean;
  size?: number;
  className?: string;
  classNames?: Record<"base" | "loading", string>;
  children?: React.ReactNode;
  target?: string;
};
export default function Loading({
  className,
  classNames,
  size,
  children,
  loading,
  target = "div",
}: Props = {}) {
  const Target = useCallback(
    ({ children, className }: { children?: React.ReactNode; className?: string }) => {
      return React.createElement(target, { className }, children);
    },
    [target],
  );
  return (
    <Target className={`relative h-full ${classNames?.base ?? ""} ${className ?? ""}`}>
      {loading && (
        <Hourglass
          className={
            children
              ? `absolute z-[1] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
                  classNames?.loading ?? ""
                }`
              : classNames?.loading ?? ""
          }
          size={size || 32}
        />
      )}
      {children}
    </Target>
  );
}
