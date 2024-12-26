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

  getLiquidations(account, pageNumber = 1, pageSize = 10) {
    const qryObj = {
      page_number: pageNumber,
      page_size: pageSize,
    };
    return this.callAPI(
      `/burrow/get_burrow_liquidate_records/${account}`,
      "GET",
      qryObj,
      null,
      config?.liquidationUrl,
      true,
    );
  }

  markLiquidationRead(receipt_ids) {
    const qryObj = {
      receipt_ids,
    };
    return this.callAPI(
      "/burrow/set_liquidation",
      "POST",
      null,
      qryObj,
      config?.liquidationUrl,
      true,
    );
  }

  getRecords(accountId, pageNumber = 1, pageSize = 10) {
    const qryObj = {
      account_id: accountId,
      page_number: pageNumber,
      page_size: pageSize,
    };
    return this.callAPI(`/get-burrow-records`, "GET", qryObj, null, config?.recordsUrl, true);
  }

  getTokenDetails(tokenId, period = 1) {
    const qryObj = {
      period,
    };
    return this.callAPI(
      `/burrow/get_token_detail/${tokenId}`,
      "GET",
      qryObj,
      null,
      config?.liquidationUrl,
      true,
    );
  }

  getInterestRate(tokenId) {
    return this.callAPI(
      `/burrow/get_token_interest_rate/${tokenId}`,
      "GET",
      null,
      null,
      config?.liquidationUrl,
      true,
    );
  }

  getTxId(receipt_id) {
    return this.callAPI(`/v1/search/?keyword=${receipt_id}`, "GET", null, null, config?.txIdApiUrl);
  }

  getMarginTradingPosition(params) {
    return this.callAPI(
      `/v3/margin-trading/position`,
      "POST",
      null,
      params,
      config?.marginTradingUrl,
    );
  }

  getMarginTradingVolumeStatistics() {
    return this.callAPI(
      `/v3/margin-trading/position/statistics`,
      "GET",
      null,
      null,
      config?.marginTradingUrl,
    );
  }

  getMarginTradingTokenVolumeStatistics(id) {
    return this.callAPI(
      `/v3/margin-trading/position/statistics`,
      "GET",
      { token_address: id },
      null,
      config?.marginTradingUrl,
    );
  }

  getFee() {
    return this.callAPI(
      `/v3/margin-trading/position/fee`,
      "GET",
      null,
      null,
      config?.marginTradingUrl,
    );
  }

  getMarginTradingRecordEntryPrice(id) {
    return this.callAPI(
      `/v3/margin-trading/position/records/entry-price`,
      "GET",
      { pos_ids: id },
      null,
      config?.marginTradingUrl,
    );
  }

  getMarginTradingPositionHistory(params) {
    return this.callAPI(
      `/v3/margin-trading/position/history`,
      "GET",
      params,
      null,
      config?.marginTradingUrl,
    );
  }
}

export default DataSource;
