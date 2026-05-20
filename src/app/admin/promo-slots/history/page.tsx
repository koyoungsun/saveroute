import Link from "next/link";

import { PaginatedTable } from "@/components/admin/PaginatedTable";
import {
  PROMO_SLOT_EVENT_LABELS,
  type PromoSlotEventType,
} from "@/lib/admin/promo-slot-history";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PromoSlotHistoryRow = {
  id: number;
  promo_slot_id: string | null;
  title: string;
  link_url: string;
  ended_at: string | null;
  final_click_count: number;
  event_type: PromoSlotEventType;
  created_by: string | null;
  created_at: string;
};

type AdminAccountRow = {
  user_id: string;
  email: string | null;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function PromoSlotHistoryPage() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("promo_slot_histories")
    .select(
      "id,promo_slot_id,title,link_url,ended_at,final_click_count,event_type,created_by,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Failed to load promo slot histories: ${error.message}`);
  }

  const histories = (data ?? []) as PromoSlotHistoryRow[];
  const actorIds = [
    ...new Set(histories.map((row) => row.created_by).filter(Boolean)),
  ] as string[];

  const actorEmailById = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: adminRows } = await supabase
      .from("admin_accounts")
      .select("user_id,email")
      .in("user_id", actorIds);

    for (const admin of (adminRows ?? []) as AdminAccountRow[]) {
      actorEmailById.set(admin.user_id, admin.email ?? admin.user_id);
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Promo Slot History</h1>
          <p className="text-muted mb-0">
            추천 구좌 종료·비활성·삭제 등 이벤트 이력입니다.
          </p>
        </div>
        <Link href="/admin/promo-slots" className="btn btn-outline-secondary">
          구좌 목록
        </Link>
      </div>

      <PaginatedTable
        title="추천 구좌 종료 히스토리"
        legendType="generic"
        pageSize={10}
        fixedRows={10}
        className="sr-block"
        columns={[
          { header: "이벤트" },
          { header: "제목" },
          { header: "종료일" },
          { header: "최종 클릭" },
          { header: "처리자" },
          { header: "처리일" },
        ]}
        rowKeys={histories.map((row) => row.id)}
        rows={histories.map((row) => [
          <span
            key={`${row.id}-event`}
            className="badge text-bg-light text-dark border fw-semibold"
          >
            {PROMO_SLOT_EVENT_LABELS[row.event_type] ?? row.event_type}
          </span>,
          <div key={`${row.id}-title`}>
            <div className="fw-semibold">{row.title}</div>
            {row.promo_slot_id ? (
              <div className="small text-muted">slot #{row.promo_slot_id}</div>
            ) : (
              <div className="small text-muted">원본 구좌 삭제됨</div>
            )}
          </div>,
          formatDateTime(row.ended_at),
          row.final_click_count.toLocaleString("ko-KR"),
          row.created_by
            ? actorEmailById.get(row.created_by) ?? row.created_by
            : "시스템",
          formatDateTime(row.created_at),
        ])}
      />
    </>
  );
}
