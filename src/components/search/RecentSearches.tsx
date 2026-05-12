"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getRecentSearches, saveRecentSearch } from "./recentSearchesStorage";

export function RecentSearches() {
  const router = useRouter();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

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

  if (recentSearches.length === 0) {
    return null;
  }

  const handleClick = (keyword: string) => {
    saveRecentSearch(keyword);
    router.push(`/search?keyword=${encodeURIComponent(keyword)}`);
  };

  return (
    <section className="mt-4">
      <p className="text-xs font-semibold text-gray-400">최근 검색어</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {recentSearches.map((keyword) => (
          <button
            key={keyword}
            type="button"
            onClick={() => handleClick(keyword)}
            className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700"
          >
            {keyword}
          </button>
        ))}
      </div>
    </section>
  );
}
