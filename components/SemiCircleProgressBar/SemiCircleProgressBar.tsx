import React from "react";
import styled from "styled-components";
import { twMerge } from "tailwind-merge";
import ToolTip from "../ToolTip";
import CustomTooltips from "../CustomTooltips/CustomTooltips";

const MAX_DEGREE = 225;
const SemiCircleProgressBar = ({
  percent = 0,
  children,
  value,
  dividerValue,
  dividerPercent,
  isWarning,
}) => {
  let rotateDegree = 45; // start degree
  let isUnderDivider;
  // advance usage
  if (value < 0) {
    value = 0;
  }
  if (value !== undefined && dividerValue) {
    // const base = MAX_DEGREE - rotateDegree;
    // percent = value * base;
    if (value < dividerValue) {
      isUnderDivider = true;
    }
  }
  // temp
  rotateDegree = value ? value + rotateDegree : rotateDegree;
  rotateDegree = Math.min(rotateDegree, MAX_DEGREE);
  let node;
  if (children) {
    node = children;
  } else {
    node = (
      <span className={twMerge(isWarning && "text-warning", isUnderDivider && "text-orange")}>
        {percent}%
      </span>
    );
  }

  return (
    <StyledWrapper>
      <div className="bar-wrapper">
        <div className="bar-container">
          <div
            className={twMerge("bar", isWarning && "bar-warning", isUnderDivider && "bar-orange")}
            style={{ transform: `rotate(${rotateDegree}deg)` }}
          />
          <div className={twMerge("bg-primary bar-divider hidden", "block")} />
          <StyledHiddenTooltip>
            <ToolTip content="100% health factor warning line" />
          </StyledHiddenTooltip>
        </div>
        {node}
      </div>
    </StyledWrapper>
  );
};

const StyledHiddenTooltip = styled.div`
  width: 30px;
  height: 30px;
  position: absolute;
  z-index: 99;
  //top: 27px;
  //right: 21px;
  top: -6px;
  right: 82px;
  opacity: 0;
`;

const StyledWrapper = styled.div`
  position: relative;
  margin: 4px;
  text-align: center;

  .bar-wrapper {
    position: relative;
    width: 240px;
    height: 120px;
    display: flex;
    justify-content: center;
    align-items: end;
  }

  .bar-container {
    position: relative;
    overflow: hidden; /* Comment this line to understand the trick */
    width: 240px;
    height: 120px;
    display: flex;
    justify-content: center;
    align-items: end;

    .bar {
      position: absolute;
      top: 3px;
      left: 0;
      //width: 180px;
      //height: 180px;
      width: 240px;
      height: 240px;
      border-radius: 50%;
      box-sizing: border-box;
      border: 10px solid #00f7a5; /* half gray, */
      border-bottom-color: #00f7a5; /* half azure */
      border-right-color: #00f7a5;
      opacity: 1;

      &.bar-warning {
        border-bottom-color: #f3ba2f;
        border-right-color: #f3ba2f;
      }

      &.bar-orange {
        border-bottom-color: #ff5500;
        border-right-color: #ff5500;
      }
    }

    .bar-divider {
      height: 21px;
      width: 6px;
      background: #979abe;
      position: absolute;
      border-radius: 4px;
      //top: 26px;
      //right: 37px;
      //transform: rotate(45deg);
      top: 0;
      right: 95px;
      transform: rotate(11deg);
    }
  }

  @media (max-width: 767px) {
    //.bar-wrapper,
    //.bar-container,
    //.bar {
    //  width: 160px !important;
    //  height: 160px !important;
    //}
    //
    //.bar-wrapper,
    //.bar-container {
    //  height: 80px !important;
    //}
    //
    //.bar {
    //  border-width: 6px !important;
    //}
    //
    //.bar-divider {
    //  top: 21px !important;
    //  right: 19px !important;
    //}
  }
`;

export default SemiCircleProgressBar;
