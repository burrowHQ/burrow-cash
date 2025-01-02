import { IEstimateResult } from "../../../interfaces";
import { IAssetDetailed, IMetadata } from "../../../interfaces/asset";
import { TokenInfo } from "../../../hooks/useMarginAccount";

interface IAssetDetailedWithMetadata extends IAssetDetailed {
  metadata: IMetadata;
  uahpi: number | string;
}

export interface IConfirmMobileProps {
  open: boolean;
  onClose: () => void;
  action: string;
  confirmInfo: {
    longInput: number | string;
    longOutput: number | string;
    longInputUsd: number | string;
    longOutputUsd: number | string;
    longInputName: {
      token_id: string;
      metadata: { symbol: string };
      config: { extra_decimals: number };
    };
    longOutputName: {
      token_id: string;
      metadata: { symbol: string };
      config: { extra_decimals: number };
    };
    estimateData: IEstimateResult;
    assets: any;
    rangeMount: number;
    LiqPrice: number;
    tokenInAmount: number;
  };
}

export interface IExtraProps {
  itemKey: string;
  index: number;
  item: any;
  getAssetById: (id: string, tokenInfo?: TokenInfo) => IAssetDetailedWithMetadata;
  getPositionType: (id: string) => { label: string };
  getAssetDetails: (asset: any) => { price: number; symbol: string; decimals: number };
  parseTokenValue: (value: string, decimals: number) => number;
  calculateLeverage: (
    leverageD: number,
    priceD: number,
    leverageC: number,
    priceC: number,
  ) => number;
  LiqPrice: number;
  entryPrice: number | "-";
  pnl: number;
}

export interface IClosePositionMobileProps {
  open: boolean;
  onClose: (e?: any) => void;
  extraProps: IExtraProps;
}

export interface ChangeCollateralMobileProps {
  open: boolean;
  onClose: (e?: any) => void;
  rowData: {
    pos_id: string;
    data: any;
    marginConfigTokens: any;
    entryPrice: number | null;
  };
}
