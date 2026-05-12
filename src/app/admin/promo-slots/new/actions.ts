"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("promo_slots").insert(result.payload);

  if (error) {
    return {
      message: `프로모션 구좌 등록에 실패했습니다: ${error.message}`,
    };
  }

  revalidatePath("/admin/promo-slots");
  revalidatePath("/");
  redirect("/admin/promo-slots");
}
