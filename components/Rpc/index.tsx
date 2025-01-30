/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useEffect, useState } from "react";
import { getRpcList, ping } from "./tool";
import { isMobileDevice } from "../../helpers/helpers";
import { displayCurrentRpc, ModalAddCustomNetWork } from "./component/Common";

const RpcList = () => {
  const rpclist = getRpcList();
  const [hover, setHover] = useState(false);
  const [hoverSet, setHoverSet] = useState(false);
  const [responseTimeList, setResponseTimeList] = useState({});
  const [modalCustomVisible, setModalCustomVisible] = useState(false);
  let currentEndPoint = localStorage.getItem("endPoint") || "defaultRpc";
  if (!rpclist[currentEndPoint]) {
    currentEndPoint = "defaultRpc";
    localStorage.removeItem("endPoint");
  }
  useEffect(() => {
    // response time for each rpc
    Object.entries(rpclist).forEach(([key, data]) => {
      ping(data.url, key).then((time) => {
        responseTimeList[key] = time;
        setResponseTimeList({ ...responseTimeList });
      });
    });
  }, []);
  function updateResponseTimeList(data: any) {
    const { key, responseTime, isDelete } = data;
    if (isDelete) {
      // delete
      delete responseTimeList[key];
      // eslint-disable-next-line prefer-object-spread
      setResponseTimeList(Object.assign({}, responseTimeList));
    } else {
      // add
      responseTimeList[key] = responseTime;
      // eslint-disable-next-line prefer-object-spread
      setResponseTimeList(Object.assign({}, responseTimeList));
    }
  }
  function addCustomNetwork() {
    setModalCustomVisible(true);
  }
  const minWidth = "180px";
  const maxWidth = "230px";
  const mobile = isMobileDevice();
  return (
    <>
      {mobile ? (
        <div
          style={{
            zIndex: 999999,
            boxShadow: "0px 0px 10px 10px rgba(0, 0, 0, 0.15)",
          }}
          className="fixed bottom-0 right-1 w-min h-8 bg-dark-200 border border-dark-1050 rounded-tl-md rounded-tr-md mt-3"
        >
          <div className="flex items-center w-min h-full justify-end" onClick={addCustomNetwork}>
            <div className="flex items-center justify-between w-full flex-grow py-1 px-3">
              {/* <div className="flex items-center w-3/4">
                <label className="text-xs text-primaryText mr-5">RPC</label>
                <label className="text-xs text-primaryText cursor-pointer pr-5 whitespace-nowrap overflow-hidden overflow-ellipsis">
                  {rpclist[currentEndPoint].simpleName}
                </label>
              </div> */}
              <div className="flex items-center">
                {displayCurrentRpc(responseTimeList, currentEndPoint)}
                {/* <FiChevronDown className="text-primaryText transform rotate-180 cursor-pointer" /> */}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ zIndex: 99998 }} className="flex items-end fixed right-8 bottom-0">
          <div
            onMouseEnter={() => {
              setHover(true);
            }}
            onMouseLeave={() => {
              setHover(false);
            }}
            className="relative"
          >
            {/* selected rpc */}
            <div className="pt-3">
              <div
                className="flex items-center justify-between px-2 rounded cursor-pointer"
                style={{
                  minWidth,
                  maxWidth,
                  height: "25px",
                }}
              >
                <div className="flex items-center w-2/3">
                  <label className="text-xs w-full text-primaryText cursor-pointer pr-3 whitespace-nowrap overflow-hidden overflow-ellipsis">
                    {/* {rpclist[currentEndPoint].simpleName} */}
                  </label>
                </div>
                <div
                  className="flex items-center"
                  onMouseEnter={() => {
                    setHoverSet(true);
                  }}
                  onMouseLeave={() => {
                    setHoverSet(false);
                  }}
                  onClick={addCustomNetwork}
                >
                  {displayCurrentRpc(responseTimeList, currentEndPoint)}
                  {/* <FiChevronDown
                    className={`text-primaryText transform rotate-180 cursor-pointer ${
                      hover ? "text-greenColor" : ""
                    }`}
                  /> */}
                </div>
              </div>
            </div>
            {/* hover rpc list */}
            {/* <div
              className={`absolute py-2 bottom-8 flex flex-col w-full bg-gray-800 rounded ${
                hover ? "" : "hidden"
              }`}
              style={{ boxShadow: "0px 0px 10px 10px rgba(0, 0, 0, 0.15)" }}
            >
              {Object.entries(rpclist).map(([key, data]) => {
                return (
                  <div
                    key={key}
                    className={`flex items-center px-2 py-1 justify-between text-primaryText hover:bg-dark-100  hover:text-white ${
                      currentEndPoint === key ? "bg-dark-100" : ""
                    }`}
                    style={{ minWidth, maxWidth }}
                    onClick={() => {
                      switchPoint(key);
                    }}
                  >
                    <label
                      className={`text-xs pr-5 whitespace-nowrap overflow-hidden overflow-ellipsis ${
                        responseTimeList[key] && responseTimeList[key] !== -1
                          ? "cursor-pointer"
                          : "cursor-pointer"
                      }`}
                    >
                      {data.simpleName}
                    </label>
                    <div className="flex items-center">
                      {displayCurrentRpc(responseTimeList, key)}
                    </div>
                  </div>
                );
              })}
            </div> */}
          </div>
          {/* add custom rpc button */}
          {/* <div
            onMouseEnter={() => {
              setHoverSet(true);
            }}
            onMouseLeave={() => {
              setHoverSet(false);
            }}
            onClick={addCustomNetwork}
            style={{ height: "25px" }}
            className="flex items-center bg-gray-800 hover:bg-dark-100 rounded  cursor-pointer ml-0.5 px-2 "
          >
            <MoreButtonIcon className={`text-primaryText ${hoverSet ? "text-greenColor" : ""}`} />
          </div> */}
        </div>
      )}
      <ModalAddCustomNetWork
        isOpen={modalCustomVisible}
        onRequestClose={() => {
          setModalCustomVisible(false);
        }}
        updateResponseTimeList={updateResponseTimeList}
        currentEndPoint={currentEndPoint}
        responseTimeList={responseTimeList}
        rpclist={rpclist}
        style={{
          overlay: {
            zIndex: "999999",
          },
          content: {
            outline: "none",
            transform: "translate(-50%, -50%)",
          },
        }}
      />
    </>
  );
};

export default RpcList;
