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
    }&slippage=${Number(slippage)}`,
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

export async function findPathReserve({
  amountOut,
  tokenIn,
  tokenOut,
  slippage,
  supportLedger = false,
}: {
  amountOut: string;
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
    }/findPathExactOut?amountOut=${amountOut}&tokenIn=${tokenIn}&tokenOut=${tokenOut}&pathDeep=${
      supportLedger ? 1 : 3
    }&slippage=${Number(slippage)}`,
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
