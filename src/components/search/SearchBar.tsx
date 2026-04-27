"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  defaultValue?: string;
  isLoggedIn?: boolean;
}

export function SearchBar({ defaultValue = "", isLoggedIn = true }: SearchBarProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(defaultValue);

  const submitSearch = () => {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
      return;
    }

    if (isLoggedIn) {
      router.push(`/search?keyword=${encodeURIComponent(trimmedKeyword)}`);
      return;
    }

    const redirectTo = `/search?keyword=${encodeURIComponent(trimmedKeyword)}`;
    router.push(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSearch();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitSearch();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="search"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="어디에서 가장 싸게 쓸 수 있을까요?"
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="mt-2 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
      >
        검색
      </button>
    </form>
  );
}
