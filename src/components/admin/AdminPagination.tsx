"use client";

import { useMemo } from "react";

export function AdminPagination({
  page,
  totalItems,
  pageSize,
  onChange,
  className,
}: {
  page: number;
  totalItems: number;
  pageSize: number;
  onChange: (nextPage: number) => void;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const pageNumbers = useMemo(() => {
    const maxNumbers = 5;
    if (totalPages <= maxNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxNumbers / 2);
    let start = safePage - half;
    let end = safePage + half;

    if (start < 1) {
      start = 1;
      end = maxNumbers;
    }

    if (end > totalPages) {
      end = totalPages;
      start = totalPages - maxNumbers + 1;
    }

    const result: number[] = [];
    for (let n = start; n <= end; n += 1) {
      result.push(n);
    }
    return result;
  }, [safePage, totalPages]);

  const canGoPrev = safePage > 1;
  const canGoNext = safePage < totalPages;

  return (
    <nav
      className={className}
      aria-label="Pagination"
      style={{ minHeight: "36px" }}
    >
      <ul className="pagination pagination-sm mb-0">
        {totalPages > 5 ? (
          <>
            <li className={`page-item ${canGoPrev ? "" : "disabled"}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => onChange(1)}
                aria-label="First"
                disabled={!canGoPrev}
              >
                «
              </button>
            </li>
            <li className={`page-item ${canGoPrev ? "" : "disabled"}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => onChange(safePage - 1)}
                aria-label="Previous"
                disabled={!canGoPrev}
              >
                ‹
              </button>
            </li>
          </>
        ) : null}

        {pageNumbers.map((n) => (
          <li key={n} className={`page-item ${n === safePage ? "active" : ""}`}>
            <button type="button" className="page-link" onClick={() => onChange(n)}>
              {n}
            </button>
          </li>
        ))}

        {totalPages > 5 ? (
          <>
            <li className={`page-item ${canGoNext ? "" : "disabled"}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => onChange(safePage + 1)}
                aria-label="Next"
                disabled={!canGoNext}
              >
                ›
              </button>
            </li>
            <li className={`page-item ${canGoNext ? "" : "disabled"}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => onChange(totalPages)}
                aria-label="Last"
                disabled={!canGoNext}
              >
                »
              </button>
            </li>
          </>
        ) : null}
      </ul>
    </nav>
  );
}

