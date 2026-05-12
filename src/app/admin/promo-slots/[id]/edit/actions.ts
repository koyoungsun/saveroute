"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("promo_slots")
    .update(result.payload)
    .eq("id", slotId);

  if (error) {
    return {
      message: `프로모션 구좌 수정에 실패했습니다: ${error.message}`,
    };
  }

  revalidatePath("/admin/promo-slots");
  revalidatePath(`/admin/promo-slots/${slotId}/edit`);
  revalidatePath("/");
  redirect("/admin/promo-slots");
}
