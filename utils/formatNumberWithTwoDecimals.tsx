export const formatNumberWithTwoDecimals = (
  num: string | number | undefined,
  isDollar: boolean = false,
) => {
  if (!num && num !== 0) return "-";
  const formattedNum = Number(num).toFixed(2);

  const [integerPart, decimalPart] = formattedNum.split(".");
  const finalDecimal = decimalPart.replace(/0+$/, "");

  const result = finalDecimal ? `${integerPart}.${finalDecimal}` : integerPart;

  const absValue = Math.abs(Number(num));
  if (absValue >= 1.0e9) {
    return (
      <span className="animate-flipIn">
        {isDollar ? "$" : ""}
        {(absValue / 1.0e9).toFixed(2)}B
      </span>
    );
  } else if (absValue >= 1.0e6) {
    return (
      <span className="animate-flipIn">
        {isDollar ? "$" : ""}
        {(absValue / 1.0e6).toFixed(2)}M
      </span>
    );
  } else if (absValue >= 1.0e3) {
    return (
      <span className="animate-flipIn">
        {isDollar ? "$" : ""}
        {(absValue / 1.0e3).toFixed(2)}K
      </span>
    );
  }

  return (
    <span className="animate-flipIn">
      {isDollar ? "$" : ""}
      {result}
    </span>
  );
};
