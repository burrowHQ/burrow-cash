import React, { useState, useEffect, useRef } from "react";
import { AdBannerCloseIcon } from "./icon";
import { isMobileDevice } from "../../helpers/helpers";

const AdBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = isMobileDevice();
  const videoUrl = isMobile
    ? "https://img.rhea.finance/images/RHEAVideoMobile.mp4"
    : "https://img.rhea.finance/images/RHEAVideo.mp4";
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

  if (!isVisible || !videoUrl || !adVersion) return null;

  return (
    <div className="fixed inset-0 bg-[#16161B] bg-opacity-80 backdrop-blur-[14px] z-[99999] flex justify-center items-center">
      <div className="relative w-full max-w-[800px] mx-4">
        <div className="relative w-full aspect-video overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            playsInline
            muted={true}
            controls={false}
            preload="auto"
            loop
            autoPlay
          />
          <div
            onClick={handleClose}
            className="absolute top-6 right-6 xsm:right-4 xsm:top-4 cursor-pointer flex justify-center items-center w-8 h-8 rounded-full bg-black bg-opacity-50 hover:bg-opacity-80 transition z-50"
          >
            <AdBannerCloseIcon />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;
