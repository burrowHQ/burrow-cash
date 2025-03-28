import { getBurrow } from "../utils";

export const getAccount = async () => {
  const { account } = await getBurrow();
  return account;
};
