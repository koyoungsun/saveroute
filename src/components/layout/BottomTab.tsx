"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Home, User } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/my-benefits",
    label: "My Benefits",
    icon: CreditCard,
  },
  {
    href: "/mypage",
    label: "My Page",
    icon: User,
  },
];

export function BottomTab() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto h-16 max-w-[430px] border-t border-gray-100 bg-white shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
      <div className="flex h-full items-center justify-around px-4">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 text-xs font-medium transition-colors",
                isActive ? "text-blue-600" : "text-gray-400",
              )}
            >
              <Icon className="size-6" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
