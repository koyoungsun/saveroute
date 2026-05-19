"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { resolveAdminGate } from "@/lib/admin/auth";
import { recordPromoSlotHistory, type PromoSlotSnapshot } from "@/lib/admin/promo-slot-history";
import { parsePromoSlotForm, type PromoSlotFormState } from "@/lib/promoSlotForm";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function createPromoSlotAction(
  _prevState: PromoSlotFormState,
  formData: FormData,
): Promise<PromoSlotFormState> {
  const result = parsePromoSlotForm(formData);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  const gate = await resolveAdminGate();
  if (gate.type !== "ok") {
    return { message: "관리자 권한이 필요합니다." };
  }

  const supabase = createSupabaseAdminClient();
  const { data: inserted, error } = await supabase
    .from("promo_slots")
    .insert(result.payload)
    .select(
      "id,title,description,badge,image_url,link_type,href,hashtags,priority,is_active,is_sponsored,sponsor_name,starts_at,ends_at,click_count,impression_count,created_at,updated_at",
    )
    .single();

  if (error) {
    return {
      message: `프로모션 구좌 등록에 실패했습니다: ${error.message}`,
    };
  }

  try {
    await recordPromoSlotHistory(supabase, {
      slot: inserted as PromoSlotSnapshot,
      eventType: "created",
      reason: "관리자 신규 등록",
      createdBy: gate.adminUser.userId,
    });
  } catch (historyError) {
    console.error(historyError);
  }

  revalidatePath("/admin/promo-slots");
  revalidatePath("/admin/promo-slots/history");
  revalidatePath("/");
  redirect("/admin/promo-slots");
}
