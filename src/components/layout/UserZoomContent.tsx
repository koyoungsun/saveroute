"use client";

import type { ReactNode } from "react";

type UserZoomContentProps = {
  children: ReactNode;
};

export function UserZoomContent({ children }: UserZoomContentProps) {
  return (
    <div className="sr-user-zoom-viewport relative flex min-h-0 flex-1 flex-col overflow-visible">
      <div className="sr-user-zoom-content relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
