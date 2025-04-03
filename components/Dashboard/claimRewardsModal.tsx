import React from "react";
import { Modal, Box } from "@mui/material";
import { BeatLoader } from "react-spinners";
import { Wrapper } from "../Modal/style";
import { CloseIcon } from "../Modal/svg";
import { formatTokenValue } from "../../helpers/helpers";
import ClaimAllRewards from "../ClaimAllRewards";
import { WarnTipIcon } from "../Icons/IconsV2";

export default function ClaimRewardsModal({
  rewardsObj,
  isOpen,
  closeModal,
}: {
  rewardsObj: any;
  isOpen: boolean;
  closeModal: () => void;
}) {
  const unclaimNodes = rewardsObj?.data?.array.map(({ data, tokenId }) => {
    return (
      <div className="flex justify-between mb-4 items-center" key={tokenId}>
        <div className="flex items-center gap-1.5">
          <img src={data?.icon} className="w-[26px] h-[26px] rounded-full" alt="" />
          <span className="text-gray-300">{data?.symbol}</span>
        </div>
        <div className="flex-grow border-t border-dashed border-gray-300 mx-4" />
        <div>{formatTokenValue(data?.unclaimedAmount)}</div>
      </div>
    );
  });
  return (
    <Modal open={isOpen} onClose={closeModal}>
      <Wrapper>
        <Box sx={{ p: ["20px", "20px"] }}>
          <div className="flex items-center justify-between text-lg text-white mb-7">
            <span className="text-lg font-bold">Claim Rewards</span>
            <CloseIcon onClick={closeModal} className="cursor-pointer" />
          </div>
          {unclaimNodes}
          <ClaimAllRewards Button={ClaimButton} onDone={closeModal} location="dashboard" />
          <div className="flex items-center w-full mt-4 xsm:items-start">
            <WarnTipIcon className="mr-1.5 xsm:mt-1.5 flex-shrink-0" />
            <span className="text-sm text-white text-opacity-60 inline">
              Rewards will withdraw to your token's supply balance.
            </span>
          </div>
        </Box>
      </Wrapper>
    </Modal>
  );
}

const ClaimButton = (props) => {
  const { loading, disabled } = props;
  return (
    <div
      {...props}
      className="flex items-center justify-center bg-primary rounded-md cursor-pointer text-sm font-bold text-dark-200 hover:opacity-80 w-full h-8 mt-1.5 "
    >
      {loading ? <BeatLoader size={5} color="#16161B" /> : <>Claim</>}
    </div>
  );
};
