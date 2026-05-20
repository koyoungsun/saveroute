"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncMembershipCatalogForProvider } from "@/lib/benefits/membership-catalog";

import {
  type ProviderFormState,
  mapUniqueCodeError,
  validateProviderForm,
} from "../../form-shared";

export type ProviderEditFormState = ProviderFormState;

export async function updateProviderAction(
  providerId: number,
  _prevState: ProviderEditFormState,
  formData: FormData,
): Promise<ProviderEditFormState> {
  if (!Number.isInteger(providerId) || providerId <= 0) {
    return { message: "올바른 제공사 ID가 아닙니다." };
  }

  const validated = validateProviderForm(formData);
  if (!validated.ok) {
    return validated.state;
  }

  const input = validated.data;
  const supabase = createSupabaseAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("providers")
    .select("id,code")
    .eq("id", providerId)
    .maybeSingle();

  if (existingError || !existing) {
    return {
      message: existingError?.message ?? "제공사를 찾을 수 없습니다.",
    };
  }

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

  if (existing.code !== input.code) {
    const { data: dup } = await supabase
      .from("providers")
      .select("id")
      .eq("code", input.code)
      .neq("id", providerId)
      .maybeSingle();

    if (dup) {
      return {
        fieldErrors: {
          code: "이미 사용 중인 code입니다.",
        },
      };
    }
  }

  const { error } = await supabase
    .from("providers")
    .update({
      name: input.name,
      code: input.code,
      benefit_category_id: input.benefitCategoryId,
      provider_type: input.providerType,
      official_url: input.officialUrl,
      logo_url: input.logoUrl,
      display_order: input.displayOrder,
      memo: input.memo,
      is_active: input.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", providerId);

  if (error) {
    return {
      message: `제공사 수정에 실패했습니다: ${error.message}`,
      ...mapUniqueCodeError(error),
    };
  }

  try {
    await syncMembershipCatalogForProvider(supabase, providerId);
  } catch (syncError) {
    return {
      message:
        syncError instanceof Error
          ? `멤버십 전체 상품 동기화에 실패했습니다: ${syncError.message}`
          : "멤버십 전체 상품 동기화에 실패했습니다.",
    };
  }

  revalidatePath("/admin/providers");
  revalidatePath("/admin/benefit-products");
  revalidatePath(`/admin/providers/${providerId}/edit`);
  redirect("/admin/providers");
}
