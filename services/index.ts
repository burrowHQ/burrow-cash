export { default as request } from "../utils/request";

export interface WrapperResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export type PaginationResponse<T> = WrapperResponse<
  { list?: T[]; has_next_page: boolean } | undefined
>;

export const botInnerApiPrefix = (url: string, chain?: Chain) => {
  const host =
    chain === "solana" ? process.env.NEXT_PUBLIC_SOLANA_API_HOST : process.env.NEXT_PUBLIC_API_HOST;
  return `${host}/api${url}`;
};
