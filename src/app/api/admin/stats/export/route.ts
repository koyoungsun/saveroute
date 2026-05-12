import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

import { resolveAdminGate } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PeriodType = "daily" | "weekly" | "monthly" | "custom";
type ExportTarget = "search" | "click" | "request" | "user_benefits";

const targetConfig: Record<
  ExportTarget,
  { filenamePrefix: string; sheetName: string }
> = {
  search: {
    filenamePrefix: "saveroute_search_stats",
    sheetName: "Search Stats",
  },
  click: {
    filenamePrefix: "saveroute_click_stats",
    sheetName: "Click Stats",
  },
  request: {
    filenamePrefix: "saveroute_request_stats",
    sheetName: "Request Stats",
  },
  user_benefits: {
    filenamePrefix: "saveroute_user_benefits_stats",
    sheetName: "User Benefits Stats",
  },
};

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateInput(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function resolveDateRange(url: URL) {
  const period = url.searchParams.get("period") as PeriodType | null;
  const periodType: PeriodType =
    period === "weekly" || period === "monthly" || period === "custom"
      ? period
      : "daily";
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  let start = new Date(today);
  const end = new Date(today);

  if (periodType === "weekly") {
    start.setUTCDate(start.getUTCDate() - 6);
  } else if (periodType === "monthly") {
    start.setUTCDate(start.getUTCDate() - 30);
  } else if (periodType === "custom") {
    const customStart = parseDateInput(url.searchParams.get("start"));
    const customEnd = parseDateInput(url.searchParams.get("end"));

    if (!customStart || !customEnd) {
      return { error: "직접 기간 선택 시 시작일과 종료일이 필요합니다." };
    }

    start = customStart;
    end.setTime(customEnd.getTime());
  }

  const diffDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (diffDays < 1) {
    return { error: "종료일은 시작일 이후여야 합니다." };
  }

  if (diffDays > 31) {
    return { error: "다운로드 기간은 최대 31일까지 가능합니다." };
  }

  return {
    periodType,
    start,
    end,
    startKey: toDateKey(start),
    endKey: toDateKey(end),
  };
}

function styleWorksheet(worksheet: ExcelJS.Worksheet) {
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8F5EA" },
  };
  worksheet.columns.forEach((column) => {
    column.width = Math.max(column.header?.toString().length ?? 10, 16);
  });
}

async function loadRows(target: ExportTarget, startKey: string, endKey: string) {
  const supabase = createSupabaseAdminClient();

  if (target === "search") {
    const { data, error } = await supabase
      .from("daily_search_stats")
      .select("date,total_search_count,matched_search_count,unmatched_search_count")
      .gte("date", startKey)
      .lte("date", endKey)
      .order("date", { ascending: true });

    if (error) throw new Error(error.message);

    return {
      columns: [
        { header: "date", key: "date" },
        { header: "total_search_count", key: "total_search_count" },
        { header: "matched_search_count", key: "matched_search_count" },
        { header: "unmatched_search_count", key: "unmatched_search_count" },
      ],
      rows: data ?? [],
    };
  }

  if (target === "click") {
    const { data, error } = await supabase
      .from("brand_daily_stats")
      .select("date,brand_id,search_count,detail_view_count,discount_click_count")
      .gte("date", startKey)
      .lte("date", endKey)
      .order("date", { ascending: true })
      .order("discount_click_count", { ascending: false });

    if (error) throw new Error(error.message);

    return {
      columns: [
        { header: "date", key: "date" },
        { header: "brand_id", key: "brand_id" },
        { header: "search_count", key: "search_count" },
        { header: "detail_view_count", key: "detail_view_count" },
        { header: "discount_click_count", key: "discount_click_count" },
      ],
      rows: data ?? [],
    };
  }

  if (target === "request") {
    const { data, error } = await supabase
      .from("brand_request_daily_stats")
      .select("date,normalized_keyword,request_count")
      .gte("date", startKey)
      .lte("date", endKey)
      .order("date", { ascending: true })
      .order("request_count", { ascending: false });

    if (error) throw new Error(error.message);

    return {
      columns: [
        { header: "date", key: "date" },
        { header: "normalized_keyword", key: "normalized_keyword" },
        { header: "request_count", key: "request_count" },
      ],
      rows: data ?? [],
    };
  }

  const endExclusive = new Date(`${endKey}T00:00:00.000Z`);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  const { data, error } = await supabase
    .from("user_benefits")
    .select("created_at,benefit_category_id,provider_id,benefit_product_id,benefit_type")
    .gte("created_at", `${startKey}T00:00:00.000Z`)
    .lt("created_at", endExclusive.toISOString())
    .order("created_at", { ascending: true })
    .limit(10000);

  if (error) throw new Error(error.message);

  const aggregate = new Map<string, Record<string, string | number | null>>();
  for (const row of data ?? []) {
    const date = String(row.created_at).slice(0, 10);
    const key = [
      date,
      row.benefit_category_id,
      row.provider_id,
      row.benefit_product_id ?? "none",
      row.benefit_type ?? "none",
    ].join("|");
    const existing = aggregate.get(key) ?? {
      date,
      benefit_category_id: row.benefit_category_id,
      provider_id: row.provider_id,
      benefit_product_id: row.benefit_product_id,
      benefit_type: row.benefit_type,
      registration_count: 0,
    };
    existing.registration_count = Number(existing.registration_count) + 1;
    aggregate.set(key, existing);
  }

  return {
    columns: [
      { header: "date", key: "date" },
      { header: "benefit_category_id", key: "benefit_category_id" },
      { header: "provider_id", key: "provider_id" },
      { header: "benefit_product_id", key: "benefit_product_id" },
      { header: "benefit_type", key: "benefit_type" },
      { header: "registration_count", key: "registration_count" },
    ],
    rows: [...aggregate.values()],
  };
}

export async function GET(request: Request) {
  const gate = await resolveAdminGate();

  if (gate.type === "login") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (gate.type === "denied") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (gate.type === "schema") {
    return NextResponse.json(
      { error: "Database configuration error", detail: gate.detail },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const target = url.searchParams.get("target") as ExportTarget | null;
  if (!target || !(target in targetConfig)) {
    return NextResponse.json({ error: "Invalid export target" }, { status: 400 });
  }

  const range = resolveDateRange(url);
  if ("error" in range) {
    return NextResponse.json({ error: range.error }, { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SaveRoute";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(targetConfig[target].sheetName);
  const { columns, rows } = await loadRows(target, range.startKey, range.endKey);
  worksheet.columns = columns;
  worksheet.addRows(rows);
  styleWorksheet(worksheet);

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `${targetConfig[target].filenamePrefix}_${range.endKey}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
