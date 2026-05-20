"use server";

import { revalidatePath } from "next/cache";

import { resolveAdminGate } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/write-admin-audit-log";

export type ProviderRequestFormState = {
  ok?: boolean;
  message?: string;
};

export async function createProviderRequestAction(
  _prev: ProviderRequestFormState,
  formData: FormData,
): Promise<ProviderRequestFormState> {
  const providerName = String(formData.get("provider_name") ?? "").trim();
  const category = String(formData.get("category") ?? "card").trim() || "card";

  if (!providerName || providerName.length > 120) {
    return { message: "카드사명을 1~120자로 입력해 주세요." };
  }

  const gate = await resolveAdminGate();
  if (gate.type !== "ok") {
    return { message: "관리자 권한이 필요합니다." };
  }

  const supabase = createSupabaseAdminClient();

  const { data: existingProvider } = await supabase
    .from("providers")
    .select("id")
    .eq("provider_type", "card_company")
    .ilike("name", providerName)
    .maybeSingle();

  if (existingProvider) {
    return { message: "이미 등록된 카드사입니다. 제공사 목록에서 선택해 주세요." };
  }

  const { data: pendingRequest } = await supabase
    .from("provider_requests")
    .select("id")
    .eq("status", "pending")
    .ilike("provider_name", providerName)
    .maybeSingle();

  if (pendingRequest) {
    return { message: "동일 카드사명의 승인 대기 요청이 이미 있습니다." };
  }

  const now = new Date().toISOString();
  const { data: inserted, error } = await supabase
    .from("provider_requests")
    .insert({
      provider_name: providerName,
      category,
      request_user: gate.adminUser.email ?? gate.adminUser.userId,
      request_user_id: gate.adminUser.userId,
      requested_at: now,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { message: `카드사 요청 등록에 실패했습니다: ${error?.message ?? "unknown error"}` };
  }

  await writeAdminAuditLog({
    action: "create",
    targetTable: "provider_requests",
    targetId: inserted.id as number,
    summary: `카드사 요청 등록: ${providerName}`,
    afterData: { provider_name: providerName, category },
  });

  revalidatePath("/admin/provider-requests");
  revalidatePath("/admin/discounts/new");
  revalidatePath("/admin/discounts");

  return {
    ok: true,
    message: "카드사 요청이 등록되었습니다. 승인 후 제공사 목록에 표시됩니다.",
  };
}
