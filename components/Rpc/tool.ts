import { getExtendConfig } from "../../utils/rpcConfig";

const MAXELOADTIMES = 3;
export const getRpcList = () => {
  const RPCLIST_system = getExtendConfig().RPC_LIST;
  const RPCLIST_custom = getCustomConfig();
  const RPCLIST = Object.assign(RPCLIST_system, RPCLIST_custom);
  return RPCLIST;
};
export function getSelectedRpc() {
  const RPC_LIST = getRpcList();
  let endPoint = "defaultRpc";
  try {
    endPoint = window.localStorage.getItem("endPoint") || endPoint;
    if (!RPC_LIST[endPoint]) {
      endPoint = "defaultRpc";
      localStorage.removeItem("endPoint");
    }
  } catch (error) {}
  const urlList = Object.values(RPC_LIST).map((rpc) => rpc.url);
  const selectedUrl = RPC_LIST[endPoint].url;
  urlList.sort((a, b) => {
    if (a == selectedUrl) return -1;
    if (b == selectedUrl) return 1;
    return 0;
  });
  return {
    selectedRpc: selectedUrl,
    rpcListSorted: urlList,
  };
}
export function getCustomConfig() {
  let customRpcMapStr;
  try {
    customRpcMapStr = window.localStorage.getItem("customRpcList");
  } catch (error) {}

  let customRpcMap = {};
  if (customRpcMapStr) {
    try {
      customRpcMap = JSON.parse(customRpcMapStr);
    } catch (error) {}
  }
  return customRpcMap;
}
export async function ping(url: string, key: string) {
  const RPCLIST = getRpcList();
  const start = new Date().getTime();
  const businessRequest = fetch(url, {
    method: "POST",
    headers: { "Content-type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "dontcare",
      method: "gas_price",
      params: [null],
    }),
  });
  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      // eslint-disable-next-line prefer-promise-reject-errors
      reject(-1);
    }, 8000);
  });
  const responseTime = await Promise.race([businessRequest, timeoutPromise])
    .then(() => {
      const end = new Date().getTime();
      return end - start;
    })
    .catch((result) => {
      if (result === -1) {
        // timeout
        return -1;
      } else {
        // other exception
        const currentRpc = localStorage.getItem("endPoint") || "defaultRpc";
        if (currentRpc !== key) {
          return -1;
        } else {
          // eslint-disable-next-line array-callback-return, consistent-return
          const availableRpc = Object.keys(RPCLIST).find((item) => {
            if (item !== key) return item;
          }) as string;
          let reloadedTimes = Number(localStorage.getItem("rpc_reload_number") || 0);
          setTimeout(() => {
            reloadedTimes += 1;
            if (reloadedTimes > MAXELOADTIMES) {
              localStorage.setItem("endPoint", "defaultRpc");
              localStorage.setItem("rpc_reload_number", "");
              return -1;
            } else {
              localStorage.setItem("endPoint", availableRpc);
              window.location.reload();
              localStorage.setItem("rpc_reload_number", reloadedTimes.toString());
              return -1;
            }
          }, 1000);
        }
      }
      return -1;
    });
  return responseTime;
}
export async function ping_gas(url: string) {
  const start = new Date().getTime();
  let responseTime = 0;
  const businessRequest = fetch(url, {
    method: "POST",
    headers: { "Content-type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "dontcare",
      method: "gas_price",
      params: [null],
    }),
  });
  let r;
  try {
    r = await businessRequest;
    if (r?.status === 200) {
      r = true;
    } else {
      r = false;
    }
  } catch (error) {
    r = false;
  }
  const end = new Date().getTime();
  responseTime = end - start;
  return {
    status: !!r,
    responseTime,
  };
}
export async function pingChain(url: string) {
  const start = new Date().getTime();
  let status;
  let responseTime;
  let chain_id;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-type": "application/json; charset=UTF-8" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "dontcare",
        method: "status",
        params: [],
      }),
    })
      // eslint-disable-next-line @typescript-eslint/no-shadow
      .then((res) => {
        return res.json();
      })
      .catch(() => {
        return {};
      });
    if (res?.result?.chain_id) {
      const end = new Date().getTime();
      responseTime = end - start;
      status = true;
      chain_id = res.result.chain_id;
    }
  } catch {
    status = false;
  }
  return {
    status,
    responseTime,
    chain_id,
  };
}
export const switchPoint = (chooseEndPoint: string) => {
  localStorage.setItem("endPoint", chooseEndPoint);
  window.location.reload();
};
export function trimStr(str = "") {
  return str.replace(/(^\s*)|(\s*$)/g, "");
}
