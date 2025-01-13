import { twMerge } from "tailwind-merge";

export const beautifyPrice = (
  num: string | number,
  isDollar: boolean = false,
  decimalPlaces: number = 5,
  digitsPlaces: number = 4,
) => {
  if (!num) return "-";
  let numStr = num.toString();
  if (numStr.includes("e")) {
    const [base, exp] = numStr.split("e");
    const expNum = parseInt(exp, 10);
    numStr =
      expNum < 0
        ? `0.${"0".repeat(Math.abs(expNum) - 1)}${base.replace(".", "")}`
        : base.replace(".", "") + "0".repeat(expNum);
  }

  const [integerPart, decimalPart = ""] = numStr.split(".");
  const isPositive = +integerPart >= 0;

  const absValue = Math.abs(Number(num));
  if (absValue >= 1.0e9) {
    return (
      <span key={num} className="animate-flipIn">
        {isDollar ? "$" : ""}
        {(absValue / 1.0e9).toFixed(2)}B
      </span>
    );
  } else if (absValue >= 1.0e6) {
    return (
      <span key={num} className="animate-flipIn">
        {isDollar ? "$" : ""}
        {(absValue / 1.0e6).toFixed(2)}M
      </span>
    );
  } else if (absValue >= 1.0e3) {
    return (
      <span key={num} className="animate-flipIn">
        {isDollar ? "$" : ""}
        {(absValue / 1.0e3).toFixed(2)}K
      </span>
    );
  }

  if (isPositive) {
    if (+integerPart >= 100) {
      const significantDigits = decimalPart.slice(0, 2).replace(/0+$/, "");
      return (
        <span key={num} className="animate-flipIn">
          {isDollar ? "$" : ""}
          {`${integerPart}${significantDigits ? `.${significantDigits}` : ""}`}
        </span>
      );
    } else if (+integerPart > 0 && +integerPart < 100) {
      let totalDigits = `${integerPart}${decimalPart ? `.${decimalPart}` : ""}`.slice(0, 6);
      if (decimalPart) {
        totalDigits = totalDigits.replace(/0+$/, "");
        if (totalDigits.endsWith(".")) {
          totalDigits = totalDigits.slice(0, -1);
        }
      }

      return (
        <span key={num} className="animate-flipIn">
          {isDollar ? "$" : ""}
          {totalDigits}
        </span>
      );
    }

    const nonZeroIndex = decimalPart.split("").findIndex((n) => +n !== 0);
    if (nonZeroIndex <= 1) {
      let significantDigits = decimalPart.replace(/0+$/, "").slice(0, decimalPlaces);
      while (significantDigits.endsWith("0")) {
        significantDigits = significantDigits.slice(0, -1);
      }
      significantDigits = significantDigits.replace(/0+$/, "");
      return (
        <span key={num} className="animate-flipIn">
          {isDollar ? "$" : ""}
          {`${integerPart}${significantDigits ? `.${significantDigits}` : ""}`}
        </span>
      );
    }
    const nonZeroPart = decimalPart.substring(nonZeroIndex);
    let digits = nonZeroPart.slice(0, digitsPlaces);
    while (digits.endsWith("0")) {
      digits = digits.slice(0, -1);
    }
    return (
      <span key={num} className="animate-flipIn">
        {isDollar ? "$" : ""}
        {+integerPart === 0 ? "0.0" : integerPart + ".0"}
        <span className={twMerge("px-px need-small", "")} style={{ color: "#d2ff3a" }}>
          {nonZeroIndex}
        </span>
        {digits}
      </span>
    );
  }

  const floatPartLength = Math.max(5 - integerPart.length, 2);
  let formattedDecimal = decimalPart.slice(0, floatPartLength).replace(/0+$/, "");

  const fullNumber = integerPart + (formattedDecimal || "");
  if (fullNumber.endsWith("0")) {
    if (formattedDecimal) {
      formattedDecimal = formattedDecimal.slice(0, -1);
    } else {
      return (
        <span key={num} className="animate-flipIn">
          {isDollar ? "$" : ""}
          {integerPart.slice(0, -1)}
        </span>
      );
    }
  }

  return (
    <span key={num} className="animate-flipIn">
      {isDollar ? "$" : ""}
      {integerPart}
      {formattedDecimal ? `.${formattedDecimal}` : ""}
    </span>
  );
};
