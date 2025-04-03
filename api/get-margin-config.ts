import { getBurrow } from "../utils";
import { ViewMethodsLogic } from "../interfaces/contract-methods";
import { IMarginConfig } from "../interfaces";

const getMarginConfig = async (): Promise<IMarginConfig> => {
  // TODOXX
  return {
    max_leverage_rate: 0,
    pending_debt_scale: 0,
    max_slippage_rate: 0,
    min_safety_buffer: 0,
    margin_debt_discount_rate: 0,
    open_position_fee_rate: 0,
    registered_dexes: {},
    registered_tokens: {},
    max_active_user_margin_position: 0,
  };
  // const { view, logicContract } = await getBurrow();
  // try {
  //   const config = (await view(
  //     logicContract,
  //     ViewMethodsLogic[ViewMethodsLogic.get_margin_config],
  //   )) as IMarginConfig;
  //   return config;
  // } catch (e) {
  //   console.error(e);
  //   throw new Error("getMarginConfig");
  // }
};
export default getMarginConfig;
