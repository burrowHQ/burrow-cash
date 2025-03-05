import React, { useState } from "react";
import { Tooltip } from "react-tooltip";
import { styled } from "styled-components";
import { WarnIcon } from "./svg";
import { QuestionIcon } from "../Icons/Icons";
import HtmlTooltip from "../common/html-tooltip";

type ITipType = "warn" | "question" | undefined;
export function TagToolTip({ title, type }: { title: any; type?: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <HtmlTooltip
      open={showTooltip}
      onOpen={() => setShowTooltip(true)}
      onClose={() => setShowTooltip(false)}
      title={title}
    >
      <span
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
      >
        {type === "warn" ? <WarnIcon /> : <QuestionIcon />}
      </span>
    </HtmlTooltip>
  );
}
// Deprecated
export default function ToolTip({
  content,
  type,
  children,
  id = "my-tooltip",
}: {
  content: string;
  type?: ITipType;
  children?: string | React.ReactNode;
  id?: string;
}) {
  return (
    <TipWrap className="cursor-pointer inline-flex mr-2">
      {children || (
        <span
          className="text-base text-white"
          data-tooltip-id="my-tooltip"
          data-tooltip-content={content}
        >
          {type === "warn" ? <WarnIcon /> : <QuestionIcon />}
        </span>
      )}
      <Tooltip id={id} />
    </TipWrap>
  );
}
const TipWrap = styled.div`
  #my-tooltip.react-tooltip {
    border: 1px solid #303037;
    border-radius: 6px;
    padding: 6px 12px;
    background-color: #202026 !important;
    max-width: 300px;
    z-index: 50;
    font-size: 12px;
    opacity: 1;
    color: rgba(198, 209, 218, 1);
    box-shadow: 0px 0px 10px 4px rgba(0, 0, 0, 0.15);
  }
  .react-tooltip .react-tooltip-arrow {
    display: none;
  }
`;
