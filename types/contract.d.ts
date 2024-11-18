declare type NetworkId = "mainnet" | "testnet";
declare type Chain = "near" | "solana" | "ethereum";

declare type TokenMetadata = {
  name: string;
  symbol: string;
  decimals: number;
  icon: string;
};

declare namespace Token {
  interface TokenMeta {
    symbol: string;
    decimals: number;
    SolanaDecimals?: number;
    amountDecimals?: number;
    icon: string;
    addresses?: Partial<Record<Chain, Partial<Record<NetworkId, string>>>>;
    priceDecimals?: number;
  }
}

declare namespace NFT {
  interface NFTMetadata {
    token_id: string;
    metadata: { media?: string; level: number };
  }
}
