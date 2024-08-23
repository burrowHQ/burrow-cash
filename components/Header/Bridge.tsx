import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "./svg";

const Bridge = () => {
  const [show_bridge_box, set_show_bridge_box] = useState(false);

  function open_new_window(url: string) {
    window.open(url);
  }
  return (
    <div
      className="relative flex flex-col items-center justify-center"
      onMouseEnter={() => {
        set_show_bridge_box(true);
      }}
      onMouseLeave={() => {
        set_show_bridge_box(false);
      }}
    >
      <span className="flex items-center justify-center h-full text-base text-primary cursor-pointer">
        Bridge
      </span>
      <div className={`absolute top-10 pt-3 z-50 ${show_bridge_box ? "" : "hidden"}`}>
        <div className={`border border-dark-300 bg-dark-100 rounded-md p-2.5 pb-1.5 `}>
          {bridgeList.map(({ title, subTitle, link }, index: number) => {
            return (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
              <div
                key={index}
                onClick={(e) => {
                  open_new_window(link);
                }}
                style={{
                  minWidth: "200px",
                }}
                className="flex flex-col items-start w-[230px] hover:bg-gray-500 px-2 py-2.5 rounded-md bg-opacity-30 cursor-pointer mb-1"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-base text-white">{title}</span>
                  <ArrowRight />
                </div>
                <span className="flex items-center flex-wrap text-base text-gray-300 mt-1">
                  {subTitle}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export const bridgeList: IBridge[] = [
  {
    title: "Rainbow",
    subTitle: "Ethereum | Aurora",
    link: "https://rainbowbridge.app/",
  },
  {
    title: "Aggregate Bridge",
    subTitle: "Arbitrum | Ethereum | Base Optimism | Scroll",
    link: "https://app.ref.finance/bridge",
  },
  {
    title: "Token Bridge",
    subTitle: "Ethereum | Near | Solana",
    link: "https://tokenbridge.app",
  },
  // {
  //   title: "Electron Labs",
  //   subTitle: "Ethereum",
  //   link: "https://mainnet.electronlabs.org/bridge",
  // },
];

type IBridge = {
  title: string;
  subTitle: string;
  link: string;
};

export default Bridge;
