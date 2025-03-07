import React from "react";
import { twMerge } from "tailwind-merge";
import BookTokenSvg from "../../public/svg/Group 74.svg";
import { ConnectWalletButton } from "../Header/WalletButton";

export default function UnLoginUi({ wraperClass }: { wraperClass?: string }) {
  return (
    <div
      className={twMerge(
        "relative flex flex-col justify-center items-center border border-dark-50 rounded-md bg-dark-110 lg:h-[234px] xsm:pb-[60px] xsm:px-5",
        wraperClass || "",
      )}
    >
      <div className="lg:hidden transform scale-50 -mt-16">
        <BookTokenSvg />
      </div>
      <div className="flex flex-col justify-center items-center xsm:-mt-16">
        <div className="text-xl text-white">Connect your wallet</div>
        <div className="text-base text-gray-160 mt-3 mb-8 text-center xsm:text-sm">
          Please connect your wallet to see your supplies, borrowings, and open positions.
        </div>
      </div>
      <ConnectWalletButton accountId="" className="xsm:w-full" />
      <div className="absolute right-[30px] xsm:hidden">
        <BookTokenSvg />
      </div>
    </div>
  );
}
