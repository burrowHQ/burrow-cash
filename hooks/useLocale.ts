import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";
import { useIntl } from "react-intl";
import en from "../locales/en.json";
import zh from "../locales/zh.json";
import {
  flattenMessages,
  type INestedMessages,
  type TranslationKey,
} from "../locales/flattenMessages";

export type Locale = "en" | "zh";

const messages: Record<Locale, INestedMessages> = {
  en,
  zh,
};

export const useLocale = () => {
  const router = useRouter();

  const flattenedMessages = useMemo(
    () => flattenMessages(messages[router.locale as keyof typeof messages]),
    [router],
  );

  const switchLocale = useCallback(
    (locale: Locale) => {
      if (locale === router.locale) {
        return;
      }
      const path = router.asPath;
      return router.push(path, path, { locale });
    },
    [router],
  );
  return { locale: router.locale as Locale, switchLocale, messages: flattenedMessages };
};

export const useTranslate = () => {
  const { formatMessage } = useIntl();
  const t = useCallback(
    (key: TranslationKey) =>
      formatMessage({
        id: key,
      }),
    [formatMessage],
  );

  return { t };
};
