"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useZoom } from "@/components/settings/ZoomProvider";
import {
  ZOOM_LEVELS,
  type ZoomLevel,
  formatZoomPercent,
} from "@/lib/settings/zoom-level";
import { cn } from "@/lib/utils";

type ZoomLevelPickerProps = {
  isOpen: boolean;
  onClose: () => void;
};

function ZoomLevelPicker({ isOpen, onClose }: ZoomLevelPickerProps) {
  const { level, setLevel } = useZoom();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      return;
    }

    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) {
    return null;
  }

  const handleSelect = (nextLevel: ZoomLevel) => {
    setLevel(nextLevel);
    onClose();
  };

  return createPortal(
    <div
      className="sr-user-zoom-picker sr-user-zoom-picker--mobile"
      data-open={visible ? "true" : "false"}
    >
      <button
        type="button"
        className="sr-user-zoom-picker__overlay"
        aria-label="글자 크기 선택 닫기"
        onClick={onClose}
      />

      <div
        role="listbox"
        aria-label="글자 크기"
        className="sr-user-zoom-picker__panel"
      >
        <p className="sr-user-zoom-picker__title">글자 크기</p>
        <div className="sr-user-zoom-picker__options">
          {ZOOM_LEVELS.map((option) => {
            const isSelected = option === level;

            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option)}
                className={cn(
                  "sr-user-zoom-picker__option",
                  isSelected && "sr-user-zoom-picker__option--active",
                )}
              >
                {formatZoomPercent(option)}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function MobileZoomControl() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="sr-user-zoom-control sr-user-zoom-control--mobile">
        <button
          type="button"
          className="sr-user-zoom-control__fab"
          aria-label="글자 크기 선택"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          onClick={() => setIsOpen(true)}
        >
          Aa
        </button>
      </div>

      <ZoomLevelPicker isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export function UserZoomControl() {
  return <MobileZoomControl />;
}
