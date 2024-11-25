export const beautifyPrice = (num: number) => {
  // 处理科学计数法的数字
  let numStr = num.toString();
  if (numStr.includes("e")) {
    const [base, exp] = numStr.split("e");
    const expNum = parseInt(exp, 10);
    if (expNum < 0) {
      const absExp = Math.abs(expNum);
      numStr = `0.${"0".repeat(absExp - 1)}${base.replace(".", "")}`;
    } else {
      numStr = base.replace(".", "") + "0".repeat(expNum);
    }
  }

  const arr = numStr.split(".");
  const integerPart = arr[0];
  const decimalPart = arr[1] || "";

  if (!decimalPart) {
    // 整数部分如果超过5位，只显示前5位
    const digits = integerPart.slice(0, 5);
    // 如果最后一位是0，则只取前4位
    return (
      <span key={num} className="animate-flipIn">
        {digits.endsWith("0") ? digits.slice(0, 4) : digits}
      </span>
    );
  }

  if (+integerPart === 0) {
    const nonZeroIndex = decimalPart.split("").findIndex((n) => +n !== 0);
    if (nonZeroIndex <= 1) {
      // 取5位有效数字，但如果最后一位是0则只取4位
      let significantDigits = decimalPart.replace(/0+$/, "").slice(0, 5);
      if (significantDigits.endsWith("0")) {
        significantDigits = significantDigits.slice(0, 4);
      }
      return (
        <span key={num} className="animate-flipIn">
          {`0.${significantDigits}`}
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
        0.0
        <span className="text-[8px] px-px">{nonZeroIndex}</span>
        {digits}
      </span>
    );
  }

  // 整数部分不为0时
  const floatPartLength = Math.max(5 - integerPart.length, 2);
  let formattedDecimal = decimalPart.slice(0, floatPartLength).replace(/0+$/, "");

  // 如果整数加小数的最后一位是0，则去掉
  const fullNumber = integerPart + (formattedDecimal || "");
  if (fullNumber.endsWith("0")) {
    if (formattedDecimal) {
      formattedDecimal = formattedDecimal.slice(0, -1);
    } else {
      return (
        <span key={num} className="animate-flipIn">
          {integerPart.slice(0, -1)}
        </span>
      );
    }
  }

  return (
    <span key={num} className="animate-flipIn">
      {integerPart}
      {formattedDecimal ? `.${formattedDecimal}` : ""}
    </span>
  );
};
