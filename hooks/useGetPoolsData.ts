import { useState, useEffect } from "react";
import { get_pools_from_sdk } from "../api/get-pool";

export function usePoolsData() {
  const [simplePools, setSimplePools] = useState<any[]>([]);
  const [stablePools, setStablePools] = useState<any[]>([]);
  const [stablePoolsDetail, setStablePoolsDetail] = useState<any[]>([]);
  useEffect(() => {
    getPoolsData();
  }, []);

  async function getPoolsData() {
    try {
      const { simplePools, stablePools, stablePoolsDetail } = await get_pools_from_sdk();
      setSimplePools(simplePools);
      setStablePools(stablePools);
      setStablePoolsDetail(stablePoolsDetail);
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
