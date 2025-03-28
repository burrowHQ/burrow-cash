import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { SetIcon } from "./svg";
import { toggleShowDust } from "../../redux/marginTrading";
import { getShowDust } from "../../redux/categorySelectors";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";

const Set = () => {
  const [hover, setHover] = useState<boolean>(false);
  function show() {
    setHover(true);
  }
  function hide() {
    setHover(false);
  }
  return (
    <div
      onMouseEnter={show}
      onMouseLeave={hide}
      className="relative flex items-center justify-center w-[42px] h-[42px] border border-dark-50 bg-gray-800 rounded-md cursor-pointer"
    >
      <SetIcon />
      <SetList hover={hover} />
    </div>
  );
};
function SetList({ hover }) {
  const dispatch = useAppDispatch();
  const handleToggleShowDust = () => {
    dispatch(toggleShowDust());
  };
  const showDust = useAppSelector(getShowDust);
  return (
    <Box className={`${hover ? "" : "hidden"}`}>
      <Item label="Show Dust">
        <SliderButton active={showDust} onClick={handleToggleShowDust} />
      </Item>
    </Box>
  );
}

function Box({ children, className }) {
  return (
    <div className="absolute right-0 top-10 pt-2 z-50">
      <div
        className={twMerge(
          "border border-dark-50 rounded-md bg-dark-100 p-4 min-w-[200px]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
function Item({ children, label }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white">{label}</span>
      {children}
    </div>
  );
}
function SliderButton({ active, ...rest }: { active: boolean; onClick: any }) {
  return (
    <div
      {...rest}
      className={`flex items-center h-5 w-9 rounded-xl p-0.5 cursor-pointer border border-dark-50 transition-all ${
        active ? "bg-primary" : "bg-dark-600"
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full flex-shrink-0 ${
          active ? "bg-linear_gradient_dark shadow-100 ml-[14px]" : "bg-gray-300"
        }`}
      />
    </div>
  );
}
export default Set;
