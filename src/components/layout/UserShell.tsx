import { BottomTab } from "@/components/layout/BottomTab";

interface UserShellProps {
  children: React.ReactNode;
}

export function UserShell({ children }: UserShellProps) {
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-surface-muted">
      <main className="pb-16">{children}</main>
      <BottomTab />
    </div>
  );
}
