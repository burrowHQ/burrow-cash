import { useState, useMemo, useEffect } from "react";
import { UIAsset } from "../../interfaces";
import { ArrowDownIcon } from "./svg";
import SelectToken, { IAssetType } from "../SelectToken";
import { IToken } from "../../interfaces/asset";
import { standardizeAsset } from "../../utils";
import { isMobileDevice } from "../../helpers/helpers";

export default function TokenBox({ asset, action }: { asset: UIAsset; action: string }) {
  const [open, setOpen] = useState<boolean>(false);
  const is_supply = action === "Supply";
  const is_borrow = action === "Borrow";
  const is_select = is_supply || is_borrow;
  const { symbol, icon, isLpToken, tokens } = asset;
  function swithToken() {
    if (is_select) {
      setOpen(!open);
    }
  }
  function getIcons() {
    return (
      <div className="flex items-center justify-center flex-wrap flex-shrink-0">
        {isLpToken ? (
          tokens.map((token: IToken, index) => {
            return (
              <img
                key={token.token_id}
                src={token.metadata?.icon}
                alt=""
                className={`w-[26px] h-[26px] rounded-full relative ${
                  index !== 0 ? "-ml-1.5" : ""
                }`}
              />
            );
          })
        ) : (
          <img src={icon} alt="" className="w-[26px] h-[26px] rounded-full" />
        )}
      </div>
    );
  }
  function getSymbols() {
    return (
      <div className="flex items-center flex-wrap max-w-[90px] flex-shrink-0">
        {isLpToken ? (
          tokens.map((token: IToken, index) => {
            const { metadata } = token;
            return (
              <span className="text-xs text-white" key={token.token_id}>
                {metadata?.symbol}
                {index === tokens.length - 1 ? "" : "-"}
              </span>
            );
          })
        ) : (
          <span className="text-base text-white">{symbol}</span>
        )}
      </div>
    );
  }
  return (
    <div
      className="relative flex-shrink-0"
      tabIndex={0}
      onBlur={() => {
        if (!isMobileDevice()) {
          setOpen(false);
        }
      }}
    >
      <div
        onClick={swithToken}
        className={`flex items-center gap-2.5 h-[40px] ${
          is_select ? "bg-dark-250 rounded-md px-2.5 cursor-pointer" : "mr-2"
        }`}
      >
        <div className="flex items-center gap-1.5">
          {getIcons()}
          {/* {getSymbols()} */}
        </div>
        <ArrowDownIcon className={`${is_select ? "" : "hidden"}`} />
      </div>
      {is_select && (
        <SelectToken
          open={open}
          setOpen={setOpen}
          assetType={action.toLocaleLowerCase() as IAssetType}
        />
      )}
    </div>
  );
}
