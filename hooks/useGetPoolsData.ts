import { useState, useEffect } from "react";
import { fetchAllPools, getStablePools, init_env } from "@ref-finance/ref-sdk";

export function usePoolsData() {
  const [simplePools, setSimplePools] = useState<any[]>([]);
  const [stablePools, setStablePools] = useState<any[]>([]);
  const [stablePoolsDetail, setStablePoolsDetail] = useState<any[]>([]);

  useEffect(() => {
    getPoolsData();
  }, []);

  async function getPoolsData() {
    try {
      //
      const { ratedPools, unRatedPools, simplePools: simplePoolsFromSdk } = await fetchAllPools();
      const stablePoolsFromSdk = unRatedPools.concat(ratedPools);
      const stablePoolsDetailFromSdk = await getStablePools(stablePoolsFromSdk);

      setSimplePools(simplePoolsFromSdk);
      setStablePools(stablePoolsFromSdk);
      setStablePoolsDetail(stablePoolsDetailFromSdk);
    } catch (error) {
      console.error("Error fetching pools data:", error);
    }
  }

  return {
    simplePools,
    stablePools,
    stablePoolsDetail,
  };
}
