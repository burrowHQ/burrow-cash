import { getBurrow } from "../utils";
import { ViewMethodsLogic } from "../interfaces/contract-methods";
import { IMarginBaseTokenConfig } from "../interfaces";

const getDefaultMarginBaseTokenLimit = async (): Promise<IMarginBaseTokenConfig> => {
  // TODOXX main
  return {
    min_safety_buffer: 0,
    max_leverage_rate: 0,
    max_common_slippage_rate: 0,
    max_forceclose_slippage_rate: 0,
    liq_benefit_protocol_rate: 0,
    liq_benefit_liquidator_rate: 0,
    min_base_token_short_position: "",
    min_base_token_long_position: "",
    max_base_token_short_position: "",
    max_base_token_long_position: "",
    total_base_token_available_short: "",
    total_base_token_available_long: "",
  };
  // const { view, logicContract } = await getBurrow();
  // try {
  //   const config = (await view(
  //     logicContract,
  //     ViewMethodsLogic[ViewMethodsLogic.get_default_margin_base_token_limit],
  //   )) as IMarginBaseTokenConfig;
  //   return config;
  // } catch (e) {
  //   console.error(e);
  //   throw new Error("getDefaultMarginBaseTokenLimit");
  // }
};

export default getDefaultMarginBaseTokenLimit;
