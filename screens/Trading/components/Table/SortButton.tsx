import { ArrowDownIcon, ArrowUpIcon } from "../../../MarginTrading/components/Icon";

export function Tab({ tabName, isSelected, onClick }) {
  return (
    <div
      className={`pt-6 pl-10 pb-4 pr-7 text-gray-300 text-lg cursor-pointer ${
        isSelected ? "border-b-2 border-primary text-white" : ""
      }`}
      onClick={onClick}
    >
      {tabName}
    </div>
  );
}

export function SortButton({ sort, activeColor, inactiveColor }) {
  return (
    <div className="flex flex-col items-center gap-0.5 ml-1.5">
      <ArrowUpIcon fill={`${sort === "asc" ? activeColor : inactiveColor}`} />
      <ArrowDownIcon fill={`${sort === "desc" ? activeColor : inactiveColor}`} />
    </div>
  );
}

export function SortHistoryButton({ sort, activeColor, inactiveColor }) {
  return (
    <div className="flex flex-col items-center gap-0.5 ml-1.5">
      <ArrowUpIcon fill={`${sort === "ASC" ? activeColor : inactiveColor}`} />
      <ArrowDownIcon fill={`${sort === "DESC" ? activeColor : inactiveColor}`} />
    </div>
  );
}
