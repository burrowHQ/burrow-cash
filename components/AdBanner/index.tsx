import React, { useState, useEffect, useRef } from "react";
import Modal from "react-modal";
import { AdBannerCloseIcon } from "./icon";
import { isMobileDevice } from "../../helpers/helpers";

const AdBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = isMobileDevice();
  const videoUrl = "/video/RHEAVideo.mp4";
  const adVersion = "3";

  useEffect(() => {
    const checkAdVisibility = () => {
      const lastClosedDate = localStorage.getItem("adBannerLastClosedDate");
      const today = new Date().toDateString();

      if (!lastClosedDate || lastClosedDate !== today) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    checkAdVisibility();
  }, []);

  useEffect(() => {
    if (videoRef.current && isVisible) {
      const playVideo = async () => {
        try {
          await videoRef.current?.play();
        } catch (error) {
          console.error("Video playback failed:", error);
        }
      };
      playVideo();
    }
  }, [isVisible]);

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsVisible(false);
    localStorage.setItem("adBannerLastClosedDate", new Date().toDateString());
  };

  const handleVideoLoadStart = () => {
    setIsLoading(true);
  };

  const handleVideoCanPlay = () => {
    setIsLoading(false);
  };

  if (!isVisible || !videoUrl || !adVersion || isMobile) return null;

  return (
    <Modal
      isOpen={isVisible}
      onRequestClose={handleClose}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      style={{
        overlay: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          zIndex: 2000,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        },
        content: {
          position: "relative",
          top: "auto",
          left: "auto",
          right: "auto",
          bottom: "auto",
          transform: "none",
          padding: 0,
          border: "none",
          background: "transparent",
          maxWidth: isMobile ? "100%" : "800px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2001,
        },
      }}
    >
      <div className="w-full h-full flex items-center justify-center xsm:mx-4">
        <div className="relative w-full aspect-video overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
              <div className="w-12 h-12 border-4 border-[#00F7A5] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onLoadStart={handleVideoLoadStart}
            onCanPlay={handleVideoCanPlay}
            playsInline
            muted={true}
            controls={false}
            preload="auto"
            loop
            autoPlay
          />
          <div
            onClick={handleClose}
            className="absolute top-6 right-6 cursor-pointer z-50 flex items-center justify-center w-8 h-8 rounded-full bg-black bg-opacity-50 hover:bg-opacity-80 transition"
          >
            <AdBannerCloseIcon />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AdBanner;
