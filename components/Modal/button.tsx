import React from "react";

interface IButtonProps {
  children: string | React.ReactNode;
  disabled?: boolean;
  className?: string;
  [property: string]: any;
}

export function YellowSolidSubmitButton(props: IButtonProps) {
  return <Button appearanceClass="bg-primary text-dark-200" {...props} />;
}
export function RedSolidSubmitButton(props: IButtonProps) {
  return <Button appearanceClass="bg-danger text-white" {...props} />;
}

function Button({ appearanceClass, children, disabled, className, ...rest }: IButtonProps) {
  return (
    <button
      {...rest}
      type="button"
      disabled={disabled}
      className={`h-[46px] rounded-md text-base font-bold px-6 w-full ${appearanceClass} ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"
      } ${className}`}
    >
      {children}
    </button>
  );
}
