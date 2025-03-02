import { getBurrow } from "../utils";
import { ViewMethodsLogic } from "../interfaces/contract-methods";
import { IMarginConfig } from "../interfaces";

const getMarginConfig = async (): Promise<IMarginConfig> => {
  return {
    max_leverage_rate: 5,
    pending_debt_scale: 1000,
    max_slippage_rate: 1000,
    min_safety_buffer: 1000,
    margin_debt_discount_rate: 9999,
    open_position_fee_rate: 0,
    registered_dexes: {},
    registered_tokens: {},
    max_active_user_margin_position: 64,
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
