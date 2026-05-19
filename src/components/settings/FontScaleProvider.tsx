"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  FONT_SCALE_DEFAULT,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SCALE_STEP,
  applyFontScaleToDocument,
  clampFontScalePercent,
  readFontScalePercent,
  writeFontScalePercent,
} from "@/lib/settings/font-scale";

type FontScaleContextValue = {
  percent: number;
  decrease: () => void;
  increase: () => void;
  reset: () => void;
};

const FontScaleContext = createContext<FontScaleContextValue | null>(null);

export function useFontScale(): FontScaleContextValue {
  const ctx = useContext(FontScaleContext);
  if (!ctx) {
    throw new Error("useFontScale는 FontScaleProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}

export function FontScaleProvider({ children }: { children: ReactNode }) {
  const [percent, setPercent] = useState(FONT_SCALE_DEFAULT);

  useEffect(() => {
    const saved = readFontScalePercent();
    setPercent(saved);
    applyFontScaleToDocument(saved);
  }, []);

  const persistAndApply = useCallback((nextPercent: number) => {
    const clamped = clampFontScalePercent(nextPercent);
    applyFontScaleToDocument(clamped);
    writeFontScalePercent(clamped);
    return clamped;
  }, []);

  const decrease = useCallback(() => {
    setPercent((prev) => persistAndApply(prev - FONT_SCALE_STEP));
  }, [persistAndApply]);

  const increase = useCallback(() => {
    setPercent((prev) => persistAndApply(prev + FONT_SCALE_STEP));
  }, [persistAndApply]);

  const reset = useCallback(() => {
    setPercent(() => persistAndApply(FONT_SCALE_DEFAULT));
  }, [persistAndApply]);

  const value = useMemo(
    (): FontScaleContextValue => ({
      percent,
      decrease,
      increase,
      reset,
    }),
    [percent, decrease, increase, reset],
  );

  return <FontScaleContext.Provider value={value}>{children}</FontScaleContext.Provider>;
}
