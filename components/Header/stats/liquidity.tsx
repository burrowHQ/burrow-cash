// @ts-nocheck
import { Typography } from "@mui/material";
import Decimal from "decimal.js";
import { useFullDigits } from "../../../hooks/useFullDigits";
import { useAppSelector } from "../../../redux/hooks";
import {
  getTotalAccountBalance,
  getTotalAccountBalanceMEME,
} from "../../../redux/selectors/getTotalAccountBalance";
import { m, COMPACT_USD_FORMAT } from "../../../store";
import { trackFullDigits } from "../../../utils/telemetry";
import { Stat } from "./components";
import { getWeightedNetLiquidity } from "../../../redux/selectors/getAccountRewards";
import { useProtocolNetLiquidity } from "../../../hooks/useNetLiquidity";
import { DoubtIcon } from "../../Icons/Icons";
import CustomTooltips from "../../CustomTooltips/CustomTooltips";

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

export const UserLiquidity = () => {
  const { fullDigits, setDigits } = useFullDigits();
  const { activeCategory } = useAppSelector((state) => state.category);
  const userDeposited =
    activeCategory == "main"
      ? useAppSelector(getTotalAccountBalance("supplied"))
      : useAppSelector(getTotalAccountBalanceMEME("borrowed"));
  const userBorrowed =
    activeCategory == "main"
      ? useAppSelector(getTotalAccountBalance("borrowed"))
      : useAppSelector(getTotalAccountBalanceMEME("borrowed"));
  const userNetLiquidity = new Decimal(userDeposited).minus(userBorrowed).toNumber();
  const userNetLiquidityValue = userNetLiquidity > 0 ? `$${m(userNetLiquidity)}` : `$0`;
  const userDepositedValue = userDeposited > 0 ? `$${m(userDeposited)}` : `$0`;
  const userBorrowedValue = userBorrowed > 0 ? `$${m(userBorrowed)}` : "$0";
  const showLabels = userDeposited > 0 || userBorrowed > 0;

  const netLiquidityLabels = [
    [
      {
        value: userDepositedValue,
        text: "Supplied",
        valueStyle: {
          color: "#D2FF3A",
        },
      },
    ],
    [
      {
        value: userBorrowedValue,
        text: "Borrowed",
        valueStyle: {
          color: "#FF68A7",
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
