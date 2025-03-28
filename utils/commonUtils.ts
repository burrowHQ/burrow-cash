export function deepCopy(o) {
  if (!o) return o;
  return JSON.parse(JSON.stringify(o));
}
export function safeJSONParse<T>(str: string): T | undefined {
  try {
    return JSON.parse(str) as T;
  } catch (e) {
    console.error("safeJSONParse", e);
    return undefined;
  }
}

export function safeJSONStringify(obj: any): string | undefined {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    console.error("safeJSONStringify", e);
    return undefined;
  }
}
export function storageStore(namespace?: string, options?: { storage?: Storage }) {
  if (typeof window === "undefined") return;
  const _namespace = namespace || "default";
  const storage = options?.storage || window?.localStorage;
  const namespaceKey = (key: string) => {
    return _namespace + ":" + key;
  };
  return {
    set(key: string, value: any) {
      const _value = safeJSONStringify(value);
      _value ? storage.setItem(namespaceKey(key), _value) : storage.removeItem(namespaceKey(key));
    },
    get<T>(key: string) {
      const _value = storage.getItem(namespaceKey(key));
      return _value ? safeJSONParse<T>(_value) : undefined;
    },
    remove(key: string) {
      storage.removeItem(namespaceKey(key));
    },
    clearAll: function clearAll() {
      for (const key in storage) {
        if (key.startsWith(namespace + ":")) {
          storage.removeItem(key);
        }
      }
    },
  };
}

export function getPageTypeFromUrl() {
  const url = new URL(window.location.href);
  const search = new URLSearchParams(url.search);
  return search.get("pageType");
}
