import React, { useState, useContext, useEffect } from "react";
import { useDebounce } from "react-use";
import { NearIcon } from "../../MarginTrading/components/Icon";
import { TokenThinArrow, TokenSelected } from "./TradingIcon";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { getAssets } from "../../../redux/assetsSelectors";
import { getAccountId } from "../../../redux/accountSelectors";
import {
  setCategoryAssets1,
  setCategoryAssets2,
  setReduxcategoryCurrentBalance1,
  setReduxcategoryCurrentBalance2,
} from "../../../redux/marginTrading";
import { shrinkToken } from "../../../store";
import { toInternationalCurrencySystem_number } from "../../../utils/uiNumber";
import { getSymbolById } from "../../../transformers/nearSymbolTrans";
import { nearTokenId } from "../../../utils";

interface TradingTokenInter {
  tokenList: Array<any>;
  type: string;
  setOwnBanlance?: (key: string) => void;
  setForceUpdate?: () => void;
}
const TradingToken: React.FC<TradingTokenInter> = ({
  tokenList,
  type,
  setOwnBanlance,
  setForceUpdate,
}) => {
  let timer: NodeJS.Timeout;
  const dispatch = useAppDispatch();
  const account = useAppSelector((state) => state.account);
  const assets = useAppSelector(getAssets);
  const { ReduxcategoryAssets1, ReduxcategoryAssets2 } = useAppSelector((state) => state.category);
  const [ownBalance, setOwnBalance] = useState<string>("-");
  const [ownBalanceDetail, setOwnBalanceDetail] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const accountId = useAppSelector(getAccountId);
  const [selectedItem, setSelectedItem] = useState<any>(
    type === "cate1" ? ReduxcategoryAssets1 : ReduxcategoryAssets2,
  );
  const sendBalance = () => {
    if (setOwnBanlance) {
      setOwnBanlance(ownBalanceDetail);
    }
  };
  //
  useDebounce(
    () => {
      const getSelectedAssetAndBalanceSetter = () => {
        if (type === "cate1" && ReduxcategoryAssets1) {
          return {
            selectedAsset: ReduxcategoryAssets1,
            setReduxcategoryCurrentBalance: (value: any) =>
              dispatch(setReduxcategoryCurrentBalance1(value)),
          };
        } else if (type === "cate2" && ReduxcategoryAssets2) {
          return {
            selectedAsset: ReduxcategoryAssets2,
            setReduxcategoryCurrentBalance: (value: any) =>
              dispatch(setReduxcategoryCurrentBalance2(value)),
          };
        }
        return { selectedAsset: null, setReduxcategoryCurrentBalance: null };
      };

      const { selectedAsset, setReduxcategoryCurrentBalance } = getSelectedAssetAndBalanceSetter();

      if (!selectedAsset) {
        setSelectedItem(type === "cate1" ? ReduxcategoryAssets1 : ReduxcategoryAssets2);
        // setOwnBalance("-");
        return;
      }

      const tokenId = selectedAsset?.metadata["token_id"];
      const balance = account?.balances[tokenId];

      if (!tokenId || !balance) {
        // setOwnBalance("-");
        // setReduxcategoryCurrentBalance && setReduxcategoryCurrentBalance("-");
        setSelectedItem(type === "cate1" ? ReduxcategoryAssets1 : ReduxcategoryAssets2);
        return;
      }

      const { decimals } = selectedAsset.metadata;
      const waitUseKey = shrinkToken(balance, decimals);
      const formattedBalance = toInternationalCurrencySystem_number(waitUseKey);

      setOwnBalance(formattedBalance);
      setOwnBalanceDetail(waitUseKey);
      setReduxcategoryCurrentBalance && setReduxcategoryCurrentBalance(waitUseKey);
      setSelectedItem(selectedAsset);
    },
    300,
    [type, accountId, account.balances, ReduxcategoryAssets1, ReduxcategoryAssets2],
  );

  //
  const handleTokenClick = (item: any) => {
    if (!item) return;
    setSelectedItem(item);

    const typeDispatchMap: Record<string, ((item: any) => any) | undefined> = {
      cate1: setCategoryAssets1,
      cate2: setCategoryAssets2,
    };

    const dispatchAction = typeDispatchMap[type];
    if (dispatchAction) {
      dispatch(dispatchAction(item));
    } else {
      console.warn(`Unsupported type: ${type}`);
    }

    setForceUpdate && setForceUpdate();
    setShowModal(false);
  };

  const handleMouseEnter = () => {
    clearTimeout(timer);
    setShowModal(true);
  };

  const handleMouseLeave = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      setShowModal(false);
    }, 200);
  };
  return (
    <div
      className={`relative ${type === "cate2" ? "cursor-pointer" : "cursor-default"} w-fit`}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`flex items-center justify-end ${
          type === "cate2" ? "hover:bg-gray-1250" : ""
        }  p-1.5 rounded-md `}
        onMouseEnter={handleMouseEnter}
      >
        <div className="w-6 h-6">
          {selectedItem?.token_id == nearTokenId ? (
            <NearIcon />
          ) : (
            <img
              alt=""
              src={selectedItem?.metadata?.icon}
              style={{ width: "26px", height: "26px" }}
            />
          )}
        </div>
        <div className="mx-1.5 text-base">
          {getSymbolById(selectedItem?.token_id, selectedItem?.metadata?.symbol)}
        </div>
        {type === "cate2" && <TokenThinArrow />}
      </div>

      {type === "cate2" && (
        <div onClick={sendBalance} className="text-xs flex justify-end text-gray-300">
          Balance:&nbsp;
          <span className="text-white border-b border-dark-800">{ownBalance}</span>
        </div>
      )}
      {/*  */}
      {showModal && type === "cate2" && (
        <div
          className="absolute top-10 right-0 py-1.5 bg-dark-250 border border-dark-500 rounded-md z-80 w-52"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {tokenList.map((token, index) => (
            <div
              key={index}
              className="py-2 px-3.5 hover:bg-gray-950 flex items-center w-full rounded-md"
              onClick={() => handleTokenClick(token)}
            >
              {token?.token_id == nearTokenId ? (
                <NearIcon />
              ) : (
                <img alt="" src={token?.metadata?.icon} style={{ width: "26px", height: "26px" }} />
              )}
              <p className="ml-1.5 mr-2 text-sm">
                {getSymbolById(token?.token_id, token?.metadata?.symbol)}
              </p>
              {selectedItem?.metadata?.symbol === token.metadata.symbol && <TokenSelected />}
              <p className="ml-auto text-sm">
                {toInternationalCurrencySystem_number(
                  shrinkToken(account.balances[token.metadata.token_id], token.metadata.decimals),
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TradingToken;
