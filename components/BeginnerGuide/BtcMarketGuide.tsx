import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { GuideCloseIcon, GuideMarketIcon } from "../Header/svg";
import { getAccountId } from "../../redux/accountSelectors";
import { useAppSelector } from "../../redux/hooks";
import { NBTCTokenId } from "../../utils/config";
import { useGuide } from "./GuideContext";

const GUIDE_STORAGE_KEY = "btc_market_guide";

interface BtcMarketGuideProps {
  isBtcWallet: boolean;
}

const BtcMarketGuide: React.FC<BtcMarketGuideProps> = ({ isBtcWallet }) => {
  const [nbtcElement, setNbtcElement] = useState<Element | null>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const accountId = useAppSelector(getAccountId);

  const { isBtcGuideOpen, setIsBtcGuideOpen } = useGuide();

  const findNbtcElement = (retryCount = 0) => {
    const element = document.querySelector(`[data-token-id="${NBTCTokenId}"]`);

    if (element) {
      setNbtcElement(element);
      (element as HTMLElement).style.border = "1px solid #00F7A5";
      (element as HTMLElement).style.borderRadius = "8px";
      (element as HTMLElement).style.boxShadow = "0 0 10px rgba(0, 247, 165, 0.3)";
      (element as HTMLElement).style.position = "relative";
      (element as HTMLElement).style.zIndex = "1001";
      setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);

      element.addEventListener("click", handleNbtcElementClick);
    } else if (retryCount < 20) {
      setTimeout(() => findNbtcElement(retryCount + 1), 300);
    }
  };

  const handleNbtcElementClick = () => {
    completeGuide();
  };

  const completeGuide = () => {
    localStorage.setItem(GUIDE_STORAGE_KEY, "true");
    cleanupElement();
    setIsBtcGuideOpen(false);
  };

  const cleanupElement = (element?: Element) => {
    const target = element || nbtcElement;
    if (target) {
      (target as HTMLElement).style.border = "";
      (target as HTMLElement).style.borderRadius = "";
      (target as HTMLElement).style.boxShadow = "";
      (target as HTMLElement).style.position = "";
      (target as HTMLElement).style.zIndex = "";

      target.removeEventListener("click", handleNbtcElementClick);
    }
  };

  const isMarketPage = () => {
    return router.pathname === "/markets" || router.pathname === "/market";
  };

  useEffect(() => {
    if (isMarketPage() && isBtcWallet && accountId) {
      const hasSeenGuide = localStorage.getItem(GUIDE_STORAGE_KEY) === "true";
      if (!hasSeenGuide) {
        setIsBtcGuideOpen(true);
        const timer = setTimeout(() => {
          findNbtcElement();
        }, 800);
        return () => clearTimeout(timer);
      } else {
        setIsBtcGuideOpen(false);
      }
    } else {
      setIsBtcGuideOpen(false);
    }
  }, [router.pathname, isBtcWallet, accountId, setIsBtcGuideOpen]);

  useEffect(() => {
    return () => {
      cleanupElement();
    };
  }, []);

  const handleClose = () => {
    setIsBtcGuideOpen(false);
    cleanupElement();
  };

  if (!isBtcGuideOpen || !isMarketPage()) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[8px] z-[1000] pointer-events-auto" />

      {nbtcElement && (
        <div
          ref={guideRef}
          className="absolute z-[1002] flex flex-col items-end pointer-events-auto"
          style={{
            position: "absolute",
            top: `${(nbtcElement as HTMLElement).offsetTop - 160}px`,
            left: `${(nbtcElement as HTMLElement).offsetLeft + 20}px`,
          }}
        >
          <GuideMarketIcon />
          <div onClick={handleClose} className="mt-[-50px] cursor-pointer">
            <GuideCloseIcon />
          </div>
        </div>
      )}
    </>
  );
};

export default BtcMarketGuide;
