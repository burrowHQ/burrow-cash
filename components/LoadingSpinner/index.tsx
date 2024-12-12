import React from "react";
import styled from "styled-components";

export const LoadingSpinner = () => {
  return (
    <Container className="loading-spinner">
      <LdsRing className="ldsring">
        <div className="_spinner">
          <div />
          <div />
          <div />
        </div>
      </LdsRing>
    </Container>
  );
};

export const LoadingCircle = (props: any) => {
  return (
    <svg
      {...props}
      width="30"
      style={{
        zIndex: 299,
      }}
      height="30"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0ZM10 3C8.14348 3 6.36301 3.7375 5.05025 5.05025C3.7375 6.36301 3 8.14348 3 10C3 11.8565 3.7375 13.637 5.05025 14.9497C6.36301 16.2625 8.14348 17 10 17C11.8565 17 13.637 16.2625 14.9497 14.9497C16.2625 13.637 17 11.8565 17 10C17 8.14348 16.2625 6.36301 14.9497 5.05025C13.637 3.7375 11.8565 3 10 3Z"
        fill="#7E8A93"
        fillOpacity="0.2"
      />
      <path
        d="M17.0709 17.071C20.9759 13.166 20.9759 6.83399 17.0709 2.92899C13.1659 -0.976006 6.83388 -0.976006 2.92888 2.92899C2.65564 3.2119 2.50445 3.5908 2.50787 3.9841C2.51129 4.37739 2.66904 4.75361 2.94715 5.03172C3.22526 5.30983 3.60148 5.46759 3.99478 5.47101C4.38807 5.47442 4.76698 5.32323 5.04988 5.04999C5.69992 4.39995 6.47164 3.88431 7.32096 3.53251C8.17028 3.18071 9.08058 2.99964 9.99988 2.99964C10.9192 2.99964 11.8295 3.18071 12.6788 3.53251C13.5281 3.88431 14.2998 4.39995 14.9499 5.04999C15.5999 5.70004 16.1156 6.47175 16.4674 7.32107C16.8192 8.1704 17.0002 9.0807 17.0002 10C17.0002 10.9193 16.8192 11.8296 16.4674 12.6789C16.1156 13.5282 15.5999 14.3 14.9499 14.95C14.6766 15.2329 14.5255 15.6118 14.5289 16.0051C14.5323 16.3984 14.69 16.7746 14.9682 17.0527C15.2463 17.3308 15.6225 17.4886 16.0158 17.492C16.4091 17.4954 16.788 17.3442 17.0709 17.071Z"
        fill="#D2FF3A"
      />
    </svg>
  );
};

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LdsRing = styled.div`
  display: inline-block;
  position: relative;
  width: 40px;
  height: 40px;

  > div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: 32px;
    height: 32px;
    margin: 4px;
    border: 4px solid #fff;
    border-radius: 50%;
    animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: #fff transparent transparent transparent;

    &:nth-child(1) {
      animation-delay: -0.45s;
    }

    &:nth-child(2) {
      animation-delay: -0.3s;
    }

    &:nth-child(3) {
      animation-delay: -0.15s;
    }
  }

  @keyframes lds-ring {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;
