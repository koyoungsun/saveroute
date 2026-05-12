"use client";

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { saveRecentSearch } from "./recentSearchesStorage";

interface SearchBarProps {
  defaultValue?: string;
}

type BrandSuggestion = {
  id: number;
  name: string;
  slug: string;
};

export function SearchBar({ defaultValue = "" }: SearchBarProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<BrandSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const trimmedKeyword = keyword.trim();
  const canSuggest = trimmedKeyword.length >= 1;

  useEffect(() => {
    if (!canSuggest) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoadingSuggestions(true);
      fetch(`/api/brand-suggestions?q=${encodeURIComponent(trimmedKeyword)}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : { suggestions: [] }))
        .then((data: { suggestions?: BrandSuggestion[] }) => {
          setSuggestions(data.suggestions ?? []);
          setShowSuggestions(true);
          setActiveIndex(-1);
        })
        .catch((error: unknown) => {
          if ((error as { name?: string }).name !== "AbortError") {
            setSuggestions([]);
            setShowSuggestions(true);
          }
        })
        .finally(() => {
          setLoadingSuggestions(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [canSuggest, trimmedKeyword]);

  const submitSearch = (value = keyword) => {
    const nextKeyword = value.trim();
    if (!nextKeyword) {
      return;
    }

    setShowSuggestions(false);
    saveRecentSearch(nextKeyword);
    router.push(`/search?keyword=${encodeURIComponent(nextKeyword)}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSearch();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextKeyword = event.target.value;
    setKeyword(nextKeyword);

    if (!nextKeyword.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
      setActiveIndex(-1);
      return;
    }

    setShowSuggestions(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setShowSuggestions(true);
      setActiveIndex((current) =>
        suggestions.length === 0 ? -1 : (current + 1) % suggestions.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setShowSuggestions(true);
      setActiveIndex((current) =>
        suggestions.length === 0
          ? -1
          : (current - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (showSuggestions && activeIndex >= 0 && suggestions[activeIndex]) {
        submitSearch(suggestions[activeIndex].name);
        return;
      }

      submitSearch();
      return;
    }

    if (event.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const shouldShowDropdown = showSuggestions && canSuggest;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="relative mx-auto w-[70%]">
        <input
          type="search"
          value={keyword}
          onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
          onChange={handleChange}
          onFocus={() => {
            if (canSuggest) setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="할인받고 싶은 브랜드를 입력하세요!"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-gray-900 outline-none focus:ring-2 focus:ring-orange-500"
          aria-autocomplete="list"
          aria-controls="brand-suggestions"
        />

        {shouldShowDropdown ? (
          <div
            id="brand-suggestions"
            className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-lg"
            role="listbox"
          >
            {loadingSuggestions ? (
              <div className="px-4 py-3 text-sm text-gray-400">검색 중...</div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className={
                    index === activeIndex
                      ? "block w-full bg-orange-50 px-4 py-3 text-left text-sm text-orange-700"
                      : "block w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                  }
                  onMouseDown={(event) => {
                    event.preventDefault();
                    submitSearch(suggestion.name);
                  }}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <span className="block font-medium">{suggestion.name}</span>
                  <span className="block text-xs text-gray-400">
                    {suggestion.slug}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-400">
                검색 결과 없음
              </div>
            )}
          </div>
        ) : null}
      </div>

      <button
        type="submit"
        className="mx-auto mt-2 flex h-12 w-[70%] items-center justify-center rounded-3xl bg-sr-primary font-semibold text-white hover:bg-sr-primary-hover"
      >
        검색
      </button>
    </form>
  );
}
