"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type UserBottomDockProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
};

const DOCK_ROOT_ID = "sr-user-bottom-dock-root";

/** 모바일 중심 하단 CTA — scale 밖(sr-user-bottom-dock-root)에 렌더 */
export function UserBottomDock({
  children,
  className,
  innerClassName,
}: UserBottomDockProps) {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMountNode(document.getElementById(DOCK_ROOT_ID));
  }, []);

  if (!mountNode) {
    return null;
  }

  return createPortal(
    <div className={cn("sr-user-bottom-dock", className)}>
      <div className={cn("sr-user-bottom-dock__inner", innerClassName)}>{children}</div>
    </div>,
    mountNode,
  );
}
