"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/write-admin-audit-log";
import { syncMembershipCatalogForProvider } from "@/lib/benefits/membership-catalog";

import {
  type ProviderFormState,
  mapUniqueCodeError,
  validateProviderForm,
} from "./form-shared";

export type { ProviderFormState } from "./form-shared";

export async function createProviderAction(
  _prevState: ProviderFormState,
  formData: FormData,
): Promise<ProviderFormState> {
  const validated = validateProviderForm(formData);
  if (!validated.ok) {
    return validated.state;
  }

  const input = validated.data;

  const supabase = createSupabaseAdminClient();

  const { data: category, error: categoryError } = await supabase
    .from("benefit_categories")
    .select("id,code")
    .eq("id", input.benefitCategoryId)
    .eq("is_active", true)
    .maybeSingle();

  if (categoryError || !category) {
    return {
      fieldErrors: {
        benefit_category_id: "활성 혜택 카테고리를 선택해 주세요.",
      },
      message: categoryError?.message,
    };
  }

  if (category.code === "membership" && input.providerType !== "membership_company") {
    return {
      fieldErrors: {
        provider_type: "membership 카테고리는 membership_company 유형만 사용할 수 있습니다.",
      },
    };
  }

  if (category.code !== "membership" && input.providerType === "membership_company") {
    return {
      fieldErrors: {
        provider_type: "membership_company는 membership 카테고리에서만 사용할 수 있습니다.",
      },
    };
  }

  const { data: created, error } = await supabase
    .from("providers")
    .insert({
      name: input.name,
      code: input.code,
      benefit_category_id: input.benefitCategoryId,
      provider_type: input.providerType,
      official_url: input.officialUrl,
      logo_url: input.logoUrl,
      display_order: input.displayOrder,
      memo: input.memo,
      is_active: input.isActive,
    })
    .select("id")
    .single();

  if (error || !created) {
    return {
      message: `제공사 등록에 실패했습니다: ${error?.message ?? "unknown error"}`,
      ...(error ? mapUniqueCodeError(error) : {}),
    };
  }

  try {
    await syncMembershipCatalogForProvider(supabase, created.id as number);
  } catch (syncError) {
    await supabase.from("providers").delete().eq("id", created.id);
    return {
      message:
        syncError instanceof Error
          ? `멤버십 전체 상품 생성에 실패했습니다: ${syncError.message}`
          : "멤버십 전체 상품 생성에 실패했습니다.",
    };
  }

  await writeAdminAuditLog({
    action: "create",
    targetTable: "providers",
    targetId: created.id as number,
    summary: `제공사 생성: ${input.name}`,
    afterData: { name: input.name, code: input.code },
  });

  revalidatePath("/admin/providers");
  revalidatePath("/admin/benefit-products");
  redirect("/admin/providers");
}
