"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { resolveAdminGate } from "@/lib/admin/auth";
import {
  PROMO_SLOT_SNAPSHOT_SELECT,
  recordPromoSlotHistory,
  resolveLifecycleEventType,
  type PromoSlotSnapshot,
} from "@/lib/admin/promo-slot-history";
import { parsePromoSlotForm, type PromoSlotFormState } from "@/lib/promoSlotForm";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function updatePromoSlotAction(
  slotId: number,
  _prevState: PromoSlotFormState,
  formData: FormData,
): Promise<PromoSlotFormState> {
  if (!Number.isInteger(slotId) || slotId <= 0) {
    return { message: "올바른 프로모션 구좌를 선택해 주세요." };
  }

  const result = parsePromoSlotForm(formData);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  const gate = await resolveAdminGate();
  if (gate.type !== "ok") {
    return { message: "관리자 권한이 필요합니다." };
  }

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("promo_slots")
    .select(PROMO_SLOT_SNAPSHOT_SELECT)
    .eq("id", slotId)
    .maybeSingle();

  if (existingError || !existing) {
    return {
      message: existingError?.message ?? "프로모션 구좌를 찾을 수 없습니다.",
    };
  }

  const before = existing as PromoSlotSnapshot;
  const { error } = await supabase
    .from("promo_slots")
    .update(result.payload)
    .eq("id", slotId);

  if (error) {
    return {
      message: `프로모션 구좌 수정에 실패했습니다: ${error.message}`,
    };
  }

  const lifecycleEvent = resolveLifecycleEventType(
    before.is_active,
    result.payload.is_active,
    result.payload.ends_at,
  );

  if (lifecycleEvent) {
    try {
      await recordPromoSlotHistory(supabase, {
        slot: {
          ...before,
          click_count: before.click_count ?? 0,
          impression_count: before.impression_count ?? 0,
        },
        eventType: lifecycleEvent,
        reason:
          lifecycleEvent === "expired"
            ? "관리자 수정으로 노출 종료"
            : lifecycleEvent === "activated"
              ? "관리자 수정으로 활성화"
              : "관리자 수정으로 비활성화",
        createdBy: gate.adminUser.userId,
      });
    } catch (historyError) {
      console.error(historyError);
    }
  }

  revalidatePath("/admin/promo-slots");
  revalidatePath("/admin/promo-slots/history");
  revalidatePath(`/admin/promo-slots/${slotId}/edit`);
  revalidatePath("/");
  redirect("/admin/promo-slots");
}
