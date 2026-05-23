import type { ReactNode } from "react";

import { BrandHubChrome } from "@/components/layout/BrandHubChrome";
import { UserPage } from "@/components/layout/UserPage";
import { cn } from "@/lib/utils";

type ContentPageShellProps = {
  children: ReactNode;
  className?: string;
};

export function ContentPageShell({ children, className }: ContentPageShellProps) {
  return (
    <UserPage
      tone="comfortable"
      className={cn("sr-user-account-page sr-user-content-page sr-user-stack", className)}
    >
      <BrandHubChrome variant="content" />
      <div className="sr-user-content-page__body">{children}</div>
    </UserPage>
  );
}
