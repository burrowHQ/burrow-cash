import React, { PureComponent, useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { twMerge } from "tailwind-merge";
import { isMobileDevice } from "../../helpers/helpers";
import { LabelText } from "./interestRateChart";
import { format_apy } from "../../utils/uiNumber";

type chartProps = {
  data: any;
  xKey?: string;
  yKey?: any;
  isBorrow?: boolean;
  onPeriodClick?: (number) => any;
  disableControl?: boolean;
  defaultPeriod?: number;
  tokenRow?: any;
};

const TokenBorrowSuppliesChart = ({
  data,
  xKey,
  yKey,
  isBorrow,
  onPeriodClick,
  disableControl,
  defaultPeriod,
  tokenRow,
}: chartProps) => {
  const [period, setPeriod] = useState(365);
  const [init, setInit] = useState(false);
  const isMobile = isMobileDevice();

  useEffect(() => {
    if (!init && defaultPeriod) {
      setPeriod(defaultPeriod);
      setInit(true);
    }
  }, [defaultPeriod]);

  const handlePeriodClick = (n: number) => {
    if (onPeriodClick) {
      onPeriodClick(n);
    }
    setPeriod(n);
  };

  return (
    <>
      <div className="flex gap-1 justify-end mb-2 text-sm">
        <TabItem
          onClick={() => handlePeriodClick(30)}
          active={period === 30}
          label="1M"
          disable={disableControl}
        />
        <TabItem
          onClick={() => handlePeriodClick(365)}
          active={period === 365}
          label="1Y"
          disable={disableControl}
        />
        <TabItem
          onClick={() => handlePeriodClick(0)}
          active={period === 0}
          label="ALL"
          disable={disableControl}
        />
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            width={500}
            height={400}
            data={data}
            margin={{
              top: 10,
              right: isMobile ? 5 : 30,
              left: 0,
              bottom: 0,
            }}
          >
            {isMobile && (
              <CartesianGrid stroke="#eee" strokeWidth={0.3} opacity={0.3} vertical={false} />
            )}

            <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={<RenderTick />} />
            <YAxis
              tick={<RenderTickY />}
              dataKey={yKey}
              tickLine={false}
              tickCount={6}
              axisLine={false}
              orientation="left"
            />
            {/* <Tooltip /> */}

            <Tooltip
              cursor={{
                opacity: "0.3",
                fill: "#00c6a2",
                strokeDasharray: "2, 2",
              }}
              content={<CustomTooltip isBorrow={isBorrow} tokenRow={tokenRow} />}
            />

            <defs>
              <linearGradient id="colorYellow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00F7A5" stopOpacity={0.4} />
                <stop offset="75%" stopColor="#00F7A5" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <defs>
              <linearGradient id="colorPink" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5E3A" stopOpacity={0.4} />
                <stop offset="75%" stopColor="#FF5E3A" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <Area
              activeDot={<ActiveDot />}
              type="monotone"
              dataKey={yKey}
              stroke={isBorrow ? "#FF5E3A" : "#00F7A5"}
              fill={isBorrow ? "url(#colorPink)" : "url(#colorYellow)"}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

const ActiveDot = (props) => {
  const { cx, cy, stroke, fill, payload, value } = props;
  return <circle cx={cx} cy={cy} r={4} stroke={fill} fill={fill} />;
};

const TabItem = ({ onClick, active, label, disable }) => {
  const handleClick = () => {
    if (!disable) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={twMerge(
        "px-2 rounded-md cursor-pointer select-none",
        active && "active bg-dark-900 bg-opacity-20",
        disable && "disable text-dark-800",
      )}
    >
      {label}
    </div>
  );
};

const RenderTickY = (tickProps: any) => {
  const { x, y, payload, index } = tickProps;
  const { value, offset } = payload;

  return (
    <text fontSize="13px" fill="#7E8A93" x={x - 20} y={y} textAnchor="middle">
      {value}%
    </text>
  );
};

const RenderTick = (tickProps: any) => {
  const { x, y, payload, index } = tickProps;
  const { value, offset } = payload;

  if (index % 2 === 0) {
    return (
      <text fontSize="13px" fill="#7E8A93" x={x} y={y + 20} textAnchor="middle">
        {value}
      </text>
    );
  }

  return null;
};

const CustomTooltip = ({ active, isBorrow, payload, tokenRow }: any) => {
  if (!active || !payload || !payload?.[0]) return null;
  const data = payload?.[0] || {};
  const { value } = data || {};
  const { dayDate, baseApy, netApy, farmApy } = data?.payload || {};
  const { depositRewards } = tokenRow || {};
  const { metadata } = (depositRewards && depositRewards[0]) || {};

  if (isBorrow) {
    return (
      <div
        className="px-3 py-2 rounded-md min-w-max border border-gray-130"
        style={{ backgroundColor: "#25252C" }}
      >
        <div className="text-md text-primaryText">{dayDate}</div>
        <div className="text-white text-sm">{value?.toFixed(2)}%</div>
      </div>
    );
  }

  return (
    <div
      className="px-3 py-2 rounded-md min-w-max border border-gray-130"
      style={{ backgroundColor: "#25252C" }}
    >
      <div className="text-md text-primaryText">{dayDate}</div>
      <LabelText left="Base APY" right={format_apy(baseApy)} />
      {netApy ? (
        <LabelText left="Net Liquidity APY&nbsp;&nbsp;" right={`${netApy?.toFixed(2)}%`} />
      ) : null}

      {farmApy ? (
        <LabelText
          leftIcon={<img src={metadata?.icon} alt="" className="w-4 h-4 rounded-full mr-1" />}
          left="BRRR"
          right={`${farmApy?.toFixed(2)}%`}
        />
      ) : null}
    </div>
  );
};

export default TokenBorrowSuppliesChart;
