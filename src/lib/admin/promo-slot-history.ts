import type { SupabaseClient } from "@supabase/supabase-js";

export type PromoSlotEventType =
  | "created"
  | "updated"
  | "activated"
  | "deactivated"
  | "expired"
  | "deleted"
  | "completed";

export type PromoSlotSnapshot = {
  id: string;
  title: string;
  description: string;
  badge: string;
  image_url: string | null;
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
  created_at?: string;
  updated_at?: string;
};

export const PROMO_SLOT_EVENT_LABELS: Record<PromoSlotEventType, string> = {
  created: "생성",
  updated: "수정",
  activated: "활성화",
  deactivated: "비활성",
  expired: "종료",
  deleted: "삭제",
  completed: "완료",
};

export const PROMO_SLOT_SNAPSHOT_SELECT =
  "id,title,description,badge,image_url,link_type,href,hashtags,priority,is_active,is_sponsored,sponsor_name,starts_at,ends_at,click_count,impression_count,created_at,updated_at";

type RecordPromoSlotHistoryInput = {
  slot: PromoSlotSnapshot;
  eventType: PromoSlotEventType;
  reason?: string | null;
  createdBy?: string | null;
  promoSlotId?: string | null;
};

export async function recordPromoSlotHistory(
  supabase: SupabaseClient,
  input: RecordPromoSlotHistoryInput,
) {
  const { slot, eventType, reason, createdBy, promoSlotId } = input;

  const { error } = await supabase.from("promo_slot_histories").insert({
    promo_slot_id: promoSlotId ?? slot.id,
    title: slot.title,
    link_url: slot.href,
    image_url: slot.image_url,
    hashtags: slot.hashtags,
    started_at: slot.starts_at,
    ended_at: slot.ends_at,
    final_click_count: slot.click_count ?? 0,
    event_type: eventType,
    reason: reason ?? null,
    snapshot: slot,
    created_by: createdBy ?? null,
  });

  if (error) {
    throw new Error(`Failed to record promo slot history: ${error.message}`);
  }
}

export function resolveLifecycleEventType(
  wasActive: boolean,
  nextActive: boolean,
  endsAt: string | null,
): PromoSlotEventType | null {
  if (wasActive === nextActive) {
    return null;
  }

  if (!wasActive && nextActive) {
    return "activated";
  }

  if (endsAt && new Date(endsAt).getTime() <= Date.now()) {
    return "expired";
  }

  return "deactivated";
}
