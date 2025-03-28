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
export function get_amount_from_msg(msg) {
  const { actions } = JSON.parse(msg);
  if (!isEmpty(actions)) {
    const min_amount_out = actions
      .reduce((sum, action) => sum.plus(action.min_amount_out || 0), new Decimal(0))
      .toFixed();
    const expand_amount_in = actions
      .reduce((sum, action) => sum.plus(action.amount_in || 0), new Decimal(0))
      .toFixed();
    return {
      min_amount_out,
      expand_amount_in,
    };
  }
  return {
    min_amount_out: "0",
    expand_amount_in: "0",
  };
}

export function get_registered_dexes() {
  const state = store.getState();
  const dexMap = Object.entries(state?.marginConfigMEME?.registered_dexes || {}).reduce(
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

/**
 *
 * @param debt_id: d_token_id;
 * @param pos_id: p_token_id;
 */
export function checkIfMeme({ debt_id, pos_id }: { debt_id: string; pos_id: string }) {
  const state = store.getState();
  const memeTokens = state.marginConfigMEME?.registered_tokens || {};
  const [memeLevel1Ids, memeLevel2Ids] = Object.entries(memeTokens).reduce(
    (acc: string[][], [token_id, level]) => {
      if (+level == 1) {
        return [[...acc[0], token_id], acc[1]];
      } else if (+level == 2) {
        return [acc[0], [...acc[1], token_id]];
      }
      return acc;
    },
    [[], []],
  );
  if (
    (memeLevel1Ids.includes(debt_id) && memeLevel2Ids.includes(pos_id)) ||
    (memeLevel1Ids.includes(pos_id) && memeLevel2Ids.includes(debt_id))
  ) {
    return true;
  }
  return false;
}
