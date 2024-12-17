import getConfig from "../utils/config";

export async function findPath({
  amountIn,
  tokenIn,
  tokenOut,
  slippage,
  supportLedger = false,
}: {
  amountIn: string;
  tokenIn: string;
  tokenOut: string;
  slippage: number;
  supportLedger?: boolean;
}) {
  const config = getConfig();
  const timeoutDuration = 5000;
  const controller = new AbortController();
  const timeOutId = setTimeout(() => {
    controller.abort();
  }, timeoutDuration);
  const resultFromServer = await fetch(
    `https://${
      config.findPathUrl
    }/findPath?amountIn=${amountIn}&tokenIn=${tokenIn}&tokenOut=${tokenOut}&pathDeep=${
      supportLedger ? 1 : 3
    }&slippage=${Number(slippage) / 100}`,
    {
      signal: controller.signal,
    },
  )
    .then((res) => {
      return res.json();
    })
    .finally(() => {
      clearTimeout(timeOutId);
    });
  return resultFromServer;
}
