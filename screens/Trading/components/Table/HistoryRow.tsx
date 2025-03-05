import { isMobileDevice } from "../../../../helpers/helpers";
import { shrinkToken } from "../../../../store/helper";
import { getSymbolById } from "../../../../transformers/nearSymbolTrans";
import { beautifyPrice } from "../../../../utils/beautyNumber";
import { toInternationalCurrencySystem_number } from "../../../../utils/uiNumber";

const HistoryRow = ({ key, index, record, assetP, assetD, assetC }) => {
  const isMobile = isMobileDevice();
  return !isMobile ? (
    <tr className="align-text-top">
      <td className="py-5 pl-5">
        {record.trend === "long"
          ? `${getSymbolById(assetP.token_id, assetP.metadata?.symbol)}/${getSymbolById(
              assetD.token_id,
              assetD.metadata?.symbol,
            )}`
          : `${getSymbolById(assetD.token_id, assetD.metadata?.symbol)}/${getSymbolById(
              assetP.token_id,
              assetP.metadata?.symbol,
            )}`}
        <div
          className={
            record.trend === "long"
              ? "text-primary text-xs"
              : record.trend === "short"
              ? "text-orange text-xs"
              : ""
          }
        >
          {record.trend}
        </div>
      </td>
      <td>
        {record.trend === "long"
          ? record.amount_d === "0"
            ? "-"
            : beautifyPrice(
                Number(
                  shrinkToken(
                    record.amount_p,
                    assetP.metadata.decimals + assetP.config.extra_decimals,
                  ),
                ),
              )
          : record.trend === "short"
          ? record.amount_p === "0"
            ? "-"
            : beautifyPrice(
                Number(
                  shrinkToken(
                    record.amount_d,
                    assetD.metadata.decimals + assetD.config.extra_decimals,
                  ),
                ),
              )
          : null}
        <span className="ml-0.5">
          {record.trend === "long"
            ? `${getSymbolById(assetP.token_id, assetP.metadata?.symbol)}`
            : `${getSymbolById(assetD.token_id, assetD.metadata?.symbol)}`}
        </span>
      </td>
      <td>
        {beautifyPrice(
          Number(
            shrinkToken(record.amount_c, assetC.metadata.decimals + assetC.config.extra_decimals),
          ) * Number(record.c_token_price),
          true,
        )}
      </td>
      <td>
        {beautifyPrice(
          Number(
            shrinkToken(record.amount_c, assetC.metadata.decimals + assetC.config.extra_decimals),
          ),
          false,
        )}
        <span className="ml-1">{getSymbolById(assetC.token_id, assetC.metadata?.symbol)}</span>
      </td>
      <td>
        <div className="flex items-start flex-col">
          {record.entry_price !== "0" ? (
            <span>{beautifyPrice(Number(record.entry_price))}</span>
          ) : (
            "-"
          )}
        </div>
      </td>
      <td>
        <div className="flex items-start flex-col">
          {record.price !== "0" ? <span>{beautifyPrice(Number(record.price))}</span> : "-"}
        </div>
      </td>
      <td>
        {beautifyPrice(
          Number(shrinkToken(record.fee, assetD.metadata.decimals + assetD.config.extra_decimals)),
          true,
          3,
          3,
        )}
      </td>
      <td
        className={`ml-1 ${record.pnl > 0 ? "text-primary" : record.pnl < 0 ? "text-danger" : ""}`}
      >
        {record.pnl > 0 ? "+" : record.pnl < 0 ? "-" : ""}
        {record.pnl !== "0"
          ? beautifyPrice(Math.abs(record.pnl * record.c_token_price), false, 3, 3)
          : ""}
      </td>
      <td>
        <div className="text-sm">
          {record.open_timestamp !== 0 ? new Date(record.open_timestamp).toLocaleDateString() : "-"}
        </div>
        <div className="text-gray-300 text-xs">
          {record.open_timestamp !== 0 ? new Date(record.open_timestamp).toLocaleTimeString() : ""}
        </div>
      </td>
      <td>
        <div className="text-sm">
          {record.close_timestamp !== 0
            ? new Date(record.close_timestamp).toLocaleDateString()
            : "-"}
        </div>
        <div className="text-gray-300 text-xs">
          {record.close_timestamp !== 0
            ? new Date(record.close_timestamp).toLocaleTimeString()
            : ""}
        </div>
      </td>
      <td>{record.close_type}</td>
    </tr>
  ) : (
    <div className="bg-gray-800 rounded-xl mb-4" key={index}>
      <div className="pt-5 px-4 pb-4 border-b border-dark-50 flex justify-between">
        <div className="flex items-center">
          <div className="flex items-center justify-center mr-3.5">
            <img
              src={assetP.metadata.icon}
              alt=""
              className="rounded-2xl border border-gray-800"
              style={{ width: "26px", height: "26px" }}
            />
            <img
              src={assetD.metadata.icon}
              alt=""
              className="rounded-2xl border border-gray-800"
              style={{ width: "26px", height: "26px", marginLeft: "-6px" }}
            />
          </div>
          <div>
            <p>{`${getSymbolById(assetP.token_id, assetP.metadata?.symbol)}/${getSymbolById(
              assetD.token_id,
              assetD.metadata?.symbol,
            )}`}</p>
            <p
              className={
                record.trend === "long"
                  ? "text-primary text-xs"
                  : record.trend === "short"
                  ? "text-orange text-xs"
                  : ""
              }
            >
              <span>{record.trend}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Size</p>
          <p>
            {record.trend === "long"
              ? record.amount_d === "0"
                ? "-"
                : beautifyPrice(
                    Number(
                      shrinkToken(
                        record.amount_p,
                        assetP.metadata.decimals + assetP.config.extra_decimals,
                      ),
                    ),
                  )
              : record.trend === "short"
              ? record.amount_p === "0"
                ? "-"
                : beautifyPrice(
                    Number(
                      shrinkToken(
                        record.amount_d,
                        assetD.metadata.decimals + assetD.config.extra_decimals,
                      ),
                    ),
                  )
              : null}
            <span className="ml-0.5">
              {record.trend === "long"
                ? `${getSymbolById(assetP.token_id, assetP.metadata?.symbol)}`
                : `${getSymbolById(assetD.token_id, assetD.metadata?.symbol)}`}
            </span>
          </p>
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Net Value</p>
          <p>
            {beautifyPrice(
              Number(
                shrinkToken(
                  record.amount_c,
                  assetC.metadata.decimals + assetC.config.extra_decimals,
                ),
              ) * Number(record.c_token_price),
              true,
            )}
          </p>
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Collateral</p>
          <p>
            {beautifyPrice(
              Number(
                shrinkToken(
                  record.amount_c,
                  assetC.metadata.decimals + assetC.config.extra_decimals,
                ),
              ),
              false,
            )}
            <span className="ml-1">{getSymbolById(assetC.token_id, assetC.metadata?.symbol)}</span>
          </p>
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Entry price</p>
          <p>
            {record.entry_price !== "0" ? (
              <span>${beautifyPrice(Number(record.entry_price))}</span>
            ) : (
              "-"
            )}
          </p>
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Close price</p>
          <p>{record.price !== "0" ? <span>${beautifyPrice(Number(record.price))}</span> : "-"}</p>
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Fee</p>
          <p>
            {beautifyPrice(
              Number(
                shrinkToken(record.fee, assetD.metadata.decimals + assetD.config.extra_decimals),
              ),
              true,
              3,
              3,
            )}
          </p>
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Opening time</p>
          <p>
            {record.open_timestamp !== 0 ? new Date(record.open_timestamp).toLocaleString() : "-"}
          </p>
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Close time</p>
          <p>{new Date(record.close_timestamp).toLocaleString()}</p>
        </div>
        <div className="flex items-center justify-between text-sm mb-[18px]">
          <p className="text-gray-300">Operation</p>
          <p>{record.close_type}</p>
        </div>
        <div className="bg-dark-100 rounded-2xl flex items-center justify-center text-xs py-1 text-gray-300 mb-4">
          PnL
          <p
            className={`ml-1 ${
              record.pnl > 0 ? "text-primary" : record.pnl < 0 ? "text-danger" : ""
            }`}
          >
            {record.pnl > 0 ? "+" : record.pnl < 0 ? "-" : ""}
            {record.pnl !== "0"
              ? beautifyPrice(Math.abs(record.pnl * record.c_token_price), false, 3, 3)
              : ""}
          </p>
        </div>
      </div>
    </div>
  );
};
export default HistoryRow;
