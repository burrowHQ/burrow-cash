import Decimal from "decimal.js";
import { useAppSelector } from "../redux/hooks";
import { getAssetsCategory } from "../redux/assetsSelectors";
import { getMarginConfigCategory } from "../redux/marginConfigSelectors";
import { IMarginAsset } from "../interfaces/account";
import { shrinkToken } from "../store";
import { IPositionType } from "../interfaces/margin";

export function useLiqPrice({
  token_c_info,
  token_d_info,
  token_p_info,
  position_type,
  uahpi_at_open,
  memeCategory,
  debt_cap,
}: {
  token_c_info: IMarginAsset;
  token_d_info: IMarginAsset;
  token_p_info: IMarginAsset;
  position_type: IPositionType;
  uahpi_at_open?: string;
  memeCategory?: boolean;
  debt_cap?: string;
}) {
  const assets = useAppSelector(getAssetsCategory(memeCategory));
  const marginConfig = useAppSelector(getMarginConfigCategory(memeCategory));
  const safety_buffer = 1 - marginConfig.min_safety_buffer / 10000;
  const token_c_asset = assets.data[token_c_info.token_id];
  const token_p_asset = assets.data[token_p_info.token_id];
  const token_d_asset = assets.data[token_d_info.token_id];
  if (!token_c_asset || !token_p_asset || !token_d_asset) return "0";
  const token_c_amount = shrinkToken(
    token_c_info.balance,
    token_c_asset.metadata.decimals + token_c_asset.config.extra_decimals,
  );
  const token_p_amount = shrinkToken(
    token_p_info.balance,
    token_p_asset.metadata.decimals + token_p_asset.config.extra_decimals,
  );
  const token_d_amount = shrinkToken(
    token_d_info.balance,
    token_d_asset.metadata.decimals + token_d_asset.config.extra_decimals,
  );
  const token_c_price = token_c_asset?.price?.usd || 0;
  const token_p_price = token_p_asset?.price?.usd || 0;
  const token_d_price = token_d_asset?.price?.usd || 0;
  const hp_fee_decimals = get_hp_fee({
    debt_cap,
    uahpi: token_d_asset.uahpi,
    uahpi_at_open,
  });
  const hp_fee = new Decimal(token_d_price).mul(
    shrinkToken(
      hp_fee_decimals,
      token_d_asset.metadata.decimals + token_d_asset.config.extra_decimals,
    ),
  );
  if (position_type == "Long") {
    const p_liq_price = new Decimal(token_d_amount || 0)
      .mul(token_d_price)
      .plus(hp_fee)
      .div(safety_buffer)
      .minus(new Decimal(token_c_amount || 0).mul(token_c_price))
      .div(token_p_amount)
      .toFixed();
    return p_liq_price;
  } else {
    // Short
    const d_liq_price = new Decimal(token_c_amount)
      .mul(token_c_price)
      .plus(new Decimal(token_p_amount).mul(token_p_price))
      .mul(safety_buffer)
      .minus(hp_fee)
      .div(token_d_amount)
      .toFixed();
    return d_liq_price;
  }
}

function get_hp_fee({
  debt_cap,
  uahpi,
  uahpi_at_open,
}: {
  debt_cap?: string;
  uahpi?: string;
  uahpi_at_open?: string;
}) {
  const hp_amount = shrinkToken(
    new Decimal(debt_cap || 0).mul(new Decimal(uahpi || 0).minus(uahpi_at_open || 0)).toFixed(0),
    18,
  );
  return hp_amount;
}
