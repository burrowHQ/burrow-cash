import { isMobileDevice } from "../../../../helpers/helpers";
import { formatPrice } from "../../../../utils/uiNumber";

const AccountRow = ({ assetDetails, marginAssetDetails, parseTokenValue, token }) => {
  const isMobile = isMobileDevice();
  return !isMobile ? (
    <tr className="text-base hover:bg-dark-100 font-normal">
      <td className="py-5 pl-5">
        <div className="flex items-center">
          <img src={assetDetails.metadata.icon} alt="" className="w-4 h-4 rounded-2xl" />
          <p className="ml-1"> {assetDetails.metadata.symbol}</p>
        </div>
      </td>
      <td>{formatPrice(parseTokenValue(token.balance, marginAssetDetails.decimals))}</td>
      <td>{marginAssetDetails.price ? formatPrice(marginAssetDetails.price) : "-"}</td>
      <td>
        $
        {marginAssetDetails.price
          ? formatPrice(
              parseTokenValue(token.balance, marginAssetDetails.decimals) *
                marginAssetDetails.price,
            )
          : "-"}
      </td>
    </tr>
  ) : (
    <tr className="text-sm hover:bg-dark-100 font-normal ">
      <td className="pb-[10px] pl-[30px] pt-[10px]">
        <div className="flex items-center">
          <img src={assetDetails.metadata.icon} alt="" className="w-[26px] h-[26px] rounded-2xl" />
          <div className="ml-2">
            <p className="text-sm"> {assetDetails.metadata.symbol}</p>
            <p className="text-xs text-gray-300 -mt-0.5">
              {marginAssetDetails.price ? formatPrice(marginAssetDetails.price) : "/"}
            </p>
          </div>
        </div>
      </td>
      <td>{formatPrice(parseTokenValue(token.balance, marginAssetDetails.decimals))}</td>
      <td className="text-right pr-[32px]">
        $
        {marginAssetDetails.price
          ? formatPrice(
              parseTokenValue(token.balance, marginAssetDetails.decimals) *
                marginAssetDetails.price,
            )
          : "-"}
      </td>
    </tr>
  );
};
export default AccountRow;
