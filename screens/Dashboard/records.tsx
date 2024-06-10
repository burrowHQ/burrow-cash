import { useEffect, useRef, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import CustomModal from "../../components/CustomModal/CustomModal";
import CustomTable from "../../components/CustomTable/CustomTable";
import Datasource from "../../data/datasource";
import { useAccountId, useToastMessage } from "../../hooks/hooks";
import { shrinkToken, TOKEN_FORMAT } from "../../store";
import { useAppSelector } from "../../redux/hooks";
import { getAssets } from "../../redux/assetsSelectors";
import { getDateString, maskMiddleString } from "../../helpers/helpers";
import { nearNativeTokens, nearTokenId, standardizeAsset } from "../../utils";
import {
  CopyIcon,
  ExternalLink,
  NearblocksIcon,
  PikespeakIcon,
} from "../../components/Icons/Icons";

const Records = ({ isShow }) => {
  const accountId = useAccountId();
  const { toastMessage, showToast } = useToastMessage();
  const assets = useAppSelector(getAssets);
  const [isLoading, setIsLoading] = useState(false);
  const [docs, setDocs] = useState<any>([]);
  const [pagination, setPagination] = useState<{
    page?: number;
    totalPages?: number;
    totalItems?: number;
  }>({
    page: 1,
  });

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
        const txidResponse = await Datasource.shared.getTxId(d.receipt_id);
        const txid = txidResponse?.receipts[0]?.originated_from_transaction_hash;

        return { ...d, txid };
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

  const handleTxClick = (txid, type) => {
    let url = "";
    if (type === "nearblocks") {
      url = `https://nearblocks.io/txns/${txid}`;
    } else if (type === "pikespeak") {
      url = `https://pikespeak.ai/transaction-viewer/${txid}`;
    }
    window.open(url, "_blank");
  };

  const columns = getColumns({ showToast, handleTxClick });
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

const getColumns = ({ showToast, handleTxClick }) => [
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
    maxSize: 180,
    cell: ({ originalData }) => {
      const [tooltipVisible, setTooltipVisible] = useState(false);
      const { timestamp } = originalData || {};
      const { receipt_id, txid } = originalData || {};
      const timeoutRef = useRef<NodeJS.Timeout | null>(null);
      const [copyIconVisible, setCopyIconVisible] = useState({});
      const [isHovered, setIsHovered] = useState(false);
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
            <ExternalLink color={isHovered ? "white" : "#C0C4E9"} />
            {tooltipVisible && (
              <div
                className="absolute right-0 top-4 bg-dark-250 border p-2 shadow-lg z-50 border border-dark-500 rounded-lg p-2"
                style={{ width: "212px" }}
              >
                <div
                  className="p-3 hover:bg-dark-1150 text-white rounded-md flex items-center mb-1"
                  onMouseEnter={() => handleCopyIconMouseEnter(1)}
                  onMouseLeave={() => handleCopyIconMouseLeave(1)}
                >
                  <NearblocksIcon />
                  <div
                    className="ml-2 hover:text-gray-300 hover:underline text-sm"
                    onClick={() => handleTxClick(txid, "nearblocks")}
                  >
                    {maskMiddleString(txid, 4, 34)}
                  </div>
                  {copyIconVisible[1] && (
                    <CopyToClipboard text={txid} onCopy={() => showToast("Copied")}>
                      <div className="cursor-pointer ml-2">
                        <CopyIcon />
                      </div>
                    </CopyToClipboard>
                  )}
                </div>
                <div
                  className="p-3 hover:bg-dark-1150 text-white rounded-md flex items-center"
                  onMouseEnter={() => handleCopyIconMouseEnter(2)}
                  onMouseLeave={() => handleCopyIconMouseLeave(2)}
                >
                  <PikespeakIcon />
                  <div
                    className="ml-2 hover:text-gray-300 hover:underline text-sm"
                    onClick={() => handleTxClick(txid, "pikespeak")}
                  >
                    {maskMiddleString(txid, 4, 34)}
                  </div>
                  {copyIconVisible[2] && (
                    <CopyToClipboard text={txid} onCopy={() => showToast("Copied")}>
                      <div className="cursor-pointer ml-2">
                        <CopyIcon />
                      </div>
                    </CopyToClipboard>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  // {
  //   header: () => <div className="text-right">View in NEAR explorer</div>,
  //   cell: ({ originalData }) => {
  //     const { receipt_id, txid } = originalData || {};
  //     if (!receipt_id) {
  //       return null;
  //     }
  //     return (
  //       <div className="flex items-center gap-2 justify-end">
  //         <div
  //           className="text-gray-300 text-right cursor-pointer hover:underline transform hover:opacity-80"
  //           onClick={() => handleTxClick(txid)}
  //         >
  //           {maskMiddleString(txid, 4, 34)}
  //         </div>

  //         <CopyToClipboard text={txid} onCopy={() => showToast("Copied")}>
  //           <div className="cursor-pointer">
  //             <CopyIcon />
  //           </div>
  //         </CopyToClipboard>
  //       </div>
  //     );
  //   },
  //   size: 180,
  // },
];

export default Records;
