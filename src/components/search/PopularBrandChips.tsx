"use client";

import { useRouter } from "next/navigation";

interface PopularBrandChipsProps {
  brands: string[];
}

export function PopularBrandChips({ brands }: PopularBrandChipsProps) {
  const router = useRouter();

  const handleClick = (brand: string) => {
    router.push(`/search?keyword=${encodeURIComponent(brand)}`);
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
            className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm"
          >
            {brand}
          </button>
        ))}
      </div>
    </section>
  );
}
