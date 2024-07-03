import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper.min.css";
import SwiperCore, { Autoplay } from "swiper";
import React, { useEffect, useMemo, useState, memo } from "react";
import { twMerge } from "tailwind-merge";
import SupplyCarousel from "./components/SupplyCarousel";
import StakeCarousel from "./components/StakeCarousel";
import DeltaCarouse from "./components/DeltaCarouse";
import { isMobileDevice } from "../../helpers/helpers";

SwiperCore.use([Autoplay]);
const Popup = ({ className }) => {
  const INCENTIVE_POPUP_STATUS = localStorage.getItem("INCENTIVE_POPUP_STATUS");
  const [show, setShow] = useState<boolean>(false);

  useEffect(() => {
    if (INCENTIVE_POPUP_STATUS === "6") {
      setShow(false);
    } else {
      setShow(true);
    }
  }, [INCENTIVE_POPUP_STATUS]);

  function closePopup() {
    setShow(false);
    localStorage.setItem("INCENTIVE_POPUP_STATUS", "6");
  }
  if (!show) return null;
  return (
    <div className="flex item-center justify-center">
      <div
        className={twMerge(
          className || "",
          "lg:fixed lg:bottom-3 lg:right-0 z-50 xsm:relative cursor-pointer",
        )}
        style={{ width: "416px" }}
      >
        <div className="flex items-center justify-center">
          <Swiper
            spaceBetween={30}
            centeredSlides
            autoHeight={false}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            loop
          >
            <SwiperSlide>
              <>
                <CloseButton
                  className="absolute cursor-pointer top-4 right-10 xsm:right-8  z-50 xsm:top-3"
                  onClick={closePopup}
                />
                <SupplyCarousel />
              </>
            </SwiperSlide>
            <SwiperSlide>
              <CloseButton
                className="absolute cursor-pointer top-3 right-6 xsm:right-4 z-50"
                onClick={closePopup}
              />
              <div className={`${isMobileDevice() ? "mt-0" : "mt-8"} relative`}>
                <DeltaCarouse />
                <div
                  className="w-40 h-10 bg-transparent absolute bottom-10 right-10"
                  onClick={() => {
                    window.open("https://www.deltatrade.ai/activity/home");
                  }}
                />
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <CloseButton
                className="absolute cursor-pointer top-8 right-8 xsm:right-4 z-50"
                onClick={closePopup}
              />
              <div className={`${isMobileDevice() ? "mt-0" : "mt-8"} relative`}>
                <StakeCarousel />
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
    </div>
  );
};
export default Popup;

function CloseButton(props: any) {
  return (
    <svg
      {...props}
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="13" cy="13" r="12.5" fill="#14162B" stroke="#C0C4E9" />
      <path
        d="M14.609 12.9992L18.3261 9.2821C18.6055 9.00259 18.6532 8.59708 18.4327 8.37664L17.6222 7.56617C17.4017 7.34564 16.9967 7.39402 16.7167 7.67333L13 11.3903L9.283 7.67343C9.0035 7.39364 8.59799 7.34564 8.37745 7.56645L7.56699 8.37701C7.34654 8.59718 7.39427 9.00269 7.67414 9.28219L11.3912 12.9992L7.67414 16.7165C7.39473 16.9958 7.34636 17.401 7.56699 17.6216L8.37745 18.4321C8.59799 18.6527 9.0035 18.6049 9.283 18.3254L13.0002 14.6082L16.7168 18.3249C16.9968 18.6049 17.4018 18.6527 17.6223 18.4321L18.4328 17.6216C18.6532 17.401 18.6055 16.9958 18.3262 16.7161L14.609 12.9992Z"
        fill="#C0C4E9"
      />
    </svg>
  );
}
