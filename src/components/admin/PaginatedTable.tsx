"use client";

import { ReactNode, useMemo, useState } from "react";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { StatusLegend } from "@/components/admin/StatusLegend";

type LegendType = "discount" | "request" | "account" | "generic";

export function PaginatedTable({
  title,
  legendType,
  pageSize,
  fixedRows,
  columns,
  rows,
  className,
}: {
  title: string;
  legendType?: LegendType;
  pageSize: number;
  fixedRows: number;
  columns: { header: string; className?: string }[];
  rows: ReactNode[][];
  className?: string;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize]);

  const baseNo = (safePage - 1) * pageSize;

  return (
    <div className={["card", className].filter(Boolean).join(" ")}>
      <div className="card-header bg-white fw-semibold">
        {title}
        {legendType ? (
          <div className="mt-2">
            <StatusLegend type={legendType} />
          </div>
        ) : null}
      </div>

      <div
        className="table-responsive"
        style={{ minHeight: `${fixedRows * 44 + 54}px` }}
      >
        <table className="table table-hover table-sm align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: "72px" }}>No.</th>
              {columns.map((col) => (
                <th key={col.header} className={col.className}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((cells, i) => {
              return (
                <tr key={baseNo + i + 1}>
                  <td className="text-center">{baseNo + i + 1}</td>
                  {cells.map((cell, idx) => (
                    <td key={idx}>{cell}</td>
                  ))}
                </tr>
              );
            })}
            {paged.length < fixedRows
              ? Array.from({ length: fixedRows - paged.length }).map((_, idx) => (
                  <tr key={`empty-${idx}`} aria-hidden="true">
                    <td>&nbsp;</td>
                    {columns.map((_, cIdx) => (
                      <td key={cIdx}>&nbsp;</td>
                    ))}
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>

      <div className="card-body d-flex justify-content-end">
        <AdminPagination
          page={safePage}
          totalItems={rows.length}
          pageSize={pageSize}
          onChange={setPage}
        />
      </div>
    </div>
  );
}

