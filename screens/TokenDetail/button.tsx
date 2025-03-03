import React from "react";

interface IButtonProps {
  children: string | React.ReactNode;
  disabled?: boolean;
  className?: string;
  [property: string]: any;
}

export function YellowSolidButton(props: IButtonProps) {
  return <Button appearanceClass="bg-primary text-dark-200 cursor-pointer" {...props} />;
}
export function YellowLineButton(props: IButtonProps) {
  return (
    <Button
      appearanceClass="bg-primary bg-opacity-5 text-primary cursor-pointer border border-primary border-opacity-60"
      {...props}
    />
  );
}
export function RedSolidButton(props: IButtonProps) {
  return <Button appearanceClass="bg-danger text-white cursor-pointer" {...props} />;
}
export function RedLineButton(props: IButtonProps) {
  return (
    <Button
      appearanceClass="bg-danger bg-opacity-5 text-danger cursor-pointer border border-danger border-opacity-60"
      {...props}
    />
  );
}

function Button({ appearanceClass, children, disabled, className, ...rest }: IButtonProps) {
  return (
    <button
      {...rest}
      type="button"
      disabled={disabled}
      className={`h-[42px] rounded-md text-base font-bold px-6 hover:opacity-80 outline-none ${
        disabled ? " bg-gray-500  text-dark-400 cursor-not-allowed" : `${appearanceClass}`
      } ${className}`}
    >
      {children}
    </button>
  );
}
