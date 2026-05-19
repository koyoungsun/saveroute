"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
    .select("id")
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

  const { error } = await supabase.from("providers").insert({
    name: input.name,
    code: input.code,
    benefit_category_id: input.benefitCategoryId,
    provider_type: input.providerType,
    official_url: input.officialUrl,
    logo_url: input.logoUrl,
    display_order: input.displayOrder,
    memo: input.memo,
    is_active: input.isActive,
  });

  if (error) {
    return {
      message: `제공사 등록에 실패했습니다: ${error.message}`,
      ...mapUniqueCodeError(error),
    };
  }

  revalidatePath("/admin/providers");
  redirect("/admin/providers");
}
