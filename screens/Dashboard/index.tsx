import DashboardOverview from "../../components/Dashboard/dashboardOverview";
import DashboardMarginOverview from "../../components/Dashboard/dashboardMarginOverview";
import { useAccountId } from "../../hooks/hooks";
import UnLoginUi from "../../components/Dashboard/unLoginBox";

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
        <UnLoginUi wraperClass="lg:mt-[100px]  xsm:mx-4" />
      )}
    </div>
  );
};
export default Index;
