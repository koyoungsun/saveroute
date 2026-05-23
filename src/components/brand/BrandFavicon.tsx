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

function BrandFaviconFallback({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gray-100 sr-user-accent-text ring-1 ring-gray-200",
        className,
      )}
      style={{ height: size, minWidth: size, width: size }}
    >
      <svg aria-hidden="true" className="size-[58%]" fill="none" viewBox="0 0 24 24">
        <path
          d="M5 5h6v6H5V5Zm8 0h6v6h-6V5ZM5 13h6v6H5v-6Zm8 0h6v6h-6v-6Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

export function BrandFavicon({
  brandName,
  officialUrl,
  size = 28,
  className,
}: BrandFaviconProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const faviconUrl = getBrandFaviconUrl(officialUrl, 64);

  if (!faviconUrl || loadFailed) {
    return <BrandFaviconFallback size={size} className={className} />;
  }

  return (
    // Dynamic third-party favicons are intentionally loaded with a plain img.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={`${brandName} 아이콘`}
      className={cn(
        "inline-block shrink-0 rounded-full bg-white object-contain ring-1 ring-gray-200",
        className,
      )}
      decoding="async"
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      src={faviconUrl}
      width={size}
      onError={() => setLoadFailed(true)}
    />
  );
}
