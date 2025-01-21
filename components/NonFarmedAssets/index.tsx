import { BeatLoader } from "react-spinners";
import { useNonFarmedAssets } from "../../hooks/hooks";
import ClaimAllRewards from "../ClaimAllRewards";

function NonFarmedAssets() {
  const { hasNonFarmedAssets, hasNegativeNetLiquidity } = useNonFarmedAssets(false);
  const {
    hasNonFarmedAssets: hasNonFarmedAssetsMEME,
    hasNegativeNetLiquidity: hasNegativeNetLiquidityMEME,
  } = useNonFarmedAssets(true);
  // const main_null = !hasNonFarmedAssets || hasNegativeNetLiquidity;
  // const meme_null = !hasNonFarmedAssetsMEME || hasNegativeNetLiquidityMEME;

  if (hasNonFarmedAssets === true || hasNegativeNetLiquidity === false) {
    return (
      <div className="flex xsm:hidden xsm:gap-3 items-center justify-between mb-5 border border-primary border-opacity-60 bg-primary bg-opacity-5 rounded-xl p-3 pl-5">
        <div className="flex items-start">
          <WarnIcon className="relative top-px flex-shrink-0 xsm:hidden" />
          <div className="text-sm text-white mx-2.5 xsm:mx-0">
            At least one of your farms in the Mainstream has started emitting extra rewards. If you
            are seeing this warning, please click &apos;Claim & Join&apos; to join the new farm.
          </div>
        </div>
        <ClaimAllRewards
          location="non-farmed-assets"
          Button={ClaimButton}
          disabled={hasNegativeNetLiquidity}
          memeCategory={false}
        />
      </div>
    );
  } else if (hasNonFarmedAssetsMEME === true || hasNegativeNetLiquidityMEME === false) {
    return (
      <div className="flex xsm:hidden xsm:gap-3 items-center justify-between mb-5 border border-primary border-opacity-60 bg-primary bg-opacity-5 rounded-xl p-3 pl-5">
        <div className="flex items-start">
          <WarnIcon className="relative top-px flex-shrink-0 xsm:hidden" />
          <div className="text-sm text-white mx-2.5 xsm:mx-0">
            At least one of your farms in the meme has started emitting extra rewards. If you are
            seeing this warning, please click &apos;Claim & Join&apos; to join the new farm.
          </div>
        </div>
        <ClaimAllRewards
          location="non-farmed-assets"
          Button={ClaimButton}
          disabled={hasNegativeNetLiquidityMEME}
          memeCategory={true}
        />
      </div>
    );
  }

  return null;
}

const ClaimButton = (props) => {
  const { loading, disabled } = props;
  return (
    <div
      {...props}
      className="flex flex-shrink-0 items-center justify-center bg-primary rounded-md cursor-pointer text-sm font-bold text-dark-200 hover:opacity-80 w-[136px] xsm:w-full h-8"
    >
      {loading ? <BeatLoader size={5} color="#14162B" /> : <>Claim & Join</>}
    </div>
  );
};

const WarnIcon = (props) => {
  return (
    <svg
      {...props}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.00007 17.7111C4.19694 17.7111 0.288818 13.8036 0.288818 8.99982C0.288818 4.1967 4.19694 0.288574 9.00007 0.288574C13.8038 0.288574 17.7113 4.19607 17.7113 8.99982C17.7113 13.8036 13.8038 17.7111 9.00007 17.7111ZM9.00007 1.53857C4.88569 1.53857 1.53882 4.88545 1.53882 8.99982C1.53882 13.1136 4.88569 16.4611 9.00007 16.4611C13.1138 16.4611 16.4613 13.1142 16.4613 8.99982C16.4613 4.88545 13.1138 1.53857 9.00007 1.53857ZM8.06257 4.93732C8.06257 5.18597 8.16134 5.42442 8.33716 5.60024C8.51297 5.77605 8.75143 5.87482 9.00007 5.87482C9.24871 5.87482 9.48717 5.77605 9.66298 5.60024C9.8388 5.42442 9.93757 5.18597 9.93757 4.93732C9.93757 4.68868 9.8388 4.45023 9.66298 4.27441C9.48717 4.0986 9.24871 3.99982 9.00007 3.99982C8.75143 3.99982 8.51297 4.0986 8.33716 4.27441C8.16134 4.45023 8.06257 4.68868 8.06257 4.93732ZM9.00007 13.9998C8.65507 13.9998 8.37507 13.7205 8.37507 13.3748V7.74982C8.37507 7.40482 8.65507 7.12482 9.00007 7.12482C9.34507 7.12482 9.62507 7.40482 9.62507 7.74982V13.3748C9.62507 13.7205 9.34507 13.9998 9.00007 13.9998Z"
        fill="white"
      />
    </svg>
  );
};

export default NonFarmedAssets;
