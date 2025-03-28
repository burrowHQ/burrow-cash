import { useState } from "react";
import _ from "lodash";

// hooks for fetch
export const useDebouncedInput = (callback, delay) => {
  //
  const [longInput, setLongInput] = useState(0);
  const [longOutput, setLongOutput] = useState(0);
  const [shortInput, setShortInput] = useState(0);
  const [shortOutput, setShortOutput] = useState(0);

  // stra
  const obj = {
    longInput: setLongInput,
    longOutput: setLongOutput,
    shortInput: setShortInput,
    shortOutput: setShortOutput,
  };

  //
  const debouncedCallback = _.debounce(callback, delay);

  //
  const inputPriceChange = (value, flag: string) => {
    obj[flag](value);

    debouncedCallback(value, flag);
  };

  return [longInput, longOutput, shortInput, shortOutput, inputPriceChange];
};
