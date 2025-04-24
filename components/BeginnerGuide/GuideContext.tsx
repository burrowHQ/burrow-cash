import React, { createContext, useState, useContext, ReactNode, useCallback } from "react";

interface GuideContextType {
  isBtcGuideOpen: boolean;
  setIsBtcGuideOpen: (isOpen: boolean) => void;
  isWalletGuideCompleted: boolean;
  markWalletGuideCompleted: () => void;
}

const GuideContext = createContext<GuideContextType>({
  isBtcGuideOpen: false,
  setIsBtcGuideOpen: (isOpen: boolean) => {
    console.warn("setIsBtcGuideOpen called on default context");
  },
  isWalletGuideCompleted: false,
  markWalletGuideCompleted: () => {
    console.warn("markWalletGuideCompleted called on default context");
  },
});

export const GuideProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isBtcGuideOpen, setIsBtcGuideOpen] = useState<boolean>(false);
  const [isWalletGuideCompleted, setIsWalletGuideCompleted] = useState<boolean>(
    () => localStorage.getItem("btc_guide") === "true",
  );

  const markWalletGuideCompleted = useCallback(() => {
    setIsWalletGuideCompleted(true);
    localStorage.setItem("btc_guide", "true");
  }, []);

  const value = {
    isBtcGuideOpen,
    setIsBtcGuideOpen,
    isWalletGuideCompleted,
    markWalletGuideCompleted,
  };

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
};

export const useGuide = () => useContext(GuideContext);

export default GuideContext;
