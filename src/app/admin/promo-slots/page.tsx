import Link from "next/link";

import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatStatusLabel } from "@/lib/ui/format-status-label";

import { togglePromoSlotActiveAction } from "./actions";

type PromoSlotRow = {
  id: string;
  title: string;
  badge: string;
  link_type: "internal" | "external";
  href: string;
  hashtags: string[] | null;
  priority: number;
  is_active: boolean;
  is_sponsored: boolean;
  sponsor_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
  click_count: number;
  impression_count: number;
  updated_at: string;
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

function renderHashtags(hashtags: string[] | null, slotId: string) {
  if (!hashtags?.length) {
    return "-";
  }

  return (
    <div className="d-flex flex-wrap gap-1" key={`${slotId}-hashtags`}>
      {hashtags.map((tag) => (
        <span key={tag} className="badge text-bg-light text-dark border">
          {tag}
        </span>
      ))}
    </div>
  );
}

function getPeriodStatus(slot: PromoSlotRow) {
  const now = Date.now();
  const startsAt = slot.starts_at ? new Date(slot.starts_at).getTime() : null;
  const endsAt = slot.ends_at ? new Date(slot.ends_at).getTime() : null;

  if (!slot.is_active) {
    return "inactive";
  }

  if (startsAt && startsAt > now) {
    return "scheduled";
  }

  if (endsAt && endsAt < now) {
    return "expired";
  }

  return "active";
}

export default async function AdminPromoSlotsPage() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("promo_slots")
    .select(
      `
      id,
      title,
      badge,
      link_type,
      href,
      hashtags,
      priority,
      is_active,
      is_sponsored,
      sponsor_name,
      starts_at,
      ends_at,
      click_count,
      impression_count,
      updated_at
    `,
    )
    .order("priority", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load promo slots: ${error.message}`);
  }

  const promoSlots = (data ?? []) as PromoSlotRow[];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Promo Slots</h1>
          <p className="text-muted mb-0">
            홈 하단 추천 할인 구좌를 운영합니다. 큰 우선순위가 먼저 노출됩니다.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/promo-slots/history" className="btn btn-outline-secondary">
            종료 히스토리
          </Link>
          <Link href="/admin/promo-slots/new" className="btn btn-primary">
            + 구좌 등록
          </Link>
        </div>
      </div>

      <PaginatedTable
        title="프로모션 구좌 목록"
        legendType="generic"
        pageSize={10}
        fixedRows={10}
        className="sr-block"
        columns={[
          { header: "제목" },
          { header: "배지" },
          { header: "타입" },
          { header: "링크" },
          { header: "해시태그" },
          { header: "시작일" },
          { header: "종료일" },
          { header: "우선순위" },
          { header: "상태" },
          { header: "스폰서" },
          { header: "클릭" },
          { header: "노출" },
          { header: "관리" },
        ]}
        rowKeys={promoSlots.map((slot) => slot.id)}
        rows={promoSlots.map((slot) => {
          const periodStatus = getPeriodStatus(slot);
          return [
            <div key={`${slot.id}-title`} className="fw-semibold">
              {slot.title}
            </div>,
            slot.badge,
            <span key={`${slot.id}-type`} className="badge text-bg-light text-dark border">
              {formatStatusLabel(slot.link_type)}
            </span>,
            <a
              key={`${slot.id}-href`}
              href={slot.href}
              target={slot.link_type === "external" ? "_blank" : undefined}
              rel={slot.link_type === "external" ? "noopener noreferrer" : undefined}
            >
              {slot.href}
            </a>,
            renderHashtags(slot.hashtags, slot.id),
            formatDateTime(slot.starts_at),
            formatDateTime(slot.ends_at),
            slot.priority,
            <StatusBadge key={`${slot.id}-status`} status={periodStatus} />,
            slot.is_sponsored ? (
              <span key={`${slot.id}-sponsor`} className="badge text-bg-info">
                {slot.sponsor_name || "스폰서"}
              </span>
            ) : (
              "-"
            ),
            slot.click_count,
            slot.impression_count,
            <div key={`${slot.id}-actions`} className="d-flex gap-2">
              <Link
                href={`/admin/promo-slots/${slot.id}/edit`}
                className="btn btn-outline-secondary btn-sm"
              >
                수정
              </Link>
              <form action={togglePromoSlotActiveAction}>
                <input type="hidden" name="promo_slot_id" value={slot.id} />
                <input
                  type="hidden"
                  name="next_active"
                  value={slot.is_active ? "false" : "true"}
                />
                <button
                  type="submit"
                  className={
                    slot.is_active
                      ? "btn btn-outline-danger btn-sm"
                      : "btn btn-outline-primary btn-sm"
                  }
                >
                  {slot.is_active ? "비활성" : "활성"}
                </button>
              </form>
            </div>,
          ];
        })}
      />
    </>
  );
}
