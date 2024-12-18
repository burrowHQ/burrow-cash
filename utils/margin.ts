import { isEmpty } from "lodash";
import Decimal from "decimal.js";
import { deepCopy } from "./commonUtils";
import { store } from "../redux/store";

export function getMetadatas(tokenAssets) {
  return tokenAssets.map((asset) => {
    const tokenData = deepCopy(asset) as any;
    const { metadata } = tokenData;
    metadata.id = metadata.token_id;
    return metadata;
  });
}
export function get_swap_indication_info(swapTransaction, registered_dexes) {
  const msg = swapTransaction?.functionCalls?.[0]?.args?.msg || "{}";
  const msgObj = JSON.parse(msg);
  let dex = "";
  const dexMap = Object.entries(registered_dexes).reduce((acc, cur: any) => {
    return {
      ...acc,
      [cur[1]]: cur[0],
    };
  }, {});
  if (!isEmpty(msgObj.Swap)) {
    msgObj.Swap.skip_unwrap_near = true;
    dex = dexMap["2"];
  } else {
    dex = dexMap["1"];
  }
  return [dex, JSON.stringify(msgObj)];
}
export function get_min_amount_out(msg) {
  const { actions, Swap } = JSON.parse(msg);
  if (!isEmpty(actions)) {
    return actions
      .reduce((sum, action) => sum.plus(action.min_amount_out), new Decimal(0))
      .toFixed();
  }
  if (!isEmpty(Swap)) {
    return Swap.min_output_amount;
  }
  return "0";
}

export function get_registered_dexes() {
  const state = store.getState();
  const dexMap = Object.entries(state?.marginConfig?.registered_dexes || {}).reduce(
    (acc, cur: any) => {
      return {
        ...acc,
        [cur[1]]: cur[0],
      };
    },
    {},
  );
  return dexMap;
}
