import { twMerge } from "tailwind-merge";

export const beautifyPrice = (num: number, isDollar: boolean = false) => {
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

  if (isPositive) {
    const nonZeroIndex = decimalPart.split("").findIndex((n) => +n !== 0);
    if (nonZeroIndex <= 1) {
      let significantDigits = decimalPart.replace(/0+$/, "").slice(0, 5);
      if (significantDigits.endsWith("0")) {
        significantDigits = significantDigits.slice(0, 4);
      }
      return (
        <span key={num} className="animate-flipIn">
          {isDollar ? "$" : ""}
          {`${integerPart}.${significantDigits}`}
        </span>
      );
    }
    const nonZeroPart = decimalPart.substring(nonZeroIndex);
    let digits = nonZeroPart.slice(0, 4);
    if (digits.endsWith("0")) {
      digits = digits.slice(0, 3);
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
