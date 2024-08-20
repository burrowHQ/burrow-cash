import React, { useState } from "react";
import { twMerge } from "tailwind-merge";
import styled from "styled-components";
import { ContentBox } from "../../components/ContentBox/ContentBox";
import DashboardReward from "./dashboardReward";
import { formatTokenValue, formatUSDValue, millifyNumber } from "../../helpers/helpers";
import { AdjustButton, MarketButton, RepayButton, WithdrawButton } from "./supplyBorrowButtons";
import { NoDataMascot } from "../../components/Icons/Icons";
import { hiddenAssets } from "../../utils/config";
import CustomTooltips from "../../components/CustomTooltips/CustomTooltips";
import { APYCell } from "../Market/APYCell";

const SupplyBorrowListMobile = ({ suppliedRows, borrowedRows, accountId }) => {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (i) => {
    setTabIndex(i);
  };

  let supplyNode;
  let borrowNode;

  if (suppliedRows?.length) {
    supplyNode = suppliedRows?.map((d) => (
      <ContentBox style={{ padding: 0, marginBottom: 15 }} key={d.tokenId}>
        <SupplyItem data={d} key={d.tokenId} />
      </ContentBox>
    ));
  } else {
    supplyNode = <NoLoginContent text="Your supplied assets will appear here" />;
  }

  if (borrowedRows?.length) {
    borrowNode = borrowedRows?.map((d) => (
      <ContentBox style={{ padding: 0, overflow: "hidden", marginBottom: 15 }} key={d.tokenId}>
        <BorrowItem data={d} key={d.tokenId} />
      </ContentBox>
    ));
  } else {
    borrowNode = <NoLoginContent text="Your borrowed assets will appear here" />;
  }

  return (
    <div>
      <div
        className="flex gap-4 justify-evenly bg-gray-800 mb-4 items-center relative z-12"
        style={{ borderRadius: 8 }}
      >
        <TabItem
          text="Supplied"
          onClick={() => handleTabChange(0)}
          active={tabIndex === 0}
          tabIndex={tabIndex}
        />
        <div className="text-gray-700">|</div>
        <TabItem
          text="Borrowed"
          onClick={() => handleTabChange(1)}
          active={tabIndex === 1}
          tabIndex={tabIndex}
        />
      </div>

      <div>{tabIndex === 0 ? supplyNode : borrowNode}</div>
    </div>
  );
};

const NoLoginContent = ({ text = "No Data" }) => {
  return (
    <ContentBox className="text-gray-400 h4 flex justify-center flex-col items-center">
      <div className="mb-4">
        <NoDataMascot />
      </div>
      {text}
    </ContentBox>
  );
};

const TabItem = ({ text, onClick, active, tabIndex }) => {
  return (
    <div
      className={twMerge("relative cursor-pointer")}
      style={{ padding: "14px 0 14px" }}
      onClick={onClick}
    >
      <div
        className={twMerge(
          "relative z-20",
          active && (tabIndex === 1 ? "text-pink-500" : "text-primary"),
        )}
      >
        {text}
      </div>
      <StyledTabActiveBall className={twMerge(`bg-gray-800 hidden`, active && "flex")}>
        <div
          className={twMerge(
            "tab-ball bg-primary shadow-primary",
            tabIndex === 1 && "bg-pink-500 shadow-pink-500",
          )}
        />
      </StyledTabActiveBall>
    </div>
  );
};

const StyledTabActiveBall = styled.div`
  border-radius: 170px;
  width: 32px;
  height: 59px;
  position: absolute;
  bottom: -9px;
  z-index: 1;
  left: 50%;
  transform: translateX(-50%);
  justify-content: center;
  align-items: flex-end;

  .tab-ball {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    margin-bottom: 6px;
    box-shadow: #e3ead0 0 0 6px;
  }
`;

const SupplyItem = ({ data }) => {
  const { canUseAsCollateral, metadata } = data || {};
  const { icon, tokens, symbol } = metadata || {};
  let iconImg;
  let symbolNode = symbol;
  if (icon) {
    iconImg = <img src={icon} width={26} height={26} alt="token" className="rounded-full" />;
  } else if (tokens?.length) {
    symbolNode = "";
    let symbolTooltips = "";
    iconImg = (
      <div className="grid" style={{ marginRight: 2, gridTemplateColumns: "15px 12px" }}>
        {tokens?.map((d, i) => {
          const isLast = i === tokens.length - 1;
          if (tokens?.length > 3) {
            symbolTooltips += `${d.metadata.symbol}${!isLast ? "-" : ""}`;
          } else {
            symbolNode += `${d.metadata.symbol}${!isLast ? "-" : ""}`;
          }

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

    if (tokens?.length > 3) {
      symbolNode = (
        <CustomTooltips
          text={symbolTooltips}
          style={{ left: 0, right: "auto", maxWidth: "70vw", top: "100%", height: 26 }}
        >
          {tokens?.length} pool
        </CustomTooltips>
      );
    }
  }

  return (
    <div>
      <div
        className="flex justify-between border-b"
        style={{ padding: "16px", borderColor: "#31344C" }}
      >
        <div className="flex gap-2 items-center pr-2">
          {iconImg}
          <div className="flex flex-col">
            <div className="h4b">{symbolNode}</div>
            {hiddenAssets.includes(data?.tokenId || "") ? null : (
              <MarketButton
                tokenId={data?.tokenId}
                style={{
                  border: 0,
                  padding: 0,
                  fontSize: 12,
                }}
              />
            )}
          </div>
        </div>

        <div className="text-right">
          <div>{formatTokenValue(data?.supplied)}</div>
          <div className="h6 text-gray-300">
            {data.supplied > 0 ? formatUSDValue(data.supplied * data.price) : "-"}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        <ItemRow label="APY">
          <APYCell
            rewards={data?.depositRewards}
            baseAPY={data?.apy}
            page="deposit"
            tokenId={data?.tokenId}
            onlyMarket
          />
        </ItemRow>
        <ItemRow label="Rewards">
          <DashboardReward rewardList={data?.depositRewards} />
        </ItemRow>
        <ItemRow label="Collateral">
          {/* <div>{formatTokenValue(data?.collateral)}</div> */}
          <div>{data.collateral > 0 ? formatUSDValue(data.collateral * data.price) : "-"}</div>
        </ItemRow>

        <div className="flex gap-2">
          <WithdrawButton tokenId={data?.tokenId} />
          {canUseAsCollateral && <AdjustButton tokenId={data?.tokenId} />}
        </div>
      </div>
    </div>
  );
};

const BorrowItem = ({ data }) => {
  const { metadataLP, collateralType } = data || {};
  let tokenNames = "";
  metadataLP?.tokens?.forEach((d, i) => {
    const isLast = i === metadataLP.tokens.length - 1;
    tokenNames += `${d.metadata.symbol}${!isLast ? "-" : ""}`;
  });
  return (
    <div>
      <div
        className="flex justify-between border-b"
        style={{ padding: "16px", borderColor: "#31344C" }}
      >
        <div className="flex gap-2 items-center">
          <img src={data?.icon} width={26} height={26} alt="token" className="rounded-full" />
          <div className="flex flex-col">
            <div className="truncate h4b">{data?.symbol}</div>
            <MarketButton
              tokenId={data?.tokenId}
              style={{
                border: 0,
                padding: 0,
                fontSize: 12,
              }}
            />
          </div>
        </div>
        <div className="text-right">
          <div>{formatTokenValue(data?.borrowed)}</div>
          <div className="h6 text-gray-300">${millifyNumber(data.borrowed * data.price)}</div>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        <ItemRow label="APY">
          <APYCell
            rewards={data?.borrowRewards}
            baseAPY={data?.borrowApy}
            page="borrow"
            tokenId={data?.tokenId}
            onlyMarket
          />
        </ItemRow>
        <ItemRow label="Rewards">
          <div className="flex gap-2 items-center">
            <DashboardReward rewardList={data.rewards} />
            {/* <div className="h6 text-gray-300">{data.price}</div> */}
          </div>
        </ItemRow>

        <ItemRow label="Collateral Type">
          <div className="flex gap-2 items-center">
            <div style={{ fontSize: 14 }}>{tokenNames || "Standard Token"}</div>
          </div>
        </ItemRow>

        <div className="">
          <RepayButton tokenId={data?.tokenId} position={data?.shadow_id} />
        </div>
      </div>
    </div>
  );
};

const ItemRow = ({ label, children, style = {} }) => {
  return (
    <div className="flex justify-between mb-4" style={style}>
      <div className="h4c text-gray-300">{label}</div>
      <div>{children}</div>
    </div>
  );
};

export default SupplyBorrowListMobile;
