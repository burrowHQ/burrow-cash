import { parseResponse, URLForEndpoint } from "./request";
import getConfig, { defaultNetwork } from "../utils/config";
import { getAuthenticationHeaders } from "../utils/signature";

const config = getConfig(defaultNetwork);

class DataSource {
  static get shared() {
    if (!DataSource.instance) {
      DataSource.instance = new DataSource();
    }
    return DataSource.instance;
  }

  // eslint-disable-next-line class-methods-use-this,default-param-last
  async callAPI(endPoint, method, queryObject, requestBody, host, authentication) {
    method = method || "GET";
    const url = URLForEndpoint(endPoint, queryObject, host);
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    // headers.append("pragma", "no-cache");
    headers.append("cache-control", "no-cache");
    if (authentication) {
      headers.append("Authentication", getAuthenticationHeaders(endPoint));
    }
    const request = {
      headers,
      method,
    };
    if (method !== "GET" && requestBody) {
      request.body = JSON.stringify(requestBody);
    }

    let response;
    try {
      response = await fetch(url, request);
    } catch (err) {
      throw new Error("Failed to connect server");
    }

    // eslint-disable-next-line no-useless-catch
    try {
      const json = await parseResponse(response);
      return json;
    } catch (err) {
      throw err;
    }
  }

  getLiquidations(account, pageNumber = 1, pageSize = 10, isMemeCategory) {
    const qryObj = {
      page_number: pageNumber,
      page_size: pageSize,
    };
    const path = isMemeCategory
      ? "/burrow/get_meme_burrow_liquidate_records"
      : "/burrow/get_burrow_liquidate_records";
    return this.callAPI(`${path}/${account}`, "GET", qryObj, null, config?.dataServiceUrl, true);
  }

  markLiquidationRead(receipt_ids, isMemeCategory) {
    const qryObj = {
      receipt_ids,
    };
    const path = isMemeCategory ? "/burrow/set_meme_liquidation" : "/burrow/set_liquidation";
    return this.callAPI(path, "POST", null, qryObj, config?.dataServiceUrl, true);
  }

  getRecords(accountId, pageNumber = 1, pageSize = 10, isMemeCategory) {
    const qryObj = {
      account_id: accountId,
      page_number: pageNumber,
      page_size: pageSize,
    };
    const path = isMemeCategory ? "/get-meme-burrow-records" : "/get-burrow-records";
    return this.callAPI(path, "GET", qryObj, null, config?.indexUrl, true);
  }

  getTokenDetails(tokenId, period = 1, isMemeCategory) {
    const qryObj = {
      period,
    };
    const path = isMemeCategory
      ? `/burrow/get_meme_token_detail/${tokenId}`
      : `/burrow/get_token_detail/${tokenId}`;
    return this.callAPI(path, "GET", qryObj, null, config?.dataServiceUrl, true);
  }

  getInterestRate(tokenId, isMemeCategory) {
    const path = isMemeCategory
      ? `/burrow/get_meme_token_interest_rate/${tokenId}`
      : `/burrow/get_token_interest_rate/${tokenId}`;
    return this.callAPI(path, "GET", null, null, config?.dataServiceUrl, true);
  }

  getTxId(receipt_id) {
    return this.callAPI(`/v1/search/?keyword=${receipt_id}`, "GET", null, null, config?.txIdApiUrl);
  }

  postMarginTradingPosition(params) {
    return this.callAPI(`/v3/margin-trading/position`, "POST", null, params, config?.indexUrl);
  }

  getMarginTradingVolumeStatistics() {
    return this.callAPI(
      `/v3/margin-trading/position/statistics`,
      "GET",
      null,
      null,
      config?.indexUrl,
    );
  }

  getMarginTradingTokenVolumeStatistics(id) {
    return this.callAPI(
      `/v3/margin-trading/position/statistics`,
      "GET",
      { token_address: id },
      null,
      config?.indexUrl,
    );
  }

  getFee() {
    return this.callAPI(`/v3/margin-trading/position/fee`, "GET", null, null, config?.indexUrl);
  }

  getMarginTradingRecordEntryPrice(id) {
    return this.callAPI(
      `/v3/margin-trading/position/records/entry-price`,
      "GET",
      { pos_ids: id },
      null,
      config?.indexUrl,
    );
  }

  getMarginTradingPositionHistory(params) {
    return this.callAPI(
      `/v3/margin-trading/position/history`,
      "GET",
      params,
      null,
      config?.indexUrl,
    );
  }

  getMarginTradingUserPnlList(
    address,
    pageNumber = 0,
    pageSize = 10,
    orderBy = "total_pnl",
    order = "desc",
  ) {
    const qryObj = {
      page_num: pageNumber,
      page_size: pageSize,
      order_by: orderBy,
      order,
    };
    if (address) {
      qryObj.address = address;
    }
    return this.callAPI(`/v3/margin-trading/user/pnl/list`, "GET", qryObj, null, config?.indexUrl);
  }
}

export default DataSource;
