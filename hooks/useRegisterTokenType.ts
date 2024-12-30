import { useAppSelector } from "../redux/hooks";
import { getMarginConfig, getMarginConfigMEME } from "../redux/marginConfigSelectors";

type TokenTypeMap = {
  mainStream: string[];
  memeStream: string[];
};

export function useRegisterTokenType() {
  const marginConfigTokens = useAppSelector(getMarginConfig);
  const marginConfigTokensMEME = useAppSelector(getMarginConfigMEME);

  const filteredTokenTypeMap: TokenTypeMap = {
    mainStream: Object.entries(marginConfigTokens.registered_tokens)
      .filter(([token, value]) => value === 1)
      .map(([token]) => token),
    memeStream: Object.entries(marginConfigTokensMEME.registered_tokens)
      .filter(([token, value]) => value === 1)
      .map(([token]) => token),
  };

  return {
    filteredTokenTypeMap,
  };
}
