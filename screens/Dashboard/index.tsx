import DashboardOverview from "../../components/Dashboard/dashboardOverview";
import DashboardMarginOverview from "../../components/Dashboard/dashboardMarginOverview";
import { useAccountId } from "../../hooks/hooks";
import { ConnectWalletButton } from "../../components/Header/WalletButton";
import BookTokenSvg from "../../public/svg/Group 74.svg";

const Index = () => {
  const accountId = useAccountId();
  return (
    <div className="max-w-[1200px] mx-auto">
      {accountId ? (
        <div>
          {/* main position */}
          <DashboardOverview memeCategory={false} />
          {/* meme position */}
          <DashboardOverview memeCategory={true} />
          {/* margin trading */}
          <DashboardMarginOverview />
        </div>
      ) : (
        <div className="relative flex flex-col justify-center items-center border border-dark-50 rounded-md bg-dark-120 h-[234px] mt-[100px]">
          <div className="text-xl text-white">Connect your wallet</div>
          <div className="text-base text-gray-160 mt-3 mb-8">
            Please connect your wallet to see your open positions.
          </div>
          <ConnectWalletButton accountId={accountId} />
          <div className="absolute right-[30px]">
            <BookTokenSvg />
          </div>
        </div>
      )}
    </div>
  );
};
export default Index;
