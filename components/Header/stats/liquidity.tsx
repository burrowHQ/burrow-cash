// @ts-nocheck
import { Typography } from "@mui/material";
import Decimal from "decimal.js";
import { useFullDigits } from "../../../hooks/useFullDigits";
import { useAppSelector } from "../../../redux/hooks";
import { getTotalAccountBalance } from "../../../redux/selectors/getTotalAccountBalance";
import { m, COMPACT_USD_FORMAT } from "../../../store";
import { trackFullDigits } from "../../../utils/telemetry";
import { Stat } from "./components";
import { getWeightedNetLiquidity } from "../../../redux/selectors/getAccountRewards";
import { useProtocolNetLiquidity } from "../../../hooks/useNetLiquidity";
import { DoubtIcon } from "../../Icons/Icons";
import CustomTooltips from "../../CustomTooltips/CustomTooltips";
import { beautifyPrice } from "../../../utils/beautyNumber";

export const ProtocolLiquidity = () => {
  const { fullDigits, setDigits } = useFullDigits();
  const { protocolBorrowed, protocolDeposited } = useProtocolNetLiquidity();

  const protocolDepositedValue = fullDigits?.totals
    ? protocolDeposited.toLocaleString(undefined, COMPACT_USD_FORMAT)
    : `$${m(protocolDeposited)}`;

  const protocolBorrowedValue = fullDigits?.totals
    ? protocolBorrowed.toLocaleString(undefined, COMPACT_USD_FORMAT)
    : `$${m(protocolBorrowed)}`;

  const toggleValues = () => {
    const totals = !fullDigits?.totals;
    trackFullDigits({ totals });
    setDigits({ totals });
  };

  return (
    <>
      <Stat
        title="Deposited"
        titleTooltip="Total deposits"
        amount={protocolDepositedValue}
        onClick={toggleValues}
      />
      <Stat
        title="Borrowed"
        titleTooltip="Total borrows"
        amount={protocolBorrowedValue}
        onClick={toggleValues}
      />
    </>
  );
};

export const UserLiquidity = ({ memeCategory }: { memeCategory?: boolean }) => {
  const { fullDigits, setDigits } = useFullDigits();
  const userDeposited = useAppSelector(getTotalAccountBalance("supplied", memeCategory));
  const userBorrowed = useAppSelector(getTotalAccountBalance("borrowed", memeCategory));
  const userNetLiquidity = new Decimal(userDeposited).minus(userBorrowed).toNumber();
  const userNetLiquidityValue = userNetLiquidity > 0 ? beautifyPrice(userNetLiquidity, true) : `$0`;
  const userDepositedValue = userDeposited > 0 ? beautifyPrice(userDeposited, true) : `$0`;
  const userBorrowedValue = userBorrowed > 0 ? beautifyPrice(userBorrowed, true) : "$0";
  const showLabels = userDeposited > 0 || userBorrowed > 0;

  const netLiquidityLabels = [
    [
      {
        value: userDepositedValue,
        text: "Supplied",
        valueStyle: {
          color: "#00F7A5",
        },
      },
    ],
    [
      {
        value: userBorrowedValue,
        text: "Borrowed",
        valueStyle: {
          color: "#FF5500",
        },
      },
    ],
  ];

  const toggleValues = () => {
    const user = !fullDigits?.user;
    trackFullDigits({ user });
    setDigits({ user });
  };

  return (
    <div className="relative">
      <Stat
        title="Net Liquidity"
        titleTooltip="Net Liquidity = Your total Supplied - Your total Borrowed"
        amount={userNetLiquidityValue}
        labels={showLabels ? netLiquidityLabels : []}
        onClick={toggleValues}
      />
    </div>
  );
};
