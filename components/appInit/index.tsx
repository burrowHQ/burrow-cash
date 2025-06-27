import { useEffect } from "react";
import { useIdle, useInterval } from "react-use";
import ModalReact from "react-modal";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchAssets, fetchRefPrices } from "../../redux/assetsSlice";
import { fetchConfig } from "../../redux/appSlice";
import { fetchAccount } from "../../redux/accountSlice";
import { fetchAssetsMEME, fetchRefPricesMEME } from "../../redux/assetsSliceMEME";
import { fetchAccountMEME } from "../../redux/accountSliceMEME";
import { fetchConfig as fetchMemeConfig } from "../../redux/appSliceMEME";
import { fetchMarginAccount } from "../../redux/marginAccountSlice";
import { fetchMarginAccountMEME } from "../../redux/marginAccountSliceMEME";
import { fetchMarginConfig } from "../../redux/marginConfigSlice";
import { fetchMarginConfigMEME } from "../../redux/marginConfigSliceMEME";
import { fetchAllPools } from "../../redux/poolSlice";
import { getAccountId } from "../../redux/accountSelectors";
import { getAppRefreshNumber } from "../../redux/appSelectors";

ModalReact.defaultStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(22, 22, 27, 0.8)",
    zIndex: 100,
    outline: "none",
  },
  content: {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -65%)",
    outline: "none",
  },
};
ModalReact.setAppElement("#root");

const IDLE_INTERVAL = 90e3;
const REFETCH_INTERVAL = 60e3;

const Init = () => {
  const isIdle = useIdle(IDLE_INTERVAL);
  const dispatch = useAppDispatch();
  const accountId = useAppSelector(getAccountId);
  const appRefreshNumber = useAppSelector(getAppRefreshNumber);
  const fetchData = () => {
    dispatch(fetchAssets()).then(() => dispatch(fetchRefPrices()));
    dispatch(fetchAssetsMEME()).then(() => dispatch(fetchRefPricesMEME()));
    dispatch(fetchConfig());
    dispatch(fetchMemeConfig());
    dispatch(fetchMarginConfig());
    dispatch(fetchMarginConfigMEME());
    dispatch(fetchAllPools());
  };
  const fetchDataAccount = () => {
    dispatch(fetchAccount());
    dispatch(fetchAccountMEME());
    dispatch(fetchMarginAccount());
    dispatch(fetchMarginAccountMEME());
  };
  const fetchAllData = () => {
    fetchData();
    fetchDataAccount();
  };
  useEffect(() => {
    if (accountId && Number(appRefreshNumber) > 0) {
      fetchDataAccount();
    }
  }, [accountId, appRefreshNumber]);
  useInterval(fetchAllData, !isIdle ? REFETCH_INTERVAL : null);

  return null;
};

export default Init;
