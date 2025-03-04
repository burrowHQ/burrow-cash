import { useRouter } from "next/router";
import {
  useAdjustTrigger,
  useRepayTrigger,
  useWithdrawTrigger,
} from "../../components/Modal/components";
import CustomButton from "../../components/CustomButton/CustomButton";
import { ArrowUpIcon } from "../../components/Icons/Icons";
import { isMemeCategory } from "../../redux/categorySelectors";
import { useAppSelector } from "../../redux/hooks";
import { useAccountId } from "../../hooks/hooks";

export const MarketButton = ({
  tokenId,
  style = {},
}: {
  tokenId: string | null | undefined;
  style?: object;
}) => {
  const router = useRouter();
  const isMeme = useAppSelector(isMemeCategory);
  const handleMarketClick = () => {
    window.open(`/tokenDetail/${tokenId}?pageType=${isMeme ? "meme" : "main"}`);
    // router.push(`/tokenDetail/${tokenId}`);
  };
  return (
    <CustomButton color="secondary" onClick={handleMarketClick} style={{ minHeight: 0, ...style }}>
      <div className="flex items-center gap-2">
        Market info <ArrowUpIcon />
      </div>
    </CustomButton>
  );
};

export const WithdrawButton = ({ tokenId }) => {
  const handleWithdrawClick = useWithdrawTrigger(tokenId);
  const accountId = useAccountId();
  return (
    <CustomButton
      className="flex-1 flex items-center justify-center cursor-pointer border border-primary border-opacity-60 rounded-md text-base md:text-sm  text-primary bg-primary hover:opacity-80 bg-opacity-5 py-1"
      onClick={handleWithdrawClick}
    >
      Withdraw
    </CustomButton>
  );
};

export const AdjustButton = ({
  tokenId,
  memeCategory,
}: {
  tokenId: string;
  memeCategory?: boolean;
}) => {
  const handleAdjustClick = useAdjustTrigger(tokenId, memeCategory);
  return (
    <CustomButton className="flex-1 text-base md:text-sm" onClick={handleAdjustClick}>
      Adjust
    </CustomButton>
  );
};

export const RepayButton = ({ tokenId, position }) => {
  const handleRepayClick = useRepayTrigger(tokenId, position);
  return (
    <div
      role="button"
      onClick={handleRepayClick}
      className="flex-1 flex items-center justify-center border border-danger border-opacity-60 cursor-pointer rounded-md text-base md:text-sm text-danger bg-danger bg-opacity-5 hover:opacity-80 py-2"
    >
      Repay
    </div>
  );
};
