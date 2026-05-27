"use client";

import { useMemo } from "react";

export function AdminPagination({
  page,
  totalItems,
  pageSize,
  onChange,
  className,
  groupSize = 5,
  showPrevNext = false,
  showJumpByGroup = false,
}: {
  page: number;
  totalItems: number;
  pageSize: number;
  onChange: (nextPage: number) => void;
  className?: string;
  /** Number of page numbers to display at once */
  groupSize?: number;
  /** Show previous/next page buttons */
  showPrevNext?: boolean;
  /** Show previous/next group jump (e.g. 10 pages) */
  showJumpByGroup?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const pageNumbers = useMemo(() => {
    const maxNumbers = Math.max(1, groupSize);
    if (totalPages <= maxNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Group by maxNumbers (e.g. 1-10, 11-20 ...)
    const groupIndex = Math.floor((safePage - 1) / maxNumbers);
    let start = groupIndex * maxNumbers + 1;
    let end = Math.min(totalPages, start + maxNumbers - 1);
    if (end - start + 1 < maxNumbers) {
      start = Math.max(1, end - maxNumbers + 1);
    }

    const result: number[] = [];
    for (let n = start; n <= end; n += 1) {
      result.push(n);
    }
    return result;
  }, [groupSize, safePage, totalPages]);

  const canGoPrev = safePage > 1;
  const canGoNext = safePage < totalPages;

  const firstInGroup = pageNumbers[0] ?? 1;
  const lastInGroup = pageNumbers[pageNumbers.length - 1] ?? 1;
  const prevGroupPage = Math.max(1, firstInGroup - 1);
  const nextGroupPage = Math.min(totalPages, lastInGroup + 1);

  return (
    <nav
      className={className}
      aria-label="Pagination"
      style={{ minHeight: "36px" }}
    >
      <ul className="pagination pagination-sm mb-0">
        {showJumpByGroup ? (
          <li className={`page-item ${safePage > 1 ? "" : "disabled"}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => onChange(prevGroupPage)}
              aria-label="Previous group"
              disabled={safePage <= 1}
            >
              «
            </button>
          </li>
        ) : null}

        {showPrevNext ? (
          <li className={`page-item ${canGoPrev ? "" : "disabled"}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => onChange(safePage - 1)}
              aria-label="Previous page"
              disabled={!canGoPrev}
            >
              ‹
            </button>
          </li>
        ) : null}

        {pageNumbers.map((n) => (
          <li key={n} className={`page-item ${n === safePage ? "active" : ""}`}>
            <button type="button" className="page-link" onClick={() => onChange(n)}>
              {n}
            </button>
          </li>
        ))}

        {showPrevNext ? (
          <li className={`page-item ${canGoNext ? "" : "disabled"}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => onChange(safePage + 1)}
              aria-label="Next page"
              disabled={!canGoNext}
            >
              ›
            </button>
          </li>
        ) : null}

        {showJumpByGroup ? (
          <li className={`page-item ${safePage < totalPages ? "" : "disabled"}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => onChange(nextGroupPage)}
              aria-label="Next group"
              disabled={safePage >= totalPages}
            >
              »
            </button>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

