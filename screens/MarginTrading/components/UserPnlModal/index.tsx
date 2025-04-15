import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { CloseIcon, ChevronDownIcon } from "../../../../components/Icons/IconsV2";
import DataSource from "../../../../data/datasource";
import { beautifyPrice } from "../../../../utils/beautyNumber";
import {
  MarginPnlSortingLeft,
  MarginPnlSortingLeftTop,
  MarginPnlSortingRight,
  MarginPnlSortingRightTop,
  MarginPnlSortTop,
  MarginPnlSortBottom,
} from "../Icon";
import { isMobileDevice } from "../../../../helpers/helpers";

interface UserPnlModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string;
}

interface PnlData {
  address: string;
  rank: number;
  position_count: number;
  pnl: string;
  roi: string;
  long_value: number;
  short_value: number;
  win_rate: number;
  start_time: number;
}

interface PnlResponse {
  data: {
    position_records: PnlData[];
    total: number;
  };
}

type SortOrder = "asc" | "desc";
type SortField = "total_pnl" | "position_value";

const PAGE_SIZE = 8;
const INITIAL_PAGE = 0;
const INITIAL_SORT_FIELD: SortField = "total_pnl";
const INITIAL_SORT_ORDER: SortOrder = "desc";

const formatPnl = (pnl: string) => {
  const num = parseFloat(pnl);
  const formatted = Math.abs(num).toFixed(2);
  return num >= 0 ? `+$${formatted}` : `-$${formatted}`;
};

const formatRoi = (roi: string) => {
  const num = parseFloat(roi) * 100;
  if (Number.isNaN(num)) {
    return "(0%)";
  }
  const sign = num >= 0 ? "+" : "-";
  return `(${sign}${Math.abs(num).toFixed(2)}%)`;
};

const formatAddress = (address: string) => {
  const parts = address.split(".");
  if (parts.length === 1) {
    if (address.length <= 1) return "***";
    if (address.length <= 6) {
      const halfLength = Math.floor(address.length / 2);
      return address.slice(0, halfLength) + "*".repeat(address.length - halfLength);
    }
    return `${address.slice(0, 6)}***`;
  }

  const account = parts[0];
  const domain = parts[1];

  if (account.length <= 1) return `***.${domain}`;
  if (account.length <= 6) {
    const halfLength = Math.floor(account.length / 2);
    return `${account.slice(0, halfLength)}${"*".repeat(account.length - halfLength)}.${domain}`;
  }
  return `${account.slice(0, 6)}***.${domain}`;
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
};

const SortIcon: React.FC<{
  isActive: boolean;
  isTop: boolean;
}> = ({ isActive, isTop }) => {
  const Icon = isTop ? MarginPnlSortTop : MarginPnlSortBottom;
  return (
    <Icon className={`${isTop ? "mb-[2px]" : ""} ${isActive ? "text-primary" : "text-gray-300"}`} />
  );
};

const PageButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    }`}
    disabled={disabled}
  >
    {children}
  </button>
);

const UserPnlModal: React.FC<UserPnlModalProps> = ({ isOpen, onClose, accountId }) => {
  const mobile = isMobileDevice();
  const [pnlData, setPnlData] = useState<PnlData[]>([]);
  const [topUserData, setTopUserData] = useState<PnlData | null>(null);
  const [currentPage, setCurrentPage] = useState(INITIAL_PAGE);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>(INITIAL_SORT_FIELD);
  const [sortOrder, setSortOrder] = useState<SortOrder>(INITIAL_SORT_ORDER);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const fetchPnlData = async (page: number) => {
    try {
      setIsLoading(true);
      const response = await DataSource.shared.getMarginTradingUserPnlList(
        accountId,
        page,
        PAGE_SIZE,
        sortField,
        sortOrder,
      );
      if (response?.data) {
        const records = response.data.position_records || [];
        const currentUserRecord = records.find((item) => item.address === accountId);
        if (currentUserRecord) {
          const otherRecords = records.filter((item) => item.address !== accountId);
          setPnlData([currentUserRecord, ...otherRecords]);
        } else {
          setPnlData(records);
        }
        setTotalPages(Math.ceil(response.data.total / PAGE_SIZE));
      }
    } catch (error) {
      console.error("Failed to fetch PNL data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPnlData(currentPage);
    }
  }, [isOpen, currentPage, sortField, sortOrder]);

  const handlePageChange = (page: number) => {
    if (page < 0 || page >= totalPages) return;
    setCurrentPage(page);
  };

  const handleClose = () => {
    setCurrentPage(INITIAL_PAGE);
    setSortField(INITIAL_SORT_FIELD);
    setSortOrder(INITIAL_SORT_ORDER);
    onClose();
  };

  const cardWidth = mobile ? "100vw" : "1025px";

  const toggleExpand = (address: string) => {
    setExpandedItem(expandedItem === address ? null : address);
  };

  const renderMobileItem = (item: PnlData) => {
    const isExpanded = expandedItem === item.address;
    const isCurrentUser = accountId === item.address;

    return (
      <div
        key={item.address}
        className={`rounded-lg mb-2.5 ${
          isCurrentUser ? "bg-primary bg-opacity-10" : "bg-gray-190"
        }`}
      >
        {!isExpanded ? (
          <div
            className="flex items-center p-4 cursor-pointer"
            onClick={() => toggleExpand(item.address)}
          >
            <div className="w-[40%] flex items-center gap-2">
              <div className="text-white">{item.rank}.</div>
              <div className="text-sm text-white truncate">
                {formatAddress(item.address)}
                {isCurrentUser && (
                  <span className="ml-2 text-[10px] bg-primary bg-opacity-10 text-primary px-0.5 py-[1px] rounded">
                    Mine
                  </span>
                )}
              </div>
            </div>
            <div className="w-[40%] flex items-center gap-2">
              <div className="flex items-center">
                <div className={parseFloat(item.pnl) >= 0 ? "text-primary" : "text-orange"}>
                  {formatPnl(item.pnl)}
                </div>
                <div className="text-gray-300 text-xs ml-2">{formatRoi(item.roi)}</div>
              </div>
            </div>
            <div className="w-[20%] flex justify-end">
              <ChevronDownIcon
                className={`text-white text-opacity-40 transition-transform ${
                  isExpanded ? "transform rotate-180" : ""
                }`}
              />
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="text-white">{item.rank}.</div>
                <div className="text-sm text-white">
                  {formatAddress(item.address)}
                  {isCurrentUser && (
                    <span className="ml-2 text-[10px] bg-primary bg-opacity-10 text-primary px-0.5 py-[1px] rounded">
                      Mine
                    </span>
                  )}
                </div>
              </div>
              <ChevronDownIcon
                className="text-white text-opacity-40 transition-transform transform rotate-180 cursor-pointer"
                onClick={() => toggleExpand(item.address)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-white text-sm">{item.position_count || "-"}</div>
                <div className="text-gray-300 text-xs mt-1">Position Count</div>
              </div>
              <div className="-ml-[62px]">
                <div
                  className={`text-sm ${
                    parseFloat(item.pnl) >= 0 ? "text-primary" : "text-orange"
                  }`}
                >
                  {formatPnl(item.pnl)} {formatRoi(item.roi)}
                </div>
                <div className="text-gray-300 text-xs mt-1">PnL/ROI</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-white text-sm">
                  ${beautifyPrice(item.long_value)} / ${beautifyPrice(item.short_value)}
                </div>
                <div className="text-gray-300 text-xs mt-1">Long/Short</div>
              </div>
              <div>
                <div className="text-primary text-sm">
                  {item.win_rate ? beautifyPrice(item.win_rate * 100) : "-"}%
                </div>
                <div className="text-gray-300 text-xs mt-1">Win Rate</div>
              </div>
              <div>
                <div className="text-white text-sm">{formatDate(item.start_time)}</div>
                <div className="text-gray-300 text-xs mt-1">Start Time</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={{
        overlay: {
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        },
        content: {
          outline: "none",
          ...(mobile
            ? {
                transform: "translateX(-50%)",
                top: "auto",
                bottom: "30px",
              }
            : {
                transform: "translate(-50%, -50%)",
              }),
        },
      }}
    >
      <div
        style={{ width: cardWidth, maxHeight: "76vh" }}
        className="outline-none bg-dark-100 border border-dark-50 overflow-auto rounded-2xl xsm:rounded-none"
      >
        <div className="flex justify-between mb-4 pt-[27px] px-7 xsm:mb-0 xsm:px-4 xsm:pt-6 xsm:pb-4">
          <span className="text-white text-[16px] gotham_bold">Users PnL</span>
          <CloseIcon
            className="cursor-pointer text-[#7E8A93] w-3 h-3 xsm:hidden"
            onClick={handleClose}
          />
        </div>
        {mobile ? (
          <div className="px-2.5">
            {pnlData.map(renderMobileItem)}
            <div className="flex justify-center items-center p-4">
              <PageButton onClick={() => handlePageChange(0)} disabled={currentPage === 0}>
                <MarginPnlSortingLeftTop />
              </PageButton>
              <PageButton
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
              >
                <MarginPnlSortingLeft className="ml-1" />
              </PageButton>
              <p className="text-gray-300 mx-3 text-xs">
                <span className={currentPage === 0 ? "text-white" : "text-gray-300"}>
                  {currentPage + 1}
                </span>
                /{totalPages}
              </p>
              <PageButton
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
              >
                <MarginPnlSortingRight className="mr-1" />
              </PageButton>
              <PageButton
                onClick={() => handlePageChange(totalPages - 1)}
                disabled={currentPage === totalPages - 1}
              >
                <MarginPnlSortingRightTop />
              </PageButton>
            </div>
          </div>
        ) : (
          <div>
            <table className="w-full">
              <thead>
                <tr className="text-gray-300 text-[14px] border-b border-[#303037]">
                  {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                  <th className="text-left pl-[20px] pr-[10px] py-[12px]" />
                  <th className="text-left pl-[20px] pr-[10px] py-[12px]">User</th>
                  <th className="text-left px-[10px] py-[12px]">Position Count</th>
                  <th>
                    <div
                      className="flex items-center text-left px-[10px] py-[12px] cursor-pointer"
                      onClick={() => handleSort("total_pnl")}
                    >
                      PnL/ROI
                      <div className="inline-flex flex-col ml-1">
                        <SortIcon
                          isActive={sortField === "total_pnl" && sortOrder === "asc"}
                          isTop
                        />
                        <SortIcon
                          isActive={sortField === "total_pnl" && sortOrder === "desc"}
                          isTop={false}
                        />
                      </div>
                    </div>
                  </th>
                  <th className="text-left px-[10px] py-[12px]">Long/Short</th>
                  <th className="text-left px-[10px] py-[12px]">Win Rate</th>
                  <th className="text-left px-[10px] py-[12px] pr-[16px]">Start Time</th>
                </tr>
              </thead>
              <div className="h-[8px]" />
              <tbody className="border-b border-[#303037]">
                {pnlData.map((item) => (
                  <tr
                    key={item.address}
                    className={`pt-[8px] ${
                      accountId === item.address ? "bg-primary bg-opacity-10" : ""
                    }`}
                  >
                    <td
                      className={`pl-[20px] pr-[10px] py-[12px] text-sm ${
                        accountId === item.address ? "text-primary" : "text-white"
                      }`}
                    >
                      {item.rank}
                    </td>
                    <td
                      className={`px-[10px] py-[12px] text-sm ${
                        accountId === item.address ? "text-white" : "text-gray-300"
                      }`}
                    >
                      {formatAddress(item.address)}
                      {accountId === item.address && (
                        <span className="ml-2 text-[10px] bg-primary bg-opacity-10 text-primary px-0.5 py-[1px] rounded">
                          Mine
                        </span>
                      )}
                    </td>
                    <td className="px-[10px] py-[12px] text-white text-sm">
                      {item.position_count || "-"}
                    </td>
                    <td className="px-[10px] py-[12px] text-white text-sm">
                      <div className="flex items-center text-[16px]">
                        <div className={parseFloat(item.pnl) >= 0 ? "text-primary" : "text-orange"}>
                          {formatPnl(item.pnl)}
                        </div>
                        <div
                          className={`${
                            accountId === item.address ? "text-white" : "text-gray-300"
                          } text-xs ml-2`}
                        >
                          {formatRoi(item.roi)}
                        </div>
                      </div>
                    </td>
                    <td className="px-[10px] py-[12px] text-white text-sm">
                      ${beautifyPrice(item.long_value)} / ${beautifyPrice(item.short_value)}
                    </td>
                    <td className="px-[10px] py-[12px] text-primary text-sm">
                      {item.win_rate ? beautifyPrice(item.win_rate * 100) : "-"}%
                    </td>
                    <td
                      className={`px-[10px] py-[12px] pr-[16px] text-gray-300 text-sm ${
                        accountId === item.address ? "text-white" : "text-gray-300"
                      }`}
                    >
                      {formatDate(item.start_time)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end items-center py-3 pr-[180px]">
              <PageButton onClick={() => handlePageChange(0)} disabled={currentPage === 0}>
                <MarginPnlSortingLeftTop />
              </PageButton>
              <PageButton
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
              >
                <MarginPnlSortingLeft className="ml-1" />
              </PageButton>
              <p className="text-gray-300 mx-3 text-xs">
                <span className={currentPage === 0 ? "text-white" : "text-gray-300"}>
                  {currentPage + 1}
                </span>
                /{totalPages}
              </p>
              <PageButton
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
              >
                <MarginPnlSortingRight className="mr-1" />
              </PageButton>
              <PageButton
                onClick={() => handlePageChange(totalPages - 1)}
                disabled={currentPage === totalPages - 1}
              >
                <MarginPnlSortingRightTop />
              </PageButton>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UserPnlModal;
