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
        <div className="relative flex flex-col justify-center items-center border border-dark-50 rounded-md bg-dark-120 lg:h-[234px] lg:mt-[100px]  xsm:mx-4 xsm:pb-[60px] xsm:px-5">
          <div className="lg:hidden transform scale-50 -mt-16">
            <BookTokenSvg />
          </div>
          <div className="flex flex-col justify-center items-center xsm:-mt-16">
            <div className="text-xl text-white">Connect your wallet</div>
            <div className="text-base text-gray-160 mt-3 mb-8 text-center xsm:text-sm">
              Please connect your wallet to see your supplies, borrowings, and open positions.
            </div>
          </div>
          <ConnectWalletButton accountId={accountId} className="xsm:w-full" />
          <div className="absolute right-[30px] xsm:hidden">
            <BookTokenSvg />
          </div>
        </div>
      )}
    </div>
  );
};
export default Index;
