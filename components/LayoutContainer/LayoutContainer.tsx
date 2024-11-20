import React from "react";
import styled from "styled-components";
import { useRouter } from "next/router";
import NonFarmedAssets from "../NonFarmedAssets";

type Props = {
  children: string | React.ReactNode;
  className?: string;
};

const LayoutContainer = ({ children, className = "" }: Props) => {
  const router = useRouter();
  const isSpecialPage = router.route.includes("staking") || router.route.includes("marginTrading");
  return (
    <StyledWrapper className={className}>
      {!isSpecialPage && <NonFarmedAssets />}
      {children}
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  max-width: 1240px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 20px;
  padding-right: 20px;

  @media (max-width: 767px) {
    max-width: 100%;
  }
`;

LayoutContainer.displayName = "LayoutContainer";
export default LayoutContainer;

export const LayoutBox = ({ children, className = "" }: Props) => {
  const router = useRouter();
  const isSpecialPage = router.route.includes("staking") || router.route.includes("marginTrading");
  return (
    <div
      className={`mx-auto lg:min-w-[800px] xl:max-w-[1200px] xsm:w-full xsm:overflow-x-hidden ${className}`}
    >
      <div className="xsm:hidden lg:w-full">{!isSpecialPage && <NonFarmedAssets />}</div>
      {children}
    </div>
  );
};
