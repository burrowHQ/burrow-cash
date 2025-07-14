import { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { twMerge } from "tailwind-merge";
import { CopyIcon } from "./svg";

function CopyToClipboardComponent({
  text,
  className,
  disabled,
}: {
  text: string;
  disabled: boolean;
  className?: string;
}) {
  const [showTip, setShowTip] = useState<boolean>(false);
  const [copyButtonDisabled, setCopyButtonDisabled] = useState<boolean>(false);
  function showToast() {
    if (copyButtonDisabled) return;
    setCopyButtonDisabled(true);
    setShowTip(true);
    setTimeout(() => {
      setShowTip(false);
      setCopyButtonDisabled(false);
    }, 1000);
  }
  if (disabled) {
    return (
      <div className={twMerge("relative flex items-center justify-center top-px", className)}>
        <CopyToClipboard text={text}>
          <div className=" cursor-not-allowed">
            <CopyIcon className="text-gray-300 text-opacity-50" />
          </div>
        </CopyToClipboard>
      </div>
    );
  }
  return (
    <div className={twMerge("relative flex items-center justify-center top-px", className)}>
      <CopyToClipboard text={text} onCopy={showToast}>
        <div className="cursor-pointer">
          <CopyIcon className="text-gray-300 hover:text-blue-50" />
        </div>
      </CopyToClipboard>
      {showTip ? (
        <span className="text-xs text-white rounded-lg px-2.5 py-1.5 absolute bottom-4 bg-gray-800 z-50">
          Copied!
        </span>
      ) : null}
    </div>
  );
}
export default CopyToClipboardComponent;
