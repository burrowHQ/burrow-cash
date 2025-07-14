import { useState, useEffect, ReactNode } from "react";
import { GuideIcon, GuideCloseIcon } from "../Header/svg";
import { getAccountId } from "../../redux/accountSelectors";
import { useAppSelector } from "../../redux/hooks";
import { useGuide } from "./GuideContext";

interface BeginnerGuideWrapperProps {
  children: (canClick: boolean) => ReactNode;
}

const GuideContent = ({ onClose }: { onClose: () => void }) => {
  return (
    <>
      <div className="absolute top-[42px] transform -translate-x-1/2">
        <GuideIcon />
      </div>
      <div className="cursor-pointer absolute top-[210px] flex items-center gap-2 right-[-12px]">
        Got it
        <GuideCloseIcon onClick={onClose} />
      </div>
    </>
  );
};

const BeginnerGuideWrapper = ({ children }: BeginnerGuideWrapperProps) => {
  const accountId = useAppSelector(getAccountId);
  const { isWalletGuideCompleted, markWalletGuideCompleted } = useGuide();
  const [isGuideOpen, setIsGuideOpen] = useState(true);

  useEffect(() => {
    if (isWalletGuideCompleted) {
      setIsGuideOpen(false);
    }
  }, [isWalletGuideCompleted]);

  const handleCloseGuide = () => {
    setIsGuideOpen(false);
    markWalletGuideCompleted();
  };

  const canClick = isWalletGuideCompleted || !!accountId;

  useEffect(() => {
    if (!accountId && !isWalletGuideCompleted && isGuideOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [accountId, isWalletGuideCompleted, isGuideOpen]);

  return (
    <>
      {!accountId && !isWalletGuideCompleted && isGuideOpen && (
        <div className="fixed inset-0 top-[62px] bg-[#16161BB2] bg-opacity-70 backdrop-blur-[24px] z-[1000]" />
      )}
      <div className="relative z-[10001]">
        {children(canClick)}
        {!accountId && !isWalletGuideCompleted && isGuideOpen && (
          <GuideContent onClose={handleCloseGuide} />
        )}
      </div>
    </>
  );
};

export default BeginnerGuideWrapper;
