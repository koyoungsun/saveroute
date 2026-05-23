"use client";

import { Search } from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { submitExplicitSearch } from "@/lib/search/submit-explicit-search";
import { emitNavigationTransitionStart } from "@/lib/user/navigation-transition-events";
import { cn } from "@/lib/utils";

const SEARCH_LABEL = "할인브랜드 입력";
const SEARCH_SUBMIT_PARTICLE_COUNT = 6;

interface SearchBarProps {
  defaultValue?: string;
  hideSuggestions?: boolean;
}

type BrandSuggestion = {
  id: number;
  name: string;
  slug: string;
};

export function SearchBar({ defaultValue = "", hideSuggestions = false }: SearchBarProps) {
  const router = useRouter();
  const inputId = useId();
  const [keyword, setKeyword] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<BrandSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const submittingRef = useRef(false);
  const trimmedKeyword = keyword.trim();
  const canSuggest = trimmedKeyword.length >= 1;
  const isFieldActive = isFocused || trimmedKeyword.length > 0;

  useEffect(() => {
    setKeyword(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (hideSuggestions) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
      setActiveIndex(-1);
      return;
    }

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
  }, [hideSuggestions, canSuggest, trimmedKeyword]);

  const submitSearch = (value = keyword) => {
    const nextKeyword = value.trim();
    if (!nextKeyword || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setShowSuggestions(false);
    emitNavigationTransitionStart(
      "search",
      `/search?keyword=${encodeURIComponent(nextKeyword)}`,
    );
    void submitExplicitSearch(router, nextKeyword).finally(() => {
      submittingRef.current = false;
      setIsSubmitting(false);
    });
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

    if (hideSuggestions) {
      return;
    }

    setShowSuggestions(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (hideSuggestions) {
      if (event.key === "Enter") {
        event.preventDefault();
        submitSearch();
      }
      return;
    }

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

  const shouldShowDropdown = !hideSuggestions && showSuggestions && canSuggest;

  return (
    <form onSubmit={handleSubmit} className="sr-user-search-form box-border flex w-full max-w-full flex-col">
      <div className="sr-user-search-bar-anchor">
        <div
          className={cn(
            "sr-user-search-bar",
            isFieldActive && "sr-user-search-bar--active",
            isFocused && "sr-user-search-bar--focused",
          )}
        >
          <div className="sr-user-search-bar__ring">
            <div className="sr-user-search-bar__shell">
              <span className="sr-user-search-bar__sweep" aria-hidden="true" />
              <Search
                className="sr-user-search-bar__icon"
                strokeWidth={2.25}
                aria-hidden="true"
              />
              <input
                id={inputId}
                type="search"
                value={keyword}
                onBlur={() => {
                  setIsFocused(false);
                  window.setTimeout(() => setShowSuggestions(false), 120);
                }}
                onChange={handleChange}
                onFocus={() => {
                  setIsFocused(true);
                  if (!hideSuggestions && canSuggest) {
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                className="sr-user-search-bar__input"
                aria-autocomplete="list"
                aria-controls="brand-suggestions"
                aria-label={SEARCH_LABEL}
              />
              <label htmlFor={inputId} className="sr-user-search-bar__label">
                {SEARCH_LABEL}
              </label>
            </div>
          </div>
        </div>

        {shouldShowDropdown ? (
          <div
            id="brand-suggestions"
            className="sr-user-search-suggestions"
            role="listbox"
          >
            {loadingSuggestions ? (
              <div className="sr-user-search-suggestions__status">검색 중...</div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className={cn(
                    "sr-user-search-suggestions__item",
                    index === activeIndex && "sr-user-search-suggestions__item--active",
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    submitSearch(suggestion.name);
                  }}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <span className="sr-user-search-suggestions__name">{suggestion.name}</span>
                  <span className="sr-user-search-suggestions__slug">{suggestion.slug}</span>
                </button>
              ))
            ) : (
              <div className="sr-user-search-suggestions__status">검색 결과 없음</div>
            )}
          </div>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="sr-user-search-form__submit sr-user-btn-primary sr-user-btn-primary--block sr-user-btn-primary--compact"
      >
        {Array.from({ length: SEARCH_SUBMIT_PARTICLE_COUNT }, (_, index) => (
          <span
            key={index}
            className={`sr-user-search-form__particle sr-user-search-form__particle--${index + 1}`}
            aria-hidden="true"
          />
        ))}
        <span className="sr-user-search-form__submit-text">검색</span>
      </button>
    </form>
  );
}
