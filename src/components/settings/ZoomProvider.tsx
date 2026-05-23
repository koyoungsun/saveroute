"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ZOOM_DEFAULT,
  ZOOM_LEVELS,
  type ZoomLevel,
  getNextZoomLevel,
  getPrevZoomLevel,
  readZoomLevel,
  writeZoomLevel,
} from "@/lib/settings/zoom-level";

type ZoomContextValue = {
  level: ZoomLevel;
  atMin: boolean;
  atMax: boolean;
  decrease: () => void;
  increase: () => void;
  reset: () => void;
  setLevel: (level: ZoomLevel) => void;
};

const ZoomContext = createContext<ZoomContextValue | null>(null);

function applyZoomLevelToDocument(level: ZoomLevel) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.style.setProperty("--sr-zoom-scale", String(level));
}

export function useZoom(): ZoomContextValue {
  const ctx = useContext(ZoomContext);
  if (!ctx) {
    throw new Error("useZoom은 ZoomProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}

export function ZoomProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useState<ZoomLevel>(ZOOM_DEFAULT);

  useLayoutEffect(() => {
    const saved = readZoomLevel();
    setLevel(saved);
    applyZoomLevelToDocument(saved);
  }, []);

  const persist = useCallback((nextLevel: ZoomLevel) => {
    writeZoomLevel(nextLevel);
    applyZoomLevelToDocument(nextLevel);
    setLevel(nextLevel);
  }, []);

  const decrease = useCallback(() => {
    setLevel((prev) => {
      const next = getPrevZoomLevel(prev);
      if (next === prev) {
        return prev;
      }
      writeZoomLevel(next);
      applyZoomLevelToDocument(next);
      return next;
    });
  }, []);

  const increase = useCallback(() => {
    setLevel((prev) => {
      const next = getNextZoomLevel(prev);
      if (next === prev) {
        return prev;
      }
      writeZoomLevel(next);
      applyZoomLevelToDocument(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    persist(ZOOM_DEFAULT);
  }, [persist]);

  const atMin = level === ZOOM_LEVELS[0];
  const atMax = level === ZOOM_LEVELS[ZOOM_LEVELS.length - 1];

  const value = useMemo(
    (): ZoomContextValue => ({
      level,
      atMin,
      atMax,
      decrease,
      increase,
      reset,
      setLevel: persist,
    }),
    [level, atMin, atMax, decrease, increase, reset, persist],
  );

  useEffect(() => {
    applyZoomLevelToDocument(level);
  }, [level]);

  return <ZoomContext.Provider value={value}>{children}</ZoomContext.Provider>;
}
