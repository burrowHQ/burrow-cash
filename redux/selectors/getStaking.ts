import { createSelector } from "@reduxjs/toolkit";
import { DateTime } from "luxon";
import { shrinkToken } from "../../store";
import { RootState } from "../store";

export const getStaking = (memeCategory?: boolean) => {
  return createSelector(
    (state: RootState) => state.account,
    (state: RootState) => state.app,
    (state: RootState) => state.category,
    (account, app, category) => {
      let isMeme: boolean;
      if (typeof memeCategory !== "boolean") {
        isMeme = category.activeCategory == "meme";
      } else {
        isMeme = memeCategory;
      }
      if (isMeme) {
        return {
          BRRR: 0,
          xBRRR: 0,
          extraXBRRRAmount: 0,
          totalXBRRR: 0,
          stakingTimestamp: 0,
          amount: 0,
          months: 0,
          totalXBRRRStaked: 0,
        };
      }
      const { config } = app;
      const { amount, months } = app.staking;
      const BRRR = Number(
        shrinkToken(
          account.portfolio.staking["staked_booster_amount"],
          app.config.booster_decimals,
        ),
      );
      const xBRRR = Number(
        shrinkToken(account.portfolio.staking["x_booster_amount"], app.config.booster_decimals),
      );

      const stakingTimestamp = Number(account.portfolio.staking["unlock_timestamp"]);

      const xBRRRMultiplier =
        1 +
        ((months * config.minimum_staking_duration_sec - config.minimum_staking_duration_sec) /
          (config.maximum_staking_duration_sec - config.minimum_staking_duration_sec)) *
          (config.x_booster_multiplier_at_maximum_staking_duration / 10000 - 1);
      const maxMonths = config.maximum_staking_duration_sec / (30 * 24 * 60 * 60);
      const unstakeDate = DateTime.fromMillis(stakingTimestamp / 1e6);
      const selectedMonths = stakingTimestamp
        ? Math.round(unstakeDate.diffNow().as("months"))
        : months;
      const compare = selectedMonths > maxMonths ? Math.min : Math.max;
      const totalXBRRR = compare(
        xBRRR + Number(amount) * xBRRRMultiplier,
        (BRRR + Number(amount)) * xBRRRMultiplier,
      );
      const extraXBRRRAmount = totalXBRRR - xBRRR;
      const totalXBRRRStaked = compare(xBRRR, BRRR);
      return {
        BRRR,
        xBRRR,
        extraXBRRRAmount,
        totalXBRRR,
        stakingTimestamp,
        amount,
        months,
        totalXBRRRStaked,
      };
    },
  );
};
