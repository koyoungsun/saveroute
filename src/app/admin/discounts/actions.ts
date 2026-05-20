"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/write-admin-audit-log";

export async function hideDiscountAction(formData: FormData) {
  const discountId = Number(formData.get("discount_id"));

  if (!Number.isInteger(discountId) || discountId <= 0) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("discounts")
    .update({ status: "hidden" })
    .eq("id", discountId);

  if (error) {
    console.error("Failed to hide discount.", {
      code: error.code,
      message: error.message,
    });
    return;
  }

  await writeAdminAuditLog({
    action: "deactivate",
    targetTable: "discounts",
    targetId: discountId,
    summary: "할인 비활성(숨김)",
    afterData: { status: "hidden" },
  });

  revalidatePath("/admin/discounts");
}
