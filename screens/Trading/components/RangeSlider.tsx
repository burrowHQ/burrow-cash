import React, { useRef, useState, useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { useMarginConfigToken } from "../../../hooks/useMarginConfig";

interface RangeSliderProps {
  defaultValue: number;
  action: string;
  setRangeMount: (value: number) => void;
}

const RangeSlider: React.FC<RangeSliderProps> = ({ defaultValue, action, setRangeMount }) => {
  //
  const generateArithmeticSequence = (value: number) => {
    const increment = (value - 1) / 4;
    const sequence: number[] = [];

    for (let i = 0; i <= 4; i++) {
      sequence.push(+(1 + i * increment).toFixed(2));
    }

    return sequence;
  };
  //
  const { marginConfigTokens } = useMarginConfigToken();

  const allowedValues = generateArithmeticSequence(marginConfigTokens["max_leverage_rate"]);
  const [value, setValue] = useState(defaultValue);
  const [splitList, setSplitList] = useState(allowedValues);
  const [matchValue, setMatchValue] = useState(value);
  const valueRef = useRef<HTMLInputElement>(null);
  const [selectedItem, setSelectedItem] = useState(defaultValue);

  useEffect(() => {
    if (valueRef.current && allowedValues.length > 0) {
      const nearestValue = allowedValues.reduce((prev, curr) => {
        return Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev;
      });
      const percentage =
        ((nearestValue - splitList[0]) / (splitList[splitList.length - 1] - splitList[0])) * 100;
      valueRef.current.style.backgroundSize = `${percentage}% 100%`;
      setMatchValue(nearestValue);
    }
  }, [value, splitList, allowedValues]);

  // add center
  useEffect(() => {
    setValue(splitList[2]);
    setRangeMount(splitList[2]);
  }, []);

  function changeValue(v: string | number) {
    const numValue = Number(v);
    const nearestValue = allowedValues.reduce((prev, curr) => {
      return Math.abs(curr - numValue) < Math.abs(prev - numValue) ? curr : prev;
    });
    setValue(nearestValue);
    setSelectedItem(nearestValue);
    setRangeMount(nearestValue);
  }
  const actionShowRedColor = action === "Long";
  return (
    <div className="mt-5 pb-5 border-b border-dark-700 -mx-4 px-4">
      <div className="mb-3.5 text-sm text-gray-300">Leverage: {matchValue}X</div>
      <div className="relative flex flex-col z-10">
        <input
          ref={valueRef}
          onChange={(e) => changeValue(e.target.value)}
          value={value}
          type="range"
          className={`w-full cursor-pointer ${actionShowRedColor ? "" : "redInput"}`}
          style={{ backgroundSize: "100% 100%" }}
          min={splitList[0]}
          max={splitList[splitList.length - 1]}
          step="any"
        />
      </div>
      <div className={twMerge("flex justify-between items-center mt-2")}>
        {splitList.map((p) => (
          <div
            key={p}
            className="flex flex-col items-center cursor-pointer"
            onClick={() => changeValue(p)}
          >
            <span
              className={twMerge(
                `flex items-center justify-center text-xs text-gray-400 w-11 py-0.5 border border-transparent hover:border-v3LiquidityRemoveBarColor
                 rounded-lg`,
                p === selectedItem && "bg-black bg-opacity-20",
              )}
            >
              {p}X
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RangeSlider;
