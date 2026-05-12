const RECENT_SEARCHES_KEY = "saveroute:recent-searches";
const RECENT_SEARCH_LIMIT = 3;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseRecentSearches(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function getRecentSearches() {
  if (!canUseStorage()) {
    return [];
  }

  return parseRecentSearches(window.localStorage.getItem(RECENT_SEARCHES_KEY))
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, RECENT_SEARCH_LIMIT);
}

export function saveRecentSearch(keyword: string) {
  if (!canUseStorage()) {
    return [];
  }

  const nextKeyword = keyword.trim();
  if (!nextKeyword) {
    return getRecentSearches();
  }

  const recentSearches = getRecentSearches();
  const nextSearches = [
    nextKeyword,
    ...recentSearches.filter(
      (item) => item.toLocaleLowerCase() !== nextKeyword.toLocaleLowerCase(),
    ),
  ].slice(0, RECENT_SEARCH_LIMIT);

  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextSearches));
  window.dispatchEvent(new Event("saveroute:recent-searches-updated"));

  return nextSearches;
}
