import { TokenAction } from "../../redux/appSlice";

export const getRepayTemplate = (tokenId, position) => {
  const action: TokenAction = "Repay";
  return { action, tokenId, amount: "0", position };
};
export const getBorrowTemplate = (tokenId, position) => {
  const action: TokenAction = "Borrow";
  return { action, tokenId, amount: "0", position };
};
