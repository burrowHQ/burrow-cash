import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import CustomModal from "../../components/CustomModal/CustomModal";
import Liquidations from "./liquidations";
import { CloseIcon } from "../../components/Icons/Icons";
import Records from "./records";
import { useUnreadLiquidation } from "../../hooks/hooks";
import Datasource from "../../data/datasource";
import { useAppSelector } from "../../redux/hooks";
import { isMemeCategory } from "../../redux/categorySelectors";

const ModalHistoryInfo = ({ isOpen, onClose, tab }) => {
  const [tabIndex, setTabIndex] = useState(tab);
  const [liquidationPage, setLiquidationPage] = useState(1);
  const { unreadLiquidation, fetchUnreadLiquidation } = useUnreadLiquidation({ liquidationPage });
  const isMeme = useAppSelector(isMemeCategory);
  useEffect(() => {
    if (tab !== undefined) {
      setTabIndex(tab);
    }
  }, [tab]);

  const handleTabChange = (i) => {
    setTabIndex(i);
    if (i === 0 && unreadLiquidation?.unreadIds?.length) {
      markReads(unreadLiquidation?.unreadIds).then();
    }
  };

  const markReads = async (unreadIds) => {
    try {
      await Datasource.shared.markLiquidationRead(unreadIds, isMeme);
      await fetchUnreadLiquidation();
    } catch (e) {
      console.error("markReadsErr", e);
    }
  };

  const handleModelClose = () => {
    if (unreadLiquidation?.unreadIds?.length) {
      markReads(unreadLiquidation?.unreadIds).then();
    }
    onClose();
  };

  let node;
  switch (tabIndex) {
    case 1:
      node = (
        <Liquidations isShow={tabIndex === 1 && isOpen} setLiquidationPage={setLiquidationPage} />
      );
      break;
    default:
      node = <Records isShow={tabIndex === 0 && isOpen} />;
      break;
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleModelClose}
      onOutsideClick={handleModelClose}
      className="modal-mobile-bottom modal-history"
      size="xl"
    >
      <div
        className="flex justify-between"
        style={{ background: "rgba(22, 22, 27, 0.8)", margin: "-1rem -1rem 0", padding: "0 1rem" }}
      >
        <div className="flex gap-4">
          <TabItem text="Records" onClick={() => handleTabChange(0)} active={tabIndex === 0} />
          <TabItem
            text="Liquidation"
            onClick={() => handleTabChange(1)}
            active={tabIndex === 1}
            unreadCount={unreadLiquidation?.count}
          />
        </div>
        <div onClick={handleModelClose} style={{ marginTop: 28, cursor: "pointer" }}>
          <CloseIcon />
        </div>
      </div>
      <div
        className="relative  modal-history-body"
        style={{ margin: "0 -1rem -1rem", padding: "8px 1rem 1rem" }}
      >
        {node}
      </div>
    </CustomModal>
  );
};

type Props = {
  text?: string;
  onClick?: () => any;
  active?: boolean;
  unreadCount?: number | string | undefined;
};
const TabItem = ({ text, onClick, active, unreadCount }: Props) => {
  return (
    <div
      className={twMerge(active && "border-b-2 border-primary", "cursor-pointer")}
      style={{ padding: "28px 0 14px" }}
      onClick={onClick}
    >
      <div className="relative">
        {text}
        {unreadCount ? (
          <span
            className="unread-count absolute rounded-full bg-pink-400 text-black"
            style={{ top: 2, right: -27 }}
          >
            {unreadCount}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default ModalHistoryInfo;
