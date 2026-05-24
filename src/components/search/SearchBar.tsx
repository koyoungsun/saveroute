"use client";

import { Search } from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { submitExplicitSearch } from "@/lib/search/submit-explicit-search";
import { emitNavigationTransitionStart } from "@/lib/user/navigation-transition-events";
import { cn } from "@/lib/utils";

const SEARCH_LABEL = "할인브랜드 입력";
const SEARCH_SUBMIT_PARTICLE_COUNT = 6;
const SUGGESTION_BLUR_CLOSE_MS = 180;

interface SearchBarProps {
  defaultValue?: string;
  hideSuggestions?: boolean;
}

type BrandSuggestion = {
  id: number;
  name: string;
  slug: string;
};

type SuggestionDropdownLayout = {
  top: number;
  left: number;
  width: number;
};

export function SearchBar({ defaultValue = "", hideSuggestions = false }: SearchBarProps) {
  const router = useRouter();
  const inputId = useId();
  const listboxId = `${inputId}-suggestions`;
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const suppressBlurCloseRef = useRef(false);
  const blurCloseTimerRef = useRef<number | null>(null);

  const [keyword, setKeyword] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<BrandSuggestion[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState<SuggestionDropdownLayout | null>(null);

  const submittingRef = useRef(false);
  const trimmedKeyword = keyword.trim();
  const canSuggest = trimmedKeyword.length >= 1;
  const isFieldActive = isFocused || trimmedKeyword.length > 0;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setKeyword(defaultValue);
  }, [defaultValue]);

  const clearBlurCloseTimer = useCallback(() => {
    if (blurCloseTimerRef.current) {
      window.clearTimeout(blurCloseTimerRef.current);
      blurCloseTimerRef.current = null;
    }
  }, []);

  const dismissKeyboard = useCallback(() => {
    inputRef.current?.blur();
  }, []);

  const closeSuggestions = useCallback(() => {
    clearBlurCloseTimer();
    setIsSuggestionsOpen(false);
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    setLoadingSuggestions(false);
  }, [clearBlurCloseTimer]);

  const updateDropdownLayout = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    setDropdownLayout({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (hideSuggestions) {
      closeSuggestions();
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
          setIsSuggestionsOpen(true);
          setActiveSuggestionIndex(-1);
        })
        .catch((error: unknown) => {
          if ((error as { name?: string }).name !== "AbortError") {
            setSuggestions([]);
            setIsSuggestionsOpen(true);
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
  }, [hideSuggestions, canSuggest, trimmedKeyword, closeSuggestions]);

  const shouldShowDropdown = !hideSuggestions && isSuggestionsOpen && canSuggest;

  useEffect(() => {
    if (!shouldShowDropdown) {
      setDropdownLayout(null);
      return;
    }

    updateDropdownLayout();

    const handleLayoutChange = () => {
      updateDropdownLayout();
    };

    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("scroll", handleLayoutChange, true);
    window.visualViewport?.addEventListener("resize", handleLayoutChange);
    window.visualViewport?.addEventListener("scroll", handleLayoutChange);

    return () => {
      window.removeEventListener("resize", handleLayoutChange);
      window.removeEventListener("scroll", handleLayoutChange, true);
      window.visualViewport?.removeEventListener("resize", handleLayoutChange);
      window.visualViewport?.removeEventListener("scroll", handleLayoutChange);
    };
  }, [shouldShowDropdown, updateDropdownLayout, trimmedKeyword]);

  useEffect(() => {
    return () => {
      clearBlurCloseTimer();
    };
  }, [clearBlurCloseTimer]);

  const submitSearch = useCallback(
    (value = keyword) => {
      const nextKeyword = value.trim();
      if (!nextKeyword || submittingRef.current) {
        return;
      }

      submittingRef.current = true;
      setIsSubmitting(true);
      closeSuggestions();
      dismissKeyboard();

      emitNavigationTransitionStart(
        "search",
        `/search?keyword=${encodeURIComponent(nextKeyword)}`,
      );
      void submitExplicitSearch(router, nextKeyword).finally(() => {
        submittingRef.current = false;
        setIsSubmitting(false);
      });
    },
    [keyword, closeSuggestions, dismissKeyboard, router],
  );

  const handleSuggestionPick = useCallback(
    (suggestionName: string) => {
      suppressBlurCloseRef.current = false;
      setKeyword(suggestionName);
      submitSearch(suggestionName);
    },
    [submitSearch],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSearch();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextKeyword = event.target.value;
    setKeyword(nextKeyword);

    if (!nextKeyword.trim()) {
      closeSuggestions();
      return;
    }

    if (hideSuggestions) {
      return;
    }

    setIsSuggestionsOpen(true);
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
      setIsSuggestionsOpen(true);
      setActiveSuggestionIndex((current) =>
        suggestions.length === 0 ? -1 : (current + 1) % suggestions.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsSuggestionsOpen(true);
      setActiveSuggestionIndex((current) =>
        suggestions.length === 0
          ? -1
          : (current - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (isSuggestionsOpen && activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
        handleSuggestionPick(suggestions[activeSuggestionIndex].name);
        return;
      }

      submitSearch();
      return;
    }

    if (event.key === "Escape") {
      closeSuggestions();
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    clearBlurCloseTimer();
    blurCloseTimerRef.current = window.setTimeout(() => {
      if (suppressBlurCloseRef.current) {
        suppressBlurCloseRef.current = false;
        return;
      }

      setIsSuggestionsOpen(false);
      setActiveSuggestionIndex(-1);
    }, SUGGESTION_BLUR_CLOSE_MS);
  };

  const suggestionsDropdown =
    shouldShowDropdown && dropdownLayout ? (
      <div
        id={listboxId}
        className="sr-user-search-suggestions sr-user-search-suggestions--portal"
        role="listbox"
        style={{
          top: dropdownLayout.top,
          left: dropdownLayout.left,
          width: dropdownLayout.width,
        }}
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
                index === activeSuggestionIndex && "sr-user-search-suggestions__item--active",
              )}
              onPointerDown={(event) => {
                event.preventDefault();
                suppressBlurCloseRef.current = true;
                handleSuggestionPick(suggestion.name);
              }}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              role="option"
              aria-selected={index === activeSuggestionIndex}
            >
              <span className="sr-user-search-suggestions__name">{suggestion.name}</span>
              <span className="sr-user-search-suggestions__slug">{suggestion.slug}</span>
            </button>
          ))
        ) : (
          <div className="sr-user-search-suggestions__status">검색 결과 없음</div>
        )}
      </div>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="sr-user-search-form box-border flex w-full max-w-full flex-col">
      <div ref={anchorRef} className="sr-user-search-bar-anchor">
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
                ref={inputRef}
                id={inputId}
                type="search"
                enterKeyHint="search"
                value={keyword}
                onBlur={handleInputBlur}
                onChange={handleChange}
                onFocus={() => {
                  setIsFocused(true);
                  if (!hideSuggestions && canSuggest) {
                    setIsSuggestionsOpen(true);
                    updateDropdownLayout();
                  }
                }}
                onKeyDown={handleKeyDown}
                className="sr-user-search-bar__input"
                aria-autocomplete="list"
                aria-controls={shouldShowDropdown ? listboxId : undefined}
                aria-expanded={shouldShowDropdown}
                aria-label={SEARCH_LABEL}
              />
              <label htmlFor={inputId} className="sr-user-search-bar__label">
                {SEARCH_LABEL}
              </label>
            </div>
          </div>
        </div>
      </div>

      {isMounted && suggestionsDropdown
        ? createPortal(
            <div className="sr-user-app sr-user-search-suggestions-portal-host">{suggestionsDropdown}</div>,
            document.body,
          )
        : null}

      <button
        type="submit"
        disabled={isSubmitting}
        onPointerDown={() => {
          dismissKeyboard();
        }}
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
