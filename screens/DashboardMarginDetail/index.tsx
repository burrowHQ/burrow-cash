import MyMarginTrading from "../MarginTrading/components/MyTrading";
import { LayoutBox } from "../../components/LayoutContainer/LayoutContainer";
import Breadcrumb from "../../components/common/breadcrumb";

const Index = () => {
  return (
    <LayoutBox>
      <Breadcrumb path="/dashboard" title="Dashboard" />
      <MyMarginTrading />
    </LayoutBox>
  );
};

export default Index;
