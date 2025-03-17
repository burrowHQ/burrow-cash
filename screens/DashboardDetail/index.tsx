import styled from "styled-components";
import { useState } from "react";
import { ContentBox } from "../../components/ContentBox/ContentBox";
import LayoutContainer from "../../components/LayoutContainer/LayoutContainer";
import SupplyTokenSvg from "../../public/svg/Group 24791.svg";
import BorrowTokenSvg from "../../public/svg/Group 24677.svg";
import { useAccountId, usePortfolioAssets } from "../../hooks/hooks";
import DashboardReward from "./dashboardReward";
import CustomTable from "../../components/CustomTable/CustomTable";
import { formatTokenValue, isMobileDevice } from "../../helpers/helpers";
import assets from "../../components/Assets";
import DashboardOverview from "./dashboardOverview";
import SupplyBorrowListMobile from "./supplyBorrowListMobile";
import { AdjustButton, WithdrawButton, RepayButton, MarketButton } from "./supplyBorrowButtons";
import { hiddenAssets } from "../../utils/config";
import { APYCell } from "../Market/APYCell";
import { beautifyPrice } from "../../utils/beautyNumber";
import { getPageTypeFromUrl } from "../../utils/commonUtils";
import Breadcrumb from "../../components/common/breadcrumb";
import UnLoginUi from "../../components/Dashboard/unLoginBox";

const Index = () => {
  const accountId = useAccountId();
  const pageType = getPageTypeFromUrl();
  const isMemeCategory = pageType == "meme";
  const [suppliedRows, borrowedRows, totalSuppliedUSD, totalBorrowedUSD, , borrowedAll] =
    usePortfolioAssets(isMemeCategory);
  const isMobile = isMobileDevice();
  let overviewNode;
  if (accountId) {
    overviewNode = (
      <DashboardOverview
        suppliedRows={suppliedRows}
        borrowedRows={borrowedRows}
        memeCategory={isMemeCategory}
      />
    );
  } else {
    overviewNode = <UnLoginUi wraperClass="mb-4" />;
  }
  let supplyBorrowNode;
  if (isMobile) {
    supplyBorrowNode = (
      <SupplyBorrowListMobile suppliedRows={suppliedRows} borrowedRows={borrowedAll} />
    );
  } else {
    supplyBorrowNode = (
      <StyledSupplyBorrow className="gap-6 lg:flex mb-10">
        <YourSupplied suppliedRows={suppliedRows} total={totalSuppliedUSD as number} />
        <YourBorrowed
          borrowedRows={borrowedAll}
          accountId={accountId}
          total={totalBorrowedUSD as number}
        />
      </StyledSupplyBorrow>
    );
  }

  return (
    <div>
      <LayoutContainer>
        <Breadcrumb path="/dashboard" title="Dashboard" />
        {overviewNode}
        <div style={{ minHeight: isMobile ? 300 : 600 }}>{supplyBorrowNode}</div>
      </LayoutContainer>
    </div>
  );
};

const StyledSupplyBorrow = styled.div`
  > div {
    flex: 1;
  }
`;

const yourSuppliedColumns = (memeCategory?: boolean) => [
  {
    header: "Assets",
    size: 120,
    cell: ({ originalData }) => {
      const { symbol: standardizeSymbol, metadata, icon } = originalData || {};
      const { tokens, symbol } = metadata || {};
      let iconImg;
      let symbolNode = standardizeSymbol || symbol;
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
        <div className="flex gap-2 items-center">
          {iconImg}
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
    header: "APY",
    size: 130,
    cell: ({ originalData }) => {
      return (
        <APYCell
          rewards={originalData?.depositRewards}
          baseAPY={originalData?.apy}
          page="deposit"
          tokenId={originalData?.tokenId}
          onlyMarket
          memeCategory={!!memeCategory}
        />
      );
    },
  },
  {
    header: "Daily Rewards",
    cell: ({ originalData }) => {
      if (
        !originalData?.rewards?.length &&
        +(originalData?.supplyReward?.supplyDailyAmount || 0) === 0
      ) {
        return "-";
      }
      return (
        <DashboardReward
          rewardList={originalData?.rewards}
          supplyReward={originalData?.supplyReward}
        />
      );
    },
  },
  {
    header: "Collateral",
    cell: ({ originalData }) => {
      return (
        <>
          <div title={originalData?.collateral ? formatTokenValue(originalData?.collateral) : "-"}>
            {beautifyPrice(originalData.collateral)}
          </div>
          <div className="h6 text-gray-300">
            {originalData?.collateral
              ? beautifyPrice(originalData.collateral * originalData.price, true)
              : ""}
          </div>
        </>
      );
    },
  },
  {
    header: "Supplied",
    cell: ({ originalData }) => {
      return (
        <>
          <div title={formatTokenValue(originalData.supplied)}>
            {beautifyPrice(originalData.supplied)}
          </div>
          <div className="h6 text-gray-300">
            {beautifyPrice(originalData.supplied * originalData.price, true)}
          </div>
        </>
      );
    },
  },
];

type TableRowSelect = {
  data: {
    tokenId: string | null | undefined;
    canUseAsCollateral: boolean | undefined;
    shadow_id?: string | null | undefined;
  } | null;
  index: number | null | undefined;
};

const YourSupplied = ({
  suppliedRows,
  memeCategory,
  total,
}: {
  suppliedRows: any;
  memeCategory?: boolean;
  total: number;
}) => {
  const [selected, setSelected] = useState<TableRowSelect>({ data: null, index: null });
  const { canUseAsCollateral, tokenId } = selected?.data || {};

  const handleRowSelect = (rowData, rowIndex) => {
    setSelected({ data: rowData, index: rowIndex });
  };

  return (
    <ContentBox style={{ paddingBottom: 0, overflow: "hidden" }} className="mb-4 lg:mb-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="absolute" style={{ left: 0, top: 0 }}>
            {memeCategory ? assets.svg.suppliedMemeBg : assets.svg.suppliedBg}
          </div>
          <SupplyTokenSvg className="mr-10" />
          <div className="h3">You Supplied</div>
        </div>
        <div className="h3">{total > 0 ? beautifyPrice(total, true) : "$0"}</div>
      </div>
      <StyledCustomTable
        data={suppliedRows}
        columns={yourSuppliedColumns(memeCategory)}
        noDataText="Your supplied assets will appear here"
        onSelectRow={handleRowSelect}
        selectedRowIndex={selected?.index}
        actionRow={
          <div className="flex gap-2 pb-6 table-action-row">
            {hiddenAssets.includes(selected?.data?.tokenId || "") ? null : (
              <MarketButton tokenId={selected?.data?.tokenId} />
            )}
            <WithdrawButton tokenId={selected?.data?.tokenId} />
            {canUseAsCollateral && (
              <AdjustButton tokenId={selected?.data?.tokenId || ""} memeCategory={memeCategory} />
            )}
          </div>
        }
      />
    </ContentBox>
  );
};

const StyledCustomTable = styled(CustomTable)`
  .custom-table-tbody {
    margin-top: -2px;

    .custom-table-row {
      //padding-left: 20px;
      //padding-right: 20px;
      cursor: pointer;

      .custom-table-action {
        display: none;
      }

      &:hover {
        .custom-table-action {
          display: block;
        }
      }

      &:last-child {
        padding-bottom: 20px;

        .table-action-row {
          padding-bottom: 0px;
        }
      }
    }
  }

  .custom-table-thead,
  .custom-table-tbody {
    margin: 0 -30px;
  }
  .custom-table-header-row,
  .custom-table-row {
    padding: 0 20px;
  }
`;

const yourBorrowedColumns = (memeCategory?: boolean) => [
  {
    header: "Assets",
    size: 120,
    cell: ({ originalData }) => {
      return (
        <div className="flex gap-2 items-center">
          <img
            src={originalData?.icon}
            width={26}
            height={26}
            alt="token"
            className="rounded-full w-[26px] h-[26px]"
          />
          <div className="truncate">{originalData?.symbol}</div>
        </div>
      );
    },
  },
  {
    header: "Collateral Type",
    size: 130,
    cell: ({ originalData }) => {
      const { collateralType, metadataLP } = originalData || {};
      let tokenNames = "";
      metadataLP?.tokens?.forEach((d, i) => {
        const isLast = i === metadataLP.tokens.length - 1;
        tokenNames += `${d.metadata.symbol}${!isLast ? "-" : ""}`;
      });
      return (
        <div>
          <div>{collateralType}</div>
          <div className="h6 text-gray-300">{tokenNames}</div>
        </div>
      );
    },
  },
  {
    header: "APY",
    cell: ({ originalData }) => {
      return (
        <APYCell
          rewards={originalData?.borrowRewards}
          baseAPY={originalData?.borrowApy}
          page="borrow"
          tokenId={originalData?.tokenId}
          onlyMarket
          memeCategory={!!memeCategory}
        />
      );
    },
  },
  {
    header: "Daily Reward",
    cell: ({ originalData }) => {
      if (!originalData?.rewards?.length) {
        return "-";
      }
      return <DashboardReward rewardList={originalData.rewards} page="borrow" />;
    },
  },
  {
    header: "Borrowed",
    cell: ({ originalData }) => {
      return (
        <>
          <div title={formatTokenValue(originalData?.borrowed)}>
            {beautifyPrice(originalData.borrowed)}
          </div>
          <div className="h6 text-gray-300">
            {beautifyPrice(originalData.borrowed * originalData.price, true)}
          </div>
        </>
      );
    },
  },
];
const YourBorrowed = ({
  borrowedRows,
  accountId,
  total,
  memeCategory,
}: {
  borrowedRows: any;
  accountId: string;
  total: number;
  memeCategory?: boolean;
}) => {
  const [selected, setSelected] = useState<TableRowSelect>({ data: null, index: null });

  const handleRowSelect = (rowData, rowIndex) => {
    setSelected({ data: rowData, index: rowIndex });
  };

  return (
    <ContentBox>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="absolute" style={{ left: 0, top: 0 }}>
            {memeCategory ? assets.svg.borrowMemeBg : assets.svg.borrowBg}
          </div>
          <BorrowTokenSvg className="mr-10" />
          <div className="h3">You Borrowed</div>
        </div>
        <div className="h3">{total > 0 ? beautifyPrice(total, true) : "$0"}</div>
      </div>

      <StyledCustomTable
        data={borrowedRows}
        columns={yourBorrowedColumns(memeCategory)}
        noDataText="You borrowed assets will appear here"
        onSelectRow={handleRowSelect}
        selectedRowIndex={selected?.index}
        actionRow={
          <div className="flex gap-2 pb-6 table-action-row">
            <MarketButton tokenId={selected?.data?.tokenId} />
            <RepayButton tokenId={selected?.data?.tokenId} position={selected?.data?.shadow_id} />
          </div>
        }
      />
    </ContentBox>
  );
};

export default Index;
