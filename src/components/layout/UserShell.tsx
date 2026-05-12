import { UserFooter } from "@/components/layout/UserFooter";
import { UserHeader } from "@/components/layout/UserHeader";

interface UserShellProps {
  children: React.ReactNode;
}

export function UserShell({ children }: UserShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <UserHeader />
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-visible">
        <div className="relative flex min-h-full flex-1 flex-col overflow-visible">
          <img
            src="/icons/bg-tree3.png"
            alt=""
            width={552}
            height={380}
            decoding="async"
            aria-hidden
            className="pointer-events-none absolute left-[-379px] top-[261px] z-[5] hidden min-h-[min(60.375vw,380px)] w-[min(94.875vw,552px)] max-w-none object-contain object-left-top opacity-50 md:block select-none"
          />
          <img
            src="/icons/bg-tree.png"
            alt=""
            width={515}
            height={354}
            decoding="async"
            aria-hidden
            className="pointer-events-none absolute right-[-255px] top-[454px] z-[5] hidden min-h-[min(56.35vw,354.2px)] w-[min(88.55vw,515.2px)] max-w-none object-contain object-right-top opacity-50 md:block select-none"
          />
          <div className="relative z-10 flex flex-1 flex-col">{children}</div>
        </div>
      </main>
      <UserFooter />
    </div>
  );
}
