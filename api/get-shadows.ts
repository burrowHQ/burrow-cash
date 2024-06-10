import { ViewMethodsREFV1, IShadowRecordInfo } from "../interfaces";
import { getBurrow } from "../utils";
import { getAccount as getAccountWallet } from "../utils/wallet-selector-compat";

const getShadowRecords = async (): Promise<IShadowRecordInfo> => {
  const account = await getAccountWallet();
  const { accountId } = account;
  const { view, refv1Contract } = await getBurrow();
  const res = (await view(refv1Contract, ViewMethodsREFV1[ViewMethodsREFV1.get_shadow_records], {
    account_id: accountId,
  })) as IShadowRecordInfo;
  return res;
};
export default getShadowRecords;
