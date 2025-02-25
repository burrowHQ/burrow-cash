import React from "react";
import styled from "styled-components";
import { BaseProps } from "../../interfaces/common";

export interface BoxProps extends BaseProps {
  style?: object;
  padding?: string;
}

export const ContentBox = ({ children, style, className, padding }: BoxProps) => {
  return (
    <StyledBox style={style} className={className} padding={padding}>
      {children}
    </StyledBox>
  );
};
export const ContentTipBox = ({ children, style, className, padding }: BoxProps) => {
  return (
    <StyledTipBox style={style} className={className} padding={padding}>
      {children}
    </StyledTipBox>
  );
};

const StyledTipBox = styled.div<{ padding?: string }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  border-radius: 6px;
  border: 1px solid #303037;
  background: #202026;
  font-size: 12px;
  padding: ${(p) => p.padding ?? "20px 30px"};
`;

const StyledBox = styled.div<{ padding?: string }>`
  position: relative;
  border-radius: 12px;
  border: 1px solid #303037;
  background: #202026;
  padding: ${(p) => p.padding ?? "20px 30px"};

  @media (max-width: 767px) {
    padding: 20px;
  }
`;
