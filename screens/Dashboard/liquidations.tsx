import { useEffect, useState } from "react";
import CustomTable from "../../components/CustomTable/CustomTable";
import { useAccountId, useUnreadLiquidation } from "../../hooks/hooks";
import { shrinkToken, TOKEN_FORMAT } from "../../store";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { getAssets } from "../../redux/assetsSelectors";
import { formatTokenValueWithMilify, getDateString } from "../../helpers/helpers";
import { getLiquidations } from "../../api/get-liquidations";
import { setUnreadLiquidation } from "../../redux/appSlice";

const Liquidations = ({ isShow }) => {
  const dispatch = useAppDispatch();
  const accountId = useAccountId();
  const assets = useAppSelector(getAssets);
  const [isLoading, setIsLoading] = useState(false);
  const [docs, setDocs] = useState([]);
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
      const { liquidationData, unreadIds } = await getLiquidations(accountId, page, 10, assets);
      let newUnreadCount = 0;
      liquidationData?.record_list?.forEach((d) => {
        if (d.isRead === false) newUnreadCount++;
      });
      dispatch(
        setUnreadLiquidation({
          count: liquidationData?.unread,
          unreadIds,
        }),
      );
      setDocs(liquidationData?.record_list);
      setPagination((d) => {
        return {
          ...d,
          totalPages: liquidationData?.total_page,
          totalItems: liquidationData?.total_size,
        };
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <CustomTable
        data={docs}
        columns={columns}
        pagination={pagination}
        setPagination={setPagination}
        isLoading={isLoading}
      />
    </div>
  );
};

const columns = [
  {
    header: "Time",
    cell: ({ originalData }) => {
      const { createdAt } = originalData || {};
      return <div className="text-gray-300 truncate">{getDateString(createdAt * 1000)}</div>;
    },
  },
  {
    header: () => (
      <div style={{ whiteSpace: "normal" }}>
        Collateral<div>Type</div>
      </div>
    ),
    cell: ({ originalData }) => {
      const { LiquidatedAssets } = originalData || {};
      return <div>{LiquidatedAssets?.[0]?.data?.isLpToken ? "LP token" : "Standard Token"}</div>;
    },
  },
  {
    header: () => (
      <div style={{ whiteSpace: "normal" }}>
        Health Factor<div>before Liquidate</div>
      </div>
    ),
    cell: ({ originalData }) => {
      const { healthFactor_before, liquidation_type } = originalData || {};
      if (liquidation_type === "ForceClose") {
        return "-";
      }
      return <div>{(Number(healthFactor_before) * 100).toFixed(2)}%</div>;
    },
  },
  {
    header: () => (
      <div style={{ whiteSpace: "normal" }}>
        Repaid Assets <div>Amount</div>
      </div>
    ),
    cell: ({ originalData }) => {
      const { RepaidAssets } = originalData || {};
      if (!RepaidAssets?.length) {
        return "-";
      }

      const node = RepaidAssets?.map((d, i) => {
        const isLast = RepaidAssets.length === i + 1;
        const { metadata, config } = d.data || {};
        const { extra_decimals } = config || {};
        const tokenSymbol = metadata?.symbol || d.token_id;

        const tokenAmount = Number(
          shrinkToken(d.amount, (metadata?.decimals || 0) + (extra_decimals || 0)),
        );

        return (
          <div
            key={d.token_id}
            className="whitespace-normal"
            title={`${tokenAmount.toLocaleString(undefined, TOKEN_FORMAT)} ${tokenSymbol}`}
          >
            {formatTokenValueWithMilify(tokenAmount, 4)} {tokenSymbol}
          </div>
        );
      });

      return <div>{node}</div>;
    },
  },
  {
    header: () => <div style={{ whiteSpace: "normal" }}>Liquidated Assets</div>,
    cell: ({ originalData }) => {
      const { LiquidatedAssets } = originalData || {};
      if (!LiquidatedAssets?.length) {
        return "-";
      }

      const node = LiquidatedAssets?.map((d) => {
        const { metadata, config } = d.data || {};
        const { extra_decimals } = config || {};
        let tokenSymbol = "";
        if (metadata?.tokens?.length) {
          metadata?.tokens?.forEach((t, i) => {
            const { symbol, token_id } = t.metadata || {};
            tokenSymbol += `${i !== 0 ? "-" : ""}${symbol || token_id}`;
          });
        }
        if (!tokenSymbol) {
          tokenSymbol = metadata?.symbol || d.token_id;
        }

        const tokenAmount = Number(
          shrinkToken(d.amount, (metadata?.decimals || 0) + (extra_decimals || 0)),
        );

        return (
          <div
            key={d.token_id}
            className="whitespace-normal"
            title={`${tokenAmount.toLocaleString(undefined, TOKEN_FORMAT)} ${tokenSymbol}`}
          >
            {formatTokenValueWithMilify(tokenAmount, 4)} {tokenSymbol}
          </div>
        );
      });

      return <div>{node}</div>;
    },
  },
  {
    header: () => (
      <div style={{ whiteSpace: "normal", textAlign: "right" }}>
        Health Factor<div>after Liquidate</div>
      </div>
    ),
    cell: ({ originalData }) => {
      const { healthFactor_after } = originalData || {};
      return (
        <div style={{ textAlign: "right" }}>{(Number(healthFactor_after) * 100).toFixed(2)}%</div>
      );
    },
  },
];

export default Liquidations;
