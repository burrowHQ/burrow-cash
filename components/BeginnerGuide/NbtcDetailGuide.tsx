import React, { useEffect, useState, useRef } from "react";
// eslint-disable-next-line import/no-extraneous-dependencies
import Joyride, { CallBackProps, Placement } from "react-joyride";
import { useRouter } from "next/router";
import { NBTCTokenId } from "../../utils/config";
import { useGuide } from "./GuideContext";
import {
  ChainBalanceIcon,
  ChainBalanceMobileIcon,
  ChainSupplyIcon,
  ChainSupplyMobile1Icon,
  ChainSupplyMobile2Icon,
  ChainSupplyMobile3Icon,
  ChainSupplyMobileIcon,
  ChainSupplyMobileMove1Icon,
  ChainSupplyMobileMove2Icon,
} from "./icon";
import FinalStepGuide from "./FinalStepGuide";
import { isMobileDevice } from "../../helpers/helpers";

const GUIDE_STORAGE_KEY = "btc_market_details_guide";
interface BorderPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

const CustomBorder = ({ position }: { position: BorderPosition }) => {
  if (!position) return null;
  const { left, top, width, height } = position;
  return (
    <div
      style={{
        position: "fixed",
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: "none",
        zIndex: 30000,
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
        }}
      >
        <rect
          x="0.5"
          y="0.5"
          width={width - 1}
          height={height - 1}
          rx="7.5"
          stroke="#00F7A5"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};

interface NbtcDetailGuideProps {
  isNbtcToken: boolean;
}

const preventScroll = (e: Event) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
};

const addNoScroll = () => {
  window.addEventListener("wheel", preventScroll, { passive: false });
  window.addEventListener("touchmove", preventScroll, { passive: false });
  document.body.style.overflow = "hidden";
};

const removeNoScroll = () => {
  window.removeEventListener("wheel", preventScroll);
  window.removeEventListener("touchmove", preventScroll);
  document.body.style.overflow = "";
  document.body.style.overflowX = "";
  document.body.style.overflowY = "";
  document.body.classList.remove("modal-open");
  document.body.style.maxHeight = "";
};

const NbtcDetailGuide: React.FC<NbtcDetailGuideProps> = ({ isNbtcToken }) => {
  const router = useRouter();
  const isMobile = isMobileDevice();
  const {
    isNbtcDetailGuideActive,
    setNbtcDetailGuideActive,
    setNbtcDetailGuideStep,
    setMobileTab,
  } = useGuide();

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [borderPosition, setBorderPosition] = useState<BorderPosition | null>(null);

  const handleFinishGuide = () => {
    setRun(false);
    localStorage.setItem(GUIDE_STORAGE_KEY, "true");
    setNbtcDetailGuideActive(false);
    setNbtcDetailGuideStep(1);
  };

  const steps = [
    {
      target: '[data-tour="chain-balances"]',
      content: isMobile ? <ChainBalanceMobileIcon className="mt-[-72px]" /> : <ChainBalanceIcon />,
      placement: isMobile ? ("bottom" as Placement) : ("left" as Placement),
      disableBeacon: true,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      target: '[data-tour="supply-button"]',
      content: isMobile ? <ChainSupplyMobileIcon className="mt-[-74px]" /> : <ChainSupplyIcon />,
      placement: isMobile ? ("bottom" as Placement) : ("left" as Placement),
      disableBeacon: true,
      spotlightClicks: true,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      target: '[data-tour="modal-tabs"]',
      content: isMobile ? (
        <ChainSupplyMobileMove1Icon className="mt-[-70px]" />
      ) : (
        <ChainSupplyMobile1Icon />
      ),
      placement: isMobile ? ("bottom" as Placement) : ("left" as Placement),
      disableBeacon: true,
      styles: {
        options: {
          zIndex: 30000,
        },
      },
    },
    {
      target: '[data-tour="modal-available"]',
      content: isMobile ? (
        <ChainSupplyMobileMove2Icon className="mt-[-70px]" />
      ) : (
        <ChainSupplyMobile2Icon />
      ),
      placement: isMobile ? ("bottom" as Placement) : ("left" as Placement),
      disableBeacon: true,
      styles: {
        options: {
          zIndex: 30000,
        },
      },
    },
    {
      target: '[data-tour="modal-near-tab"]',
      content: <FinalStepGuide onFinish={handleFinishGuide} />,
      placement: "bottom" as Placement,
      disableBeacon: true,
      hideFooter: true,
      hideCloseButton: true,
      styles: {
        options: {
          zIndex: 30000,
        },
      },
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;
    if (status === "finished" || status === "skipped") {
      setRun(false);
      localStorage.setItem(GUIDE_STORAGE_KEY, "true");
      setNbtcDetailGuideActive(false);
      setNbtcDetailGuideStep(1);
      removeNoScroll();
    } else if (type === "step:after" && action === "next") {
      if (index === 1) {
        const supplyButton = document.querySelector('[data-tour="supply-button"]');
        if (supplyButton) {
          (supplyButton as HTMLElement).click();
          const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
              if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                const dialog = document.querySelector('[data-tour="modal-tabs"]');
                if (dialog) {
                  observer.disconnect();
                  setStepIndex(index + 1);
                  return;
                }
              }
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
          setTimeout(() => {
            observer.disconnect();
            setStepIndex(index + 1);
          }, 500);

          return;
        }
      }
      setStepIndex(index + 1);
    } else if (type === "step:before") {
      setNbtcDetailGuideStep(index + 1);
      if (index === steps.length - 1) {
        const nearTab = document.querySelector('[data-tour="modal-near-tab"]');
        if (nearTab) {
          (nearTab as HTMLElement).click();
        }
      }
      if (isMobile && index === 2 && setMobileTab) {
        setMobileTab("your");
      }
    }
  };
  useEffect(() => {
    const isDetailPage = router.pathname.includes("/tokenDetail/");
    const isCorrectToken = router.query.id === NBTCTokenId;
    const hasCompletedGuide = localStorage.getItem(GUIDE_STORAGE_KEY) === "true";
    const handleKeyActivate = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key === "g") {
        localStorage.removeItem(GUIDE_STORAGE_KEY);
        setNbtcDetailGuideActive(true);
        setStepIndex(0);
        setRun(true);
      }
    };
    document.addEventListener("keydown", handleKeyActivate);
    if (isDetailPage && isCorrectToken && !hasCompletedGuide && isNbtcDetailGuideActive) {
      setRun(true);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyActivate);
    };
  }, [router.pathname, router.query.id, isNbtcDetailGuideActive, setNbtcDetailGuideActive]);
  useEffect(() => {
    if (run && stepIndex === 1) {
      const supplyButton = document.querySelector('[data-tour="supply-button"]');
      const handleSupplyClick = () => {
        setTimeout(() => {
          const dialog = document.querySelector('[data-tour="modal-tabs"]');
          if (dialog) {
            setStepIndex(2);
          }
        }, 500);
      };
      if (supplyButton) {
        supplyButton.addEventListener("click", handleSupplyClick);
      }
      return () => {
        if (supplyButton) {
          supplyButton.removeEventListener("click", handleSupplyClick);
        }
      };
    }
  }, [run, stepIndex]);
  useEffect(() => {
    if (run) {
      const findAndUpdateSpotlight = () => {
        const spotlightElement = document.querySelector(".react-joyride__spotlight");
        if (spotlightElement) {
          const rect = spotlightElement.getBoundingClientRect();
          setBorderPosition({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          });
        }
      };

      let animationFrameId: number;
      const updatePosition = () => {
        findAndUpdateSpotlight();
        animationFrameId = requestAnimationFrame(updatePosition);
      };
      animationFrameId = requestAnimationFrame(updatePosition);

      const observer = new MutationObserver(() => {
        findAndUpdateSpotlight();
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return () => {
        cancelAnimationFrame(animationFrameId);
        observer.disconnect();
        setBorderPosition(null);
      };
    }
  }, [run, stepIndex]);
  useEffect(() => {
    if (run) {
      addNoScroll();
    } else {
      removeNoScroll();
    }
    return () => {
      removeNoScroll();
    };
  }, [run]);
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (
        document.body.style.overflow === "hidden" ||
        document.body.style.overflowX === "hidden" ||
        document.body.style.overflowY === "hidden"
      ) {
        document.body.style.overflow = "";
        document.body.style.overflowX = "";
        document.body.style.overflowY = "";
        document.body.classList.remove("modal-open");
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["style", "class"] });
    return () => observer.disconnect();
  }, []);
  if (!isNbtcToken || !isNbtcDetailGuideActive || router.query.id !== NBTCTokenId) {
    return null;
  }
  return (
    <>
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        run={run}
        scrollToFirstStep
        scrollOffset={100}
        showProgress={false}
        showSkipButton={false}
        hideBackButton
        stepIndex={stepIndex}
        steps={steps}
        styles={{
          options: {
            primaryColor: "#00F7A5",
            zIndex: 30000,
            arrowColor: "transparent",
            backgroundColor: "transparent",
            textColor: "transparent",
            overlayColor: "rgba(22, 22, 27,1)",
          },
          tooltip: {
            borderRadius: "8px",
          },
          tooltipContent: {
            padding: "30px 10px 0 10px",
          },
          buttonNext: {
            backgroundColor: "rgba(22, 22, 27, 1)",
            color: "#fff",
            width: "60px",
            height: "22px",
            borderWidth: "1px",
            borderRadius: "4px",
            border: "1px solid rgba(92, 92, 95, 1)",
            fontSize: "12px",
            fontWeight: "normal",
            padding: "0",
            margin: "0 8px 0 0",
          },
        }}
        disableOverlayClose
        disableCloseOnEsc
        locale={{
          next: "Next >",
        }}
        floaterProps={{
          disableAnimation: true,
          hideArrow: false,
        }}
      />
      {borderPosition && <CustomBorder position={borderPosition} />}
    </>
  );
};

export default NbtcDetailGuide;
