"use server";

import { revalidatePath } from "next/cache";

import { approveProviderRequest } from "@/lib/admin/provider-requests";
import { writeAdminAuditLog } from "@/lib/admin/write-admin-audit-log";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function rejectProviderRequestAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const adminMemo = String(formData.get("admin_memo") ?? "").trim();

  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: fetchError } = await supabase
    .from("provider_requests")
    .select("id,provider_name,status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing || existing.status !== "pending") {
    return;
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("provider_requests")
    .update({
      status: "rejected",
      admin_memo: adminMemo || null,
      processed_at: now,
      updated_at: now,
    })
    .eq("id", id);

  if (error) {
    console.error("provider_requests reject failed", error.message);
    return;
  }

  await writeAdminAuditLog({
    action: "status_change",
    targetTable: "provider_requests",
    targetId: id,
    summary: `카드사 요청 반려: ${existing.provider_name}`,
    beforeData: { status: existing.status },
    afterData: { status: "rejected", admin_memo: adminMemo || null },
  });

  revalidatePath("/admin/provider-requests");
  revalidatePath("/admin/providers");
  revalidatePath("/admin/discounts");
}

export async function approveProviderRequestAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  const supabase = createSupabaseAdminClient();

  try {
    const { providerId } = await approveProviderRequest(supabase, id);

    const { data: requestRow } = await supabase
      .from("provider_requests")
      .select("provider_name")
      .eq("id", id)
      .maybeSingle();

    await writeAdminAuditLog({
      action: "create",
      targetTable: "providers",
      targetId: providerId,
      summary: `카드사 요청 승인: ${requestRow?.provider_name ?? id}`,
      afterData: { provider_id: providerId, request_id: id },
    });
  } catch (error) {
    console.error("provider_requests approve failed", error);
    return;
  }

  revalidatePath("/admin/provider-requests");
  revalidatePath("/admin/providers");
  revalidatePath("/admin/benefit-products");
  revalidatePath("/admin/discounts");
}
