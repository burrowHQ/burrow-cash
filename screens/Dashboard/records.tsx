import { useEffect, useRef, useState } from "react";
import CustomTable from "../../components/CustomTable/CustomTable";
import Datasource from "../../data/datasource";
import { useAccountId, useToastMessage } from "../../hooks/hooks";
import { shrinkToken, TOKEN_FORMAT } from "../../store";
import { useAppSelector } from "../../redux/hooks";
import { getAssets, getAssetsMEME } from "../../redux/assetsSelectors";
import { getDateString } from "../../helpers/helpers";
import { nearNativeTokens, nearTokenId, standardizeAsset } from "../../utils";
import {
  ExternalLink,
  NearblocksIcon,
  PikespeakIcon,
  TxLeftArrow,
} from "../../components/Icons/Icons";

const Records = ({ isShow }) => {
  const accountId = useAccountId();
  const { dashBoardActiveTab } = useAppSelector((state) => state.category);
  const { toastMessage, showToast } = useToastMessage();
  const assets = useAppSelector(dashBoardActiveTab == "main" ? getAssets : getAssetsMEME);
  const [isLoading, setIsLoading] = useState(false);
  const [docs, setDocs] = useState<any>([]);
  const [pagination, setPagination] = useState<{
    page?: number;
    totalPages?: number;
    totalItems?: number;
  }>({
    page: 1,
  });
  const [txLoadingStates, setTxLoadingStates] = useState({});

  useEffect(() => {
    if (isShow) {
      fetchData({
        page: pagination?.page,
      }).then();
    }
  }, [isShow, pagination?.page]);

  const fetchData = async ({ page }) => {
    try {
      setIsLoading(true);
      const response = await Datasource.shared.getRecords(accountId, page, 10);
      const list = response?.record_list?.map(async (d) => {
        let tokenId = d.token_id;
        if (nearNativeTokens.includes(tokenId)) {
          tokenId = nearTokenId;
        }
        d.data = assets?.data[tokenId];
        const cloned = { ...d.data };
        cloned.metadata = standardizeAsset({ ...cloned.metadata });
        d.data = cloned;

        return { ...d };
      });
      const resolvedList = await Promise.all(list);
      setDocs(resolvedList);
      setPagination((d) => {
        return {
          ...d,
          totalPages: response?.total_page,
          totalItems: response?.total_size,
        };
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTxClick = async (receipt_id, event, type) => {
    const uniqueId = `${receipt_id}_${event}`;
    setTxLoadingStates((prevState) => ({ ...prevState, [uniqueId]: true }));
    try {
      const txidResponse = await Datasource.shared.getTxId(receipt_id).catch(() => ({}));
      const txid = txidResponse?.receipts?.[0]?.originated_from_transaction_hash;
      let url = "";
      if (txid) {
        if (type === "nearblocks") {
          url = `https://nearblocks.io/txns/${txid}`;
        } else if (type === "pikespeak") {
          url = `https://pikespeak.ai/transaction-viewer/${txid}`;
        }
        window.open(url, "_blank");
      } else {
        showToast("Transaction ID not found.");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch transaction ID.");
    } finally {
      setTxLoadingStates((prevState) => ({ ...prevState, [uniqueId]: false }));
    }
  };

  const columns = getColumns({ showToast, handleTxClick, txLoadingStates });
  return (
    <CustomTable
      data={docs}
      columns={columns}
      pagination={pagination}
      setPagination={setPagination}
      isLoading={isLoading}
    />
  );
};

const getColumns = ({ showToast, handleTxClick, txLoadingStates }) => [
  {
    header: "Assets",
    minSize: 220,
    cell: ({ originalData }) => {
      const { data } = originalData || {};
      const { metadata } = data || {};
      const { icon, tokens, symbol } = metadata || {};
      let iconImg;
      let symbolNode = symbol;
      if (icon) {
        iconImg = (
          <img
            src={icon}
            width={26}
            height={26}
            alt="token"
            className="rounded-full w-[26px] h-[26px]"
            style={{ marginRight: 6, marginLeft: 3 }}
          />
        );
      } else if (tokens?.length) {
        symbolNode = "";
        iconImg = (
          <div
            className="grid"
            style={{ marginRight: 2, gridTemplateColumns: "15px 12px", paddingLeft: 5 }}
          >
            {tokens?.map((d, i) => {
              const isLast = i === tokens.length - 1;
              symbolNode += `${d.metadata.symbol}${!isLast ? "-" : ""}`;
              return (
                <img
                  key={d.metadata.symbol}
                  src={d.metadata?.icon}
                  width={20}
                  height={20}
                  alt="token"
                  className="rounded-full w-[20px] h-[20px] -m-1"
                  style={{ maxWidth: "none" }}
                />
              );
            })}
          </div>
        );
      }

      return (
        <div className="flex">
          <div style={{ flex: "0 0 26px" }} className="mr-2">
            {iconImg}
          </div>
          <div
            title={symbolNode}
            style={{
              whiteSpace: "normal",
            }}
          >
            {symbolNode}
          </div>
        </div>
      );
    },
  },
  {
    header: "Type",
    accessorKey: "event",
    maxSize: 180,
  },
  {
    header: "Amount",
    maxSize: 180,
    cell: ({ originalData }) => {
      const { amount, data } = originalData || {};
      const { metadata, config } = data || {};
      const { extra_decimals } = config || {};
      const tokenAmount = Number(
        shrinkToken(amount, (metadata?.decimals || 0) + (extra_decimals || 0)),
      );
      return <div>{tokenAmount.toLocaleString(undefined, TOKEN_FORMAT)}</div>;
    },
  },
  {
    header: "Time",
    cell: ({ originalData }) => (
      <TimeConponent
        originalData={originalData}
        txLoadingStates={txLoadingStates}
        handleTxClick={handleTxClick}
      />
    ),
  },
];
function TimeConponent({ originalData, txLoadingStates, handleTxClick }) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const { timestamp } = originalData || {};
  const { receipt_id } = originalData || {};
  const { event } = originalData || {};
  const uniqueId = `${receipt_id}_${event}`;
  const isRowLoading = txLoadingStates[uniqueId];
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [copyIconVisible, setCopyIconVisible] = useState({});
  const [isHovered, setIsHovered] = useState(false);
  const [isArrowVisible, setIsArrowVisible] = useState({});
  const handleMouseEnter = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    setTooltipVisible(true);
    setIsHovered(true);
  };
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setTooltipVisible(false);
      setCopyIconVisible({});
      setIsHovered(false);
    }, 100);
  };
  const handleCopyIconMouseEnter = (id) => {
    setCopyIconVisible((prev) => ({ ...prev, [id]: true }));
  };
  const handleCopyIconMouseLeave = (id) => {
    setCopyIconVisible((prev) => ({ ...prev, [id]: false }));
  };
  const handleArrowMouseEnter = (id) => {
    setIsArrowVisible((prev) => ({ ...prev, [id]: true }));
  };
  const handleArrowMouseLeave = (id) => {
    setIsArrowVisible((prev) => ({ ...prev, [id]: false }));
  };
  if (!receipt_id) {
    return null;
  }
  return (
    <div className="text-gray-300 flex items-center">
      {getDateString(timestamp / 1000000)}
      <div
        className="ml-2 cursor-pointer relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center w-5 h-5">
          {isRowLoading ? (
            <span className="loading-dots" />
          ) : (
            <ExternalLink color={isHovered ? "white" : "#C0C4E9"} />
          )}
        </div>
        {tooltipVisible && (
          <div
            className="absolute right-0 top-6 bg-dark-250 border p-2 shadow-lg z-50 border-dark-500 rounded-lg"
            style={{ width: "180px" }}
          >
            <div
              className="p-3 hover:bg-dark-1150 text-white rounded-md flex items-center mb-1"
              onClick={() => handleTxClick(receipt_id, event, "nearblocks")}
              onMouseEnter={() => {
                handleArrowMouseEnter(1);
                handleCopyIconMouseEnter(1);
              }}
              onMouseLeave={() => {
                handleArrowMouseLeave(1);
                handleCopyIconMouseLeave(1);
              }}
            >
              <NearblocksIcon />
              <div className="ml-2 text-sm">nearblocks</div>
              {isArrowVisible[1] && (
                <div className="ml-3">
                  <TxLeftArrow />
                </div>
              )}
              {/* {copyIconVisible[1] && (
                    <CopyToClipboard text={txid} onCopy={() => showToast("Copied")}>
                      <div className="cursor-pointer ml-2">
                        <CopyIcon />
                      </div>
                    </CopyToClipboard>
                  )} */}
            </div>
            <div
              className="p-3 hover:bg-dark-1150 text-white rounded-md flex items-center"
              onClick={() => handleTxClick(receipt_id, event, "pikespeak")}
              onMouseEnter={() => {
                handleArrowMouseEnter(2);
                handleCopyIconMouseEnter(1);
              }}
              onMouseLeave={() => {
                handleArrowMouseLeave(2);
                handleCopyIconMouseLeave(1);
              }}
            >
              <PikespeakIcon />
              <div className="ml-2 text-sm">Pikespeak...</div>
              {isArrowVisible[2] && (
                <div className="ml-3">
                  <TxLeftArrow />
                </div>
              )}
              {/* {copyIconVisible[2] && (
                    <CopyToClipboard text={txid} onCopy={() => showToast("Copied")}>
                      <div className="cursor-pointer ml-2">
                        <CopyIcon />
                      </div>
                    </CopyToClipboard>
                  )} */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Records;
