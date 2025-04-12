import BN from "bn.js";
import { getBurrow, nearTokenId } from "../../utils";
import { registerAccountOnTokenWithQuery } from "../helper";
import { ChangeMethodsLogic } from "../../interfaces";
import { prepareAndExecuteTransactions } from "../tokens";
import { ChangeMethodsNearToken } from "../../interfaces/contract-methods";
import { Transaction } from "../wallet";
import { store } from "../../redux/store";

interface Props {
  rewards: any[];
  isMeme: boolean;
  changeClaimStatus: any;
}
export async function claimAll({ rewards, isMeme, changeClaimStatus }: Props) {
  const state = store.getState();
  const { logicContract, logicMEMEContract } = await getBurrow();
  const account = state.account;
  let logicContractId: string;
  // data category process
  if (isMeme) {
    logicContractId = logicMEMEContract.contractId;
  } else {
    logicContractId = logicContract.contractId;
  }
  if (!account) return;
  const transactions: Transaction[] = [];
  // token register
  for (const reward of rewards) {
    const registerToken = await registerAccountOnTokenWithQuery(account.accountId, reward.tokenId);
    if (registerToken) {
      transactions.push(registerToken);
    }
  }
  // token claim all
  transactions.push({
    receiverId: logicContractId,
    functionCalls: [
      {
        methodName: ChangeMethodsLogic[ChangeMethodsLogic.account_farm_claim_all],
        args: {},
        attachedDeposit: new BN("0"),
      },
    ],
  });
  // token withdraw
  rewards.forEach((reward) => {
    const withdrawAction = {
      Withdraw: {
        token_id: reward.tokenId,
        max_amount: reward?.data?.unclaimedAmountExtend || "0",
      },
    };
    transactions.push({
      receiverId: logicContractId,
      functionCalls: [
        {
          methodName: ChangeMethodsLogic[ChangeMethodsLogic.execute],
          args: {
            actions: [withdrawAction],
          },
        },
      ],
    });
  });
  // near withdraw
  const nearReward = rewards.find((reward) => reward.tokenId == nearTokenId);
  if (nearReward) {
    transactions.push({
      receiverId: nearReward.tokenId,
      functionCalls: [
        {
          methodName: ChangeMethodsNearToken[ChangeMethodsNearToken.near_withdraw],
          args: {
            amount: nearReward?.data?.unclaimedAmountExtend || "0",
          },
        },
      ],
    });
  }
  await prepareAndExecuteTransactions(transactions, isMeme).catch(() => ({}));
  changeClaimStatus && changeClaimStatus(undefined);
}
