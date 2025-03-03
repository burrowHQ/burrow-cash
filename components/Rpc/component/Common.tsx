/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/button-has-type */
/* eslint-disable react/no-unescaped-entities */
import React, { HTMLAttributes, useEffect, useState } from "react";
import Modal from "react-modal";
import {
  CircleIcon,
  AddButtonIcon,
  SelectedButtonIcon,
  SetButtonIcon,
  ReturnArrowButtonIcon,
  DeleteButtonIcon,
  BeatLoading,
  ModalClose,
} from "./svg";
import { isMobileDevice } from "../../../helpers/helpers";
import { getRpcList, trimStr, ping_gas, pingChain, getCustomConfig, switchPoint } from "../tool";
/* eslint-disable jsx-a11y/label-has-associated-control */
export const displayCurrentRpc = (responseTimeList: any, key: any, inBox?: boolean) => {
  const colorClass = responseTimeList[key] > 500 ? "text-warning" : "text-green-100";
  if (responseTimeList[key] === -1) {
    return (
      <>
        <label className="text-xs ml-1.5 mr-1 cursor-pointer text-danger whitespace-nowrap">
          time out
        </label>
        <span className="cursor-pointer text-danger">
          <CircleIcon />
        </span>
      </>
    );
  } else if (responseTimeList[key]) {
    return (
      <>
        <label className={`text-xs ${colorClass} mr-1 cursor-pointer whitespace-nowrap`}>
          {responseTimeList[key]}ms
        </label>
        <span className={`cursor-pointer ${colorClass}`}>
          <CircleIcon />
        </span>
      </>
    );
  } else {
    return (
      <label className="mr-2.5 whitespace-nowrap">
        <BeatLoading />
      </label>
    );
  }
};

const specialRpcs: string[] = ["https://near-mainnet.infura.io/v3", "https://gynn.io"];
export const ModalAddCustomNetWork = (props: any) => {
  const { rpclist, currentEndPoint, responseTimeList, onRequestClose, isOpen } = props;
  const [customLoading, setCustomLoading] = useState(false);
  const [customRpcName, setCustomRpcName] = useState("");
  const [customRpUrl, setCustomRpUrl] = useState("");
  const [customShow, setCustomShow] = useState(false);
  const [unavailableError, setUnavailableError] = useState(false);
  const [testnetError, setTestnetError] = useState(false);
  const [notSupportTestnetError, setNotSupportTestnetError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [isInEditStatus, setIsInEditStatus] = useState(false);
  const cardWidth = isMobileDevice() ? "90vw" : "400px";
  const cardHeight = isMobileDevice() ? "40vh" : "400px";
  useEffect(() => {
    hideCustomNetWork();
  }, [isOpen]);
  async function addCustomNetWork() {
    setCustomLoading(true);
    const rpcMap = getRpcList();
    // check if has same url and same name
    // eslint-disable-next-line array-callback-return, consistent-return
    const fondItem = Object.values(rpcMap).find((item) => {
      if (trimStr(item["simpleName"]) === trimStr(customRpcName)) {
        return true;
      }
    });
    if (fondItem) {
      setNameError(true);
      setCustomLoading(false);
      return;
    }
    // check network
    let responseTime;
    // special check
    if (checkContain(customRpUrl)) {
      const { status, responseTime: responseTime_gas } = await ping_gas(customRpUrl);
      if (!status) {
        setUnavailableError(true);
        setCustomLoading(false);
        return;
      }
      responseTime = responseTime_gas;
    } else {
      // common check
      const { status, responseTime: responseTime_status, chain_id } = await pingChain(customRpUrl);
      responseTime = responseTime_status;
      if (!status) {
        setUnavailableError(true);
        setCustomLoading(false);
        return;
      }
      if (status && chain_id === "testnet") {
        setTestnetError(true);
        setCustomLoading(false);
        return;
      }
    }
    // do not support testnet
    const env = process.env.NEXT_PUBLIC_DEFAULT_NETWORK;
    if (env === "testnet") {
      setNotSupportTestnetError(true);
      setCustomLoading(false);
      return;
    }
    const customRpcMap = getCustomConfig();
    const key = `custom${Object.keys(customRpcMap).length}${1}`;
    customRpcMap[key] = {
      url: customRpUrl,
      simpleName: trimStr(customRpcName),
      custom: true,
    };

    localStorage.setItem("customRpcList", JSON.stringify(customRpcMap));
    setCustomLoading(false);
    // eslint-disable-next-line react/destructuring-assignment
    props.updateResponseTimeList({
      key,
      responseTime,
    });
    setCustomShow(false);
  }
  function checkContain(url: string) {
    // eslint-disable-next-line array-callback-return, consistent-return
    const res = specialRpcs.find((rpc: string) => {
      if (url.indexOf(rpc) > -1) return true;
    });
    return !!res;
  }
  function changeNetName(v: string) {
    setNameError(false);
    setCustomRpcName(v);
  }
  function changeNetUrl(v: string) {
    setUnavailableError(false);
    setTestnetError(false);
    setCustomRpUrl(v);
  }
  function showCustomNetWork() {
    setCustomShow(true);
    initData();
  }
  function hideCustomNetWork() {
    setCustomShow(false);
    initData();
  }
  function closeModal() {
    setCustomShow(false);
    initData();
    onRequestClose();
  }
  function switchEditStatus() {
    setIsInEditStatus(!isInEditStatus);
  }
  function deleteCustomNetwork(key: string) {
    const customMap = getCustomConfig();
    delete customMap[key];
    localStorage.setItem("customRpcList", JSON.stringify(customMap));
    if (key === currentEndPoint) {
      window.location.reload();
    } else {
      // eslint-disable-next-line react/destructuring-assignment
      props.updateResponseTimeList({
        key,
        isDelete: true,
      });
      if (Object.keys(customMap).length === 0) {
        setIsInEditStatus(false);
      }
    }
  }
  function initData() {
    setCustomRpcName("");
    setCustomRpUrl("");
    setTestnetError(false);
    setNameError(false);
    setUnavailableError(false);
    setIsInEditStatus(false);
    setNotSupportTestnetError(false);
  }
  const submitStatus =
    trimStr(customRpcName) &&
    trimStr(customRpUrl) &&
    !unavailableError &&
    !nameError &&
    !testnetError;
  return (
    <Modal {...props}>
      <div className="relative flex items-center justify-center">
        <div
          className="absolute top-0 bottom-0"
          style={{
            width: cardWidth,
          }}
        />
        <div
          className="relative z-10 px-4 py-7 text-white bg-dark-100 border border-dark-300 border-opacity-50 rounded-lg"
          style={{
            width: cardWidth,
          }}
        >
          {customShow ? (
            <div>
              <div className="flex items-center justify-between text-xl text-white">
                <div className="flex items-center">
                  <ReturnArrowButtonIcon
                    className="mr-3 cursor-pointer"
                    onClick={hideCustomNetWork}
                  />
                  Add Custom Network
                </div>
                <span onClick={closeModal} className="cursor-pointer">
                  <ModalClose />
                </span>
              </div>
              <div className="flex flex-col  mt-10">
                <span className="text-white text-sm mb-2.5">Network Name</span>
                <div
                  className={`overflow-hidden rounded-md ${
                    nameError ? "border border-danger" : ""
                  }`}
                >
                  <input
                    className="px-3 h-12 bg-black bg-opacity-20"
                    onChange={({ target }) => changeNetName(target.value)}
                  />
                </div>
                <span className={`errorTip text-danger text-sm mt-2 ${nameError ? "" : "hidden"}`}>
                  The network name was already taken
                </span>
              </div>
              <div className="flex flex-col mt-10">
                <span className="text-white text-sm mb-2.5">RPC URL</span>
                <div
                  className={`overflow-hidden rounded-md ${
                    unavailableError ? "border border-danger" : ""
                  }`}
                >
                  <input
                    className="px-3 h-12 rounded-md bg-black bg-opacity-20 outline-none"
                    onChange={({ target }) => changeNetUrl(target.value)}
                  />
                </div>
                <span
                  className={`errorTip text-danger text-sm mt-2 ${
                    unavailableError ? "" : "hidden"
                  }`}
                >
                  The network was invalid
                </span>
                <span
                  className={`errorTip text-danger text-sm mt-2 ${testnetError ? "" : "hidden"}`}
                >
                  RPC server's network (testnet) is different with this network(mainnet)
                </span>
                <span
                  className={`errorTip text-danger text-sm mt-2 ${
                    notSupportTestnetError ? "" : "hidden"
                  }`}
                >
                  Testnet does not support adding custom RPC
                </span>
              </div>
              <GradientButton
                color="#fff"
                className={`w-full h-10 text-center text-base text-black mt-10 focus:outline-none font-semibold ${
                  submitStatus ? "" : "opacity-40"
                }`}
                onClick={addCustomNetWork}
                disabled={!submitStatus}
                btnClassName={submitStatus ? "" : "cursor-not-allowed"}
                loading={customLoading}
              >
                <div className={`text-black   ${isInEditStatus ? "hidden" : ""}`}>
                  <ButtonTextWrapper
                    loading={customLoading}
                    // eslint-disable-next-line react/no-unstable-nested-components
                    Text={() => {
                      return <>Add</>;
                    }}
                  />
                </div>
              </GradientButton>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between text-xl text-white mb-5">
                RPC Selector
                <span onClick={closeModal} className="cursor-pointer">
                  <ModalClose />
                </span>
              </div>
              <div className="text-dark-800 text-sm mb-4">
                Select the available RPC service below and the page will be automatically refreshed
              </div>
              <div style={{ maxHeight: cardHeight }} className="overflow-y-auto overflow-x-hidden">
                {Object.entries(rpclist).map(([key, data]: any, index: number) => {
                  return (
                    <div className="flex items-center" key={data.simpleName}>
                      <div
                        className={`relative flex items-center rounded-lg h-14 px-5 ${
                          isInEditStatus && data.custom ? "w-4/5" : "w-full"
                        } ${index !== Object.entries(rpclist).length - 1 ? "mb-3" : ""} ${
                          isInEditStatus ? "" : "cursor-pointer"
                        } ${
                          isInEditStatus && !data.custom ? "" : "bg-gray-500 hover:bg-opacity-50"
                        } justify-between text-white`}
                        onClick={() => {
                          if (!isInEditStatus) {
                            switchPoint(key);
                          }
                        }}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            className="radio-custom w-4 h-4 mr-2"
                            checked={currentEndPoint === key && !isInEditStatus}
                            onChange={() => {
                              if (!isInEditStatus) {
                                switchPoint(key);
                              }
                            }}
                            disabled={isInEditStatus}
                          />
                          <label className="text-sm pr-5 whitespace-nowrap overflow-hidden overflow-ellipsis">
                            {data.simpleName}
                          </label>
                        </div>
                        <div className="flex items-center text-sm">
                          {displayCurrentRpc(responseTimeList, key, true)}
                        </div>
                        {/* {currentEndPoint === key && !isInEditStatus ? (
                          <SelectedButtonIcon className="absolute -right-1 -top-1" />
                        ) : null} */}
                      </div>
                      {isInEditStatus && data.custom ? (
                        <div>
                          <DeleteButtonIcon
                            className="cursor-pointer ml-4"
                            onClick={() => {
                              deleteCustomNetwork(key);
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div
                className={`flex items-center mt-6  ${
                  isInEditStatus ? "justify-end" : "justify-between"
                }`}
              >
                <GradientButton
                  color="#fff"
                  className={`h-10 px-4 text-center text-base text-black focus:outline-none font-semibold ${
                    isInEditStatus ? "hidden" : ""
                  }`}
                  onClick={showCustomNetWork}
                >
                  <div className="flex items-center text-black">
                    <AddButtonIcon className="mr-1" />
                    Add
                  </div>
                </GradientButton>
                {Object.keys(rpclist).length > 2 ? (
                  <div className="flex items-center">
                    {isInEditStatus ? (
                      <span
                        className="text-sm text-white cursor-pointer mr-2"
                        onClick={switchEditStatus}
                      >
                        Finish
                      </span>
                    ) : null}
                    <SetButtonIcon
                      className="cursor-pointer text-primaryText hover:text-white"
                      onClick={switchEditStatus}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
export function GradientButton(
  props: HTMLAttributes<HTMLButtonElement> & {
    disabled?: boolean;
    // eslint-disable-next-line react/no-unused-prop-types
    padding?: string;
    className?: string;
    color?: string;
    btnClassName?: string;
    loading?: boolean;
    backgroundImage?: string;
    minWidth?: string;
    borderRadius?: string;
  },
) {
  const {
    loading,
    disabled,
    className,
    color,
    btnClassName,
    backgroundImage,
    minWidth,
    borderRadius,
    onClick,
  } = props;
  return (
    <div
      className={`${className || ""} ${loading ? "opacity-40" : ""} bg-primary`}
      style={{
        borderRadius: borderRadius || "8px",
        color: color || "",
        backgroundImage: backgroundImage || "",
        minWidth: minWidth || "",
      }}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full h-full ${btnClassName || ""}`}
      >
        {props.children}
      </button>
    </div>
  );
}

export function ButtonTextWrapper({
  Text,
  loading,
  loadingColor,
}: {
  Text: () => JSX.Element;
  loading: boolean;
  loadingColor?: string;
}) {
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{loading ? <BeatLoading color={loadingColor} /> : <Text />}</>;
}
