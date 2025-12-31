import { useCallback, useSyncExternalStore } from "react";

export const useLocalStorage = <T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] => {
  const subscribe = useCallback(
    (callback: () => void) => {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key) {
          callback();
        }
      };
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    },
    [key],
  );

  const getSnapshot = useCallback(() => {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : initialValue;
  }, [key, initialValue]);

  const getServerSnapshot = useCallback(() => initialValue, [initialValue]);

  const storedValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setValue = useCallback(
    (value: T) => {
      window.localStorage.setItem(key, JSON.stringify(value));
      // Dispatch a storage event to trigger re-render
      window.dispatchEvent(new StorageEvent("storage", { key }));
    },
    [key],
  );

  return [storedValue, setValue];
};
