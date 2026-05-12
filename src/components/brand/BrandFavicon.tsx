"use client";

import { useState } from "react";

import { getBrandFaviconUrl } from "@/lib/brandFavicon";
import { cn } from "@/lib/utils";

type BrandFaviconProps = {
  brandName: string;
  officialUrl?: string | null;
  size?: number;
  className?: string;
};

export function BrandFavicon({
  brandName,
  officialUrl,
  size = 28,
  className,
}: BrandFaviconProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const faviconUrl = getBrandFaviconUrl(officialUrl, 64);
  const fixedSize = { height: size, minWidth: size, width: size };

  if (!faviconUrl || loadFailed) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500 ring-1 ring-orange-100",
          className,
        )}
        style={fixedSize}
      >
        <svg
          aria-hidden="true"
          className="size-[58%]"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M5 5h6v6H5V5Zm8 0h6v6h-6V5ZM5 13h6v6H5v-6Zm8 0h6v6h-6v-6Z"
            fill="currentColor"
          />
        </svg>
      </span>
    );
  }

  return (
    // Dynamic third-party favicons are intentionally loaded with a plain img.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={brandName}
      className={cn(
        "inline-block shrink-0 rounded-full bg-white object-contain ring-1 ring-gray-200",
        className,
      )}
      height={size}
      src={faviconUrl}
      style={fixedSize}
      width={size}
      onError={() => setLoadFailed(true)}
    />
  );
}
