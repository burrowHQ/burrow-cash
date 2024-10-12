import { useBTCProvider, useConnector } from "@particle-network/btc-connectkit";
import { useCallback, useEffect, useState } from "react";
import Big from "big.js";

export const base_url = process.env.NEXT_PUBLIC_BASE_URL;

export async function getBtcFeeRate() {
  const feeRes = await fetch(`https://blockstream.info/testnet/api/fee-estimates`).then((res) =>
    res.json(),
  );

  const confirmationTarget = 6;
  const feeRate = feeRes[confirmationTarget];

  return 100;
  // return feeRate < 100 ? 100 : feeRate
}

interface Props {
  updater: number;
}

export function computeNetworkFee(
  inputSize: number,
  outputSize: number,
  feeRate: number = 30,
): number {
  return (10.5 + inputSize * 148 + outputSize * 31) * feeRate;
}

export function useBtcAction({ updater }: Props) {
  const [balance, setBalance] = useState<string | null>(null);
  const [btcPublicKey, setPublicKey] = useState<string | null>(null);
  const { accounts, sendBitcoin, provider, getPublicKey, signMessage } = useBTCProvider();
  const { connectors } = useConnector();

  // const receiveDepositMsg = useCallback(async (args: any) => {
  //   const res = await fetch(`${base_url}/receiveDepositMsg`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify(args),
  //   }).then((response) => response.json());

  //   return res;
  // }, []);

  // console.log('accounts:', accounts, provider, connectors)

  useEffect(() => {
    if (provider) {
      // provider.getBitcoinUtxos().then((res: any) => {
      //     console.log('res:', res)
      // })

      provider.getBalance().then((res: any) => {
        const _balance = new Big(res.total).div(10 ** 8).toString();
        setBalance(_balance);
      });

      getPublicKey().then((publicKey) => {
        setPublicKey(publicKey);
      });
    } else {
      setBalance("");
      setPublicKey("");
    }

    const inter = setInterval(() => {
      if (provider) {
        provider.getBalance().then((res: any) => {
          const _balance = new Big(res.total).div(10 ** 8).toString();
          setBalance(_balance);
        });
      }
    }, 10000);

    return () => {
      clearInterval(inter);
    };
  }, [provider, updater]);

  const getUtxo = useCallback(() => {
    if (!provider) {
      return [];
    }
    return provider.getBitcoinUtxos();
  }, [provider]);

  const _estimateGas = useCallback(
    async (fromAmount: number) => {
      // const metaData = await viewMethod({
      //     method: 'get_metadata',
      //     args: {}
      // })

      // if (fromAmount < Number(metaData.min_deposit)) {
      //     return 'The minimum deposit must be greater than or equal to ' + new Big(metaData.min_deposit).div(10 ** 8).toString() + 'BTC'
      // }

      const utxos = await getUtxo();
      utxos.sort((a: any, b: any) => {
        return b.satoshis - a.satoshis;
      });

      const feeRate = await getBtcFeeRate();

      let index = 0;
      let sum = 0;
      let networkFee = 0;

      for (let i = index; i < utxos.length; i++) {
        sum += utxos[i].satoshis;
        if (sum >= fromAmount) {
          index = i;
          networkFee = computeNetworkFee(index + 1, 2, feeRate);
          // console.log('networkFee: ', networkFee, fromAmount, sum, fromAmount + networkFee)
          if (sum - fromAmount > networkFee) {
            break;
          } else if (i === utxos.length - 1) {
            // networkFee = 0
          }
        }
      }

      return {
        networkFee,
        realAmount: fromAmount,
      };
    },
    [provider],
  );

  const estimateGas = useCallback(
    async (fromAmount: number) => {
      const { networkFee, realAmount } = await _estimateGas(fromAmount);
      if (networkFee && realAmount && networkFee < realAmount) {
        // const { networkFee: realNetworkFee, realAmount: realRealAmount } = await _estimateGas(realAmount - networkFee)
        // console.log('realAmount:', fromAmount, realAmount, networkFee, realNetworkFee)
        return {
          networkFee,
          realAmount: new Big(realAmount - networkFee).div(10 ** 8).toNumber(),
          isSuccess: true,
        };
      }

      return {
        networkFee,
        realAmount,
        isSuccess: false,
      };
    },
    [provider],
  );

  return {
    balance,
    sendBitcoin,
    // receiveDepositMsg,
    getUtxo,
    estimateGas,
    btcPublicKey,
    signMessage,
  };
}
