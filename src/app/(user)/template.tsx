"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { DataPageReveal } from "@/components/layout/DataPageReveal";
import { isDataPageRoute } from "@/lib/user/page-transition-flags";

export default function UserTemplate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";

  if (isDataPageRoute(pathname)) {
    return <DataPageReveal>{children}</DataPageReveal>;
  }

  return children;
}
