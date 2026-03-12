import { useEffect, useState } from "react";

export default function usePageIntroLoader(storageKey, delay = 800) {
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return !window.sessionStorage.getItem(storageKey);
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!loading) return;

    const timer = setTimeout(() => {
      setLoading(false);
      try {
        window.sessionStorage.setItem(storageKey, "true");
      } catch {
        /* ignore */
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [loading, storageKey, delay]);

  return loading;
}
