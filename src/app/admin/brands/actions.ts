"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/write-admin-audit-log";

export async function deactivateBrandAction(formData: FormData) {
  const brandId = Number(formData.get("brand_id"));

  if (!Number.isInteger(brandId) || brandId <= 0) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("brands")
    .update({ is_active: false })
    .eq("id", brandId);

  if (error) {
    console.error("Failed to deactivate brand.", {
      code: error.code,
      message: error.message,
    });
    return;
  }

  await writeAdminAuditLog({
    action: "deactivate",
    targetTable: "brands",
    targetId: brandId,
    summary: "브랜드 비활성",
    afterData: { is_active: false },
  });

  revalidatePath("/admin/brands");
}
