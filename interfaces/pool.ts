import { IMetadata } from "./asset";

export interface IPoolDcl {
  pool_id: string;
  token_x?: string;
  token_y?: string;
  fee: number;
  point_delta: number;
  current_point: number;
  state?: string; // running or paused
  total_liquidity?: string;
  liquidity?: string;
  liquidity_x?: string;
  max_liquidity_per_point?: string;
  percent?: string;
  total_x?: string;
  total_y?: string;
  tvl?: number;
  token_x_metadata?: IMetadata;
  token_y_metadata?: IMetadata;
  total_fee_x_charged?: string;
  total_fee_y_charged?: string;
  top_bin_apr?: string;
  top_bin_apr_display?: string;
  tvlUnreal?: boolean;
  update_time?: number;
}

export interface IPool {
  amounts: string[];
  amp: number;
  apy: string;
  c_amounts: string[];
  degens: string[];
  farm_apy: string;
  farm_is_multi_currency: boolean;
  fee_volume_24h: string;
  id: string;
  is_farm: boolean;
  is_meme: boolean;
  is_new: boolean;
  pool_kind: string;
  rates: string[];
  shares_total_supply: string;
  token_account_ids: string[];
  token_symbols: string[];
  top: boolean;
  total_fee: string;
  tvl: string;
  volume_24h: string;
}

export interface IPoolTop {
  amounts: string[];
  amp: number;
  farming: boolean;
  id: string;
  pool_kind: "SIMPLE_POOL" | "DEGEN_SWAP" | "RATED_SWAP" | "STABLE_SWAP";
  shares_total_supply: string;
  token0_ref_price: string;
  token_account_ids: string[];
  token_symbols: string[];
  total_fee: number;
  tvl: string;
  update_time: number;
}

export interface IQuoteResult {
  amount: string;
  tag: string;
}
