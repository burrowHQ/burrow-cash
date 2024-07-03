import styled from "styled-components";
import { twMerge } from "tailwind-merge";
import React from "react";
import Portal from "./portal";
import { BaseProps } from "../../interfaces/common";
import { CloseIcon } from "../Icons/Icons";
import { isMobileDevice } from "../../helpers/helpers";

type onClickHandler = (event: React.MouseEvent<HTMLElement>) => any;

interface Props extends BaseProps {
  isOpen: boolean;
  size?: string;
  style?: any;
  canScroll?: boolean;
  onClose: onClickHandler;
  onOutsideClick?: onClickHandler;
  title?: string;
}

const CustomModal = ({
  title,
  children,
  isOpen,
  onClose,
  onOutsideClick,
  size,
  style,
  canScroll,
  className,
}: Props) => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => {
      setShow(isOpen);
    }, 300);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }
  const isMobile = isMobileDevice();
  return (
    <Portal>
      <StyledWrapper className={twMerge("modal fade", show && "show", className)}>
        <div className="overlay" onClick={onOutsideClick} />
        <div className={twMerge("modal-dialog background-paper", size && `modal-${size}`)}>
          <div className="modal-content" style={style && !isMobile ? style : {}}>
            {title && (
              <div className="modal-header flex justify-center">
                {title}
                {onClose && (
                  <div onClick={onClose} style={{ cursor: "pointer" }}>
                    <CloseIcon />
                  </div>
                )}
              </div>
            )}
            <div className={twMerge("modal-body", canScroll && "modal-body-scroll")}>
              {children}
            </div>
          </div>
        </div>
      </StyledWrapper>
    </Portal>
  );
};

const StyledWrapper = styled.div`
  .custom-table {
    font-size: 14px;

    .custom-table-thead {
      .custom-table-th {
        color: #c0c4e9;
      }
    }
  }
`;

export default CustomModal;
