import dynamic from "next/dynamic";
import { type Ref } from "react";
import { type TradingViewChartProps, type TradingViewChartExposes } from "./TradingViewChart/index";
import Loading from "./loading";

export const TradingViewChartDynamic = dynamic(
  async () => {
    const { default: TradingViewChartComponent } = await import("./TradingViewChart/index");
    const wrapper = ({
      forwardedRef,
      ...props
    }: TradingViewChartProps & {
      forwardedRef: Ref<TradingViewChartExposes>;
    }) => <TradingViewChartComponent ref={forwardedRef} {...props} />;
    return wrapper;
  },
  {
    ssr: false,
    loading: () => <Loading />,
  },
);
