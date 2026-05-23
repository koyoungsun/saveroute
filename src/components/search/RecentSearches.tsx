"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { submitExplicitSearch } from "@/lib/search/submit-explicit-search";
import { emitNavigationTransitionStart } from "@/lib/user/navigation-transition-events";

import { getRecentSearches } from "./recentSearchesStorage";

export function RecentSearches() {
  const router = useRouter();
  const [recentSearches, setRecentSearches] = useState<string[] | null>(null);

  useEffect(() => {
    const syncRecentSearches = () => {
      setRecentSearches(getRecentSearches());
    };

    syncRecentSearches();
    window.addEventListener("storage", syncRecentSearches);
    window.addEventListener("saveroute:recent-searches-updated", syncRecentSearches);

    return () => {
      window.removeEventListener("storage", syncRecentSearches);
      window.removeEventListener(
        "saveroute:recent-searches-updated",
        syncRecentSearches,
      );
    };
  }, []);

  if (recentSearches === null) {
    return null;
  }

  const handleClick = (keyword: string) => {
    emitNavigationTransitionStart(
      "search",
      `/search?keyword=${encodeURIComponent(keyword)}`,
    );
    void submitExplicitSearch(router, keyword);
  };

  return (
    <section className="mt-4">
      <p className="text-xs font-semibold text-gray-400">최근 검색어</p>
      {recentSearches.length === 0 ? (
        <p className="mt-2 text-xs leading-relaxed text-gray-400">
          브랜드를 검색하면 최근 검색어가 여기에 저장됩니다.
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {recentSearches.map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => handleClick(keyword)}
              className="sr-user-badge rounded-full px-3 py-1.5 text-sm font-medium transition hover:border-[color:var(--sr-primary)]/35"
            >
              {keyword}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
