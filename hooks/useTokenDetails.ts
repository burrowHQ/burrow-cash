import { useState } from "react";
import { DateTime } from "luxon";
import Decimal from "decimal.js";
import Datasource from "../data/datasource";
import { getAssets } from "../store";

const getSupplyDetails = (tokenDetailDays) => {
  return tokenDetailDays.map((d) => {
    return {
      tokenSupplyApy: d.tokenSupplyApy,
      dayDate: d.dayDate,
      baseApy: d.token_supply_apr * 100,
      netApy: d.net_liquidity_apr * 100,
      farmApy: d.token_farm_supply_apr * 100,
    };
  });
};

export const useTokenDetails = () => {
  const [tokenDetailDays, setTokenDetailDays] = useState<any[]>([]);
  const [tokenBorrowDays, setTokenBorrowDays] = useState<any[]>([]);
  const [tokenSupplyDays, setTokenSupplyDays] = useState<any[]>([]);
  const [interestRates, setInterestRates] = useState<any[]>([]);
  const [borrowAnimating, setBorrowAnimating] = useState(false);
  const [supplyAnimating, setSupplyAnimating] = useState(false);

  const changePeriodDisplay = async ({ tokenId, borrowPeriod, supplyPeriod }) => {
    try {
      const isBorrowPeriodChange =
        borrowPeriod === 0 || (borrowPeriod && borrowPeriod !== tokenBorrowDays?.length);
      const isSupplyPeriodChange =
        supplyPeriod === 0 || (supplyPeriod && supplyPeriod !== tokenSupplyDays?.length);
      let docs = tokenDetailDays;

      if (isBorrowPeriodChange) {
        setBorrowAnimating(true);
      }
      if (isSupplyPeriodChange) {
        setSupplyAnimating(true);
      }

      if (!tokenDetailDays?.length || borrowPeriod === 0 || supplyPeriod === 0) {
        const { all } = await fetchTokenDetails(tokenId, borrowPeriod ?? supplyPeriod, true);
        docs = all;
      }

      if (isBorrowPeriodChange) {
        const displayDetails =
          borrowPeriod === 0 ? docs : docs.slice(docs.length - borrowPeriod, docs.length);
        setTokenBorrowDays(displayDetails);
        setTimeout(() => {
          setBorrowAnimating(false);
        }, 1500);
      }

      if (isSupplyPeriodChange) {
        const displayDetails =
          supplyPeriod === 0 ? docs : docs.slice(docs.length - supplyPeriod, docs.length);
        const supplyDetails = getSupplyDetails(displayDetails);
        setTokenSupplyDays(supplyDetails);
        setTimeout(() => {
          setSupplyAnimating(false);
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTokenDetails = async (tokenId, period, isFetchOnly?: boolean) => {
    if (period === undefined || period === null) {
      period = 365;
    }

    try {
      const [tokenDetailsRes, interestRateRes, currentUtilizationRes] = await Promise.allSettled([
        Datasource.shared.getTokenDetails(tokenId, period),
        Datasource.shared.getInterestRate(tokenId),
        getCurrentUtilization(tokenId),
      ]);

      let tokenDetails: any[] = [];
      let interestRate: any = {};
      let currentUtilization: number | null;
      if (tokenDetailsRes.status !== "rejected") {
        tokenDetails = tokenDetailsRes?.value;
      }
      if (interestRateRes.status !== "rejected") {
        interestRate = interestRateRes?.value;
      }
      if (currentUtilizationRes.status !== "rejected") {
        currentUtilization = currentUtilizationRes.value;
      }

      const lastTokenDetails = tokenDetails[tokenDetails.length - 1];
      const borrows: any[] = [];
      const result = tokenDetails?.map((d) => {
        const date = DateTime.fromISO(d.createdAt);
        const supplyApyWithNet = Number(d.token_supply_apr) + Number(d.net_liquidity_apr || 0);
        d.tokenSupplyApy = supplyApyWithNet * 100;
        d.tokenBorrowApy = d.token_borrow_apr * 100;
        d.dayDate = date.toFormat("dd MMM yyyy");
        borrows.push({
          tokenBorrowApy: d.tokenBorrowApy,
          dayDate: d.dayDate,
        });
        return d;
      });
      const supplies = getSupplyDetails(tokenDetails);

      const interestRatesCal = interestRate?.utilization?.map((n, i) => {
        const percent = Math.floor(n * 100);
        // const rateIndex = interestRate?.utilization.findIndex((i) => i === percent);
        const borrowRateRaw = interestRate.burrow_apr[i] * 100;
        const borrowRate = interestRate ? borrowRateRaw : 0;

        const supplyRateRaw = interestRate.supply_apr[i] * 100;
        const supplyRate = interestRate ? supplyRateRaw : 0;

        let borrowRate2 = borrowRate;
        let supplyRate2 = supplyRate;
        if (percent < 50) {
          borrowRate2 = borrowRateRaw - (50 - percent);
          supplyRate2 = supplyRateRaw - (50 - percent);
        }

        return {
          currentUtilRate: currentUtilization || lastTokenDetails.token_utilization_rate * 100,
          percent,
          percentLabel: `${percent}%`,
          borrowRate,
          borrowRate2,
          supplyRate,
          supplyRate2,
        };
      });

      const returnObj = {
        borrows,
        supplies,
        interestRates: interestRatesCal,
        all: result,
      };
      if (isFetchOnly) {
        return returnObj;
      }

      setInterestRates(interestRatesCal);
      setTokenDetailDays(result);
      setTokenBorrowDays(borrows);
      setTokenSupplyDays(supplies);
      return returnObj;
    } catch (e) {
      console.error("fetchTokenDetailsErr", e);
      throw e;
    }
  };

  const getCurrentUtilization = async (tokenId) => {
    const assets = await getAssets();
    let token: any = {};
    token = assets.find((e) => e.token_id === tokenId);
    if (token) {
      const { borrowed, supplied, reserved } = token;
      const totalSupplyD = new Decimal(supplied.balance).plus(new Decimal(reserved)).toFixed();
      const currentUtilization = (borrowed.balance / Number(totalSupplyD)) * 100;
      return currentUtilization;
    }
    return null;
  };

  return {
    tokenDetailDays,
    tokenBorrowDays,
    tokenSupplyDays,
    borrowAnimating,
    supplyAnimating,
    interestRates,
    changePeriodDisplay,
    fetchTokenDetails,
    getCurrentUtilization,
  };
};
