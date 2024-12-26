import { ViewMethodsDcl, ChangeMethodsDcl } from "../interfaces/index";
import { getBurrow } from "../utils";
import { IPoolDcl, IQuoteResult, IPool } from "../interfaces/pool";
import getConfig from "../utils/config";

export async function getDclPools() {
  const { view, dclContract } = await getBurrow();
  const allDclPools: IPoolDcl[] = (await view(
    dclContract,
    ViewMethodsDcl[ViewMethodsDcl.list_pools],
  )) as IPoolDcl[];

  return allDclPools;
}

export async function quote({
  pool_ids,
  input_token_id,
  output_token_id,
  input_amount,
  tag,
}: {
  pool_ids: string[];
  input_token_id: string;
  output_token_id: string;
  input_amount: string;
  tag?: string;
}) {
  const { view, dclContract } = await getBurrow();
  const quote_res = (await view(dclContract, ViewMethodsDcl[ViewMethodsDcl.quote], {
    pool_ids,
    input_token: input_token_id,
    output_token: output_token_id,
    input_amount,
    tag,
  })) as IQuoteResult;

  return quote_res;
}
export async function get_pool_list(poolType: "classic" | "stable" | "degen" | "dcl") {
  const config = getConfig();
  const limit = poolType == "classic" ? 500 : 100;
  const data = await fetch(
    `${config.indexUrl}/pool/search?type=${poolType}&sort=tvl&limit=${limit}&labels=&offset=0&hide_low_pool=false&order_by=desc`,
  )
    .then((res) => res.json())
    .catch(() => {
      return {
        data: {
          list: [],
        },
      };
    });
  return data?.data?.list || [];
}
