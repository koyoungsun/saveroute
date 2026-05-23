"use client";

import { useRouter } from "next/navigation";

import { submitExplicitSearch } from "@/lib/search/submit-explicit-search";
import { emitNavigationTransitionStart } from "@/lib/user/navigation-transition-events";

interface PopularBrandChipsProps {
  brands: string[];
}

export function PopularBrandChips({ brands }: PopularBrandChipsProps) {
  const router = useRouter();

  const handleClick = (brand: string) => {
    emitNavigationTransitionStart(
      "search",
      `/search?keyword=${encodeURIComponent(brand)}`,
    );
    void submitExplicitSearch(router, brand);
  };

  return (
    <section>
      <p className="text-xs text-gray-400">최근 많이 찾은 곳</p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
        {brands.map((brand) => (
          <button
            key={brand}
            type="button"
            onClick={() => handleClick(brand)}
            className="sr-user-badge whitespace-nowrap px-4 py-2 text-sm font-medium shadow-sm transition hover:border-[color:var(--sr-primary)]/35 hover:sr-user-accent-text"
          >
            {brand}
          </button>
        ))}
      </div>
    </section>
  );
}
