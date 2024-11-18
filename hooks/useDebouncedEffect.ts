import {
  type DependencyList,
  type EffectCallback,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
} from "react";
import { debounce, type DebounceSettings } from "lodash-es";

type DebounceOptions = number | ({ wait: number } & Partial<DebounceSettings>);

export function useDebouncedEffect(
  effect: EffectCallback,
  deps: React.DependencyList,
  debounceOptions?: DebounceOptions,
) {
  useEffect(() => {
    const options =
      typeof debounceOptions === "number" ? { wait: debounceOptions } : debounceOptions;
    const debouncedEffect = debounce(
      () => {
        const cleanupFn = effect();
        if (cleanupFn) {
          debouncedEffect.flush = cleanupFn as any;
        }
      },
      options?.wait,
      options,
    );

    debouncedEffect();

    return () => {
      debouncedEffect.cancel();
      if (debouncedEffect.flush) {
        debouncedEffect.flush();
      }
    };
  }, [...deps]);
}
