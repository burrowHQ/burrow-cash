import React from "react";
import { ChainSupplyMobile3Icon, ChainSupplyMobileJumpIcon } from "./icon";
import { GuideCloseIcon } from "../Header/svg";

const FinalStepGuide: React.FC<{ onFinish?: () => void }> = ({ onFinish }) => {
  const handleJump = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col items-center p-6 mt-[-90px] ml-[-120px] xsm:ml-[-60px]">
      <div className="relative">
        <ChainSupplyMobile3Icon />
        <div className="absolute inset-0 top-[70px] flex flex-col items-start pl-4">
          <ul className="mt-4 space-y-2">
            <li
              className="cursor-pointer text-primary text-sm font-medium flex items-center"
              onClick={() => handleJump("https://dex.rhea.finance/")}
            >
              <span className="before:content-['•'] before:mr-2 before:text-primary" />
              <span className="underline">Rhea</span>
              <ChainSupplyMobileJumpIcon className="ml-2" />
            </li>
            <li
              className="cursor-pointer text-primary text-sm font-medium flex items-center"
              onClick={() => handleJump("https://ramp.satos.network/")}
            >
              <span className="before:content-['•'] before:mr-2 before:text-primary" />
              <span className="underline">Satoshi Ramp</span>
              <ChainSupplyMobileJumpIcon className="ml-2" />
            </li>
          </ul>
        </div>
      </div>
      <div className="w-full flex items-center justify-end mt-2 mr-[60px]">
        <span className="text-white text-sm mr-2">Got it</span>
        <div className="cursor-pointer" onClick={onFinish}>
          <GuideCloseIcon />
        </div>
      </div>
    </div>
  );
};

export default FinalStepGuide;
