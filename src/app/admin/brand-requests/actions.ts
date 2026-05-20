"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/write-admin-audit-log";

const ALLOWED_STATUSES = ["pending", "reviewing", "completed", "rejected"] as const;

export async function updateBrandRequestStatusAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const statusRaw = String(formData.get("status") ?? "").trim();

  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  if (!ALLOWED_STATUSES.includes(statusRaw as (typeof ALLOWED_STATUSES)[number])) {
    return;
  }

  const status = statusRaw as (typeof ALLOWED_STATUSES)[number];
  const now = new Date().toISOString();

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: fetchError } = await supabase
    .from("brand_requests")
    .select("id,keyword,status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    console.error("brand_requests fetch failed", fetchError?.message);
    return;
  }

  const { error } = await supabase
    .from("brand_requests")
    .update({ status, updated_at: now })
    .eq("id", id);

  if (error) {
    console.error("brand_requests update failed", error.message);
    return;
  }

  await writeAdminAuditLog({
    action: "status_change",
    targetTable: "brand_requests",
    targetId: id,
    summary: `업데이트 요청 상태 변경: ${existing.keyword} → ${status}`,
    beforeData: { status: existing.status },
    afterData: { status, keyword: existing.keyword },
  });

  revalidatePath("/admin/brand-requests");
  revalidatePath("/admin/update-check");
}
