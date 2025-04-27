import React, { createContext, useState, useContext, ReactNode, useCallback } from "react";

interface GuideContextType {
  isBtcGuideOpen: boolean;
  setIsBtcGuideOpen: (isOpen: boolean) => void;
  isWalletGuideCompleted: boolean;
  markWalletGuideCompleted: () => void;
  isNbtcDetailGuideActive: boolean;
  setNbtcDetailGuideActive: (isActive: boolean) => void;
  nbtcDetailGuideStep: number;
  setNbtcDetailGuideStep: (step: number) => void;
  setMobileTab?: (tab: "market" | "your") => void;
  mobileTab?: "market" | "your";
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
  isNbtcDetailGuideActive: false,
  setNbtcDetailGuideActive: (isActive: boolean) => {
    console.warn("setNbtcDetailGuideActive called on default context");
  },
  nbtcDetailGuideStep: 1,
  setNbtcDetailGuideStep: (step: number) => {
    console.warn("setNbtcDetailGuideStep called on default context");
  },
});

export const GuideProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isBtcGuideOpen, setIsBtcGuideOpen] = useState<boolean>(false);
  const [isWalletGuideCompleted, setIsWalletGuideCompleted] = useState<boolean>(
    () => localStorage.getItem("btc_guide") === "true",
  );
  const [isNbtcDetailGuideActive, setNbtcDetailGuideActive] = useState<boolean>(false);
  const [nbtcDetailGuideStep, setNbtcDetailGuideStep] = useState<number>(1);
  const [mobileTab, setMobileTab] = useState<"market" | "your">("market");

  const markWalletGuideCompleted = useCallback(() => {
    setIsWalletGuideCompleted(true);
    localStorage.setItem("btc_guide", "true");
  }, []);

  const value = {
    isBtcGuideOpen,
    setIsBtcGuideOpen,
    isWalletGuideCompleted,
    markWalletGuideCompleted,
    isNbtcDetailGuideActive,
    setNbtcDetailGuideActive,
    nbtcDetailGuideStep,
    setNbtcDetailGuideStep,
    setMobileTab,
    mobileTab,
  };

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
};

export const useGuide = () => useContext(GuideContext);

export default GuideContext;
