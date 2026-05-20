import type { SupabaseClient } from "@supabase/supabase-js";

export const MEMBERSHIP_PRODUCT_TYPE = "membership" as const;
export const MEMBERSHIP_PROVIDER_TYPE = "membership_company" as const;
export const MEMBERSHIP_ALL_GRADE = "전체";
export const MEMBERSHIP_ALL_BENEFIT_TYPE = "all";

export function buildMembershipAllProductCode(providerCode: string): string {
  return `${providerCode.trim().toLowerCase()}_membership_all`;
}

export function buildMembershipAllProductName(providerName: string): string {
  const trimmed = providerName.trim();
  if (!trimmed) {
    return "멤버십 전체";
  }
  if (trimmed.endsWith("전체")) {
    return trimmed;
  }
  return `${trimmed} 전체`;
}

export function isMembershipCatalogProvider(input: {
  categoryCode: string;
  providerType: string;
}): boolean {
  return (
    input.categoryCode === "membership" &&
    input.providerType === MEMBERSHIP_PROVIDER_TYPE
  );
}

type EnsureMembershipAllProductInput = {
  benefitCategoryId: number;
  providerId: number;
  providerCode: string;
  providerName: string;
  isActive?: boolean;
};

export async function ensureMembershipAllProduct(
  supabase: SupabaseClient,
  input: EnsureMembershipAllProductInput,
): Promise<{ productId: number; created: boolean }> {
  const code = buildMembershipAllProductCode(input.providerCode);
  const name = buildMembershipAllProductName(input.providerName);
  const isActive = input.isActive ?? true;

  const { data: existing, error: existingError } = await supabase
    .from("benefit_products")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("benefit_products")
      .update({
        benefit_category_id: input.benefitCategoryId,
        provider_id: input.providerId,
        name,
        product_type: MEMBERSHIP_PRODUCT_TYPE,
        grade: MEMBERSHIP_ALL_GRADE,
        benefit_type: MEMBERSHIP_ALL_BENEFIT_TYPE,
        is_all_product: true,
        is_active: isActive,
        is_mvno: false,
        mvno_notice_required: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { productId: existing.id as number, created: false };
  }

  const { data: created, error: insertError } = await supabase
    .from("benefit_products")
    .insert({
      benefit_category_id: input.benefitCategoryId,
      provider_id: input.providerId,
      name,
      code,
      product_type: MEMBERSHIP_PRODUCT_TYPE,
      grade: MEMBERSHIP_ALL_GRADE,
      card_type: null,
      benefit_type: MEMBERSHIP_ALL_BENEFIT_TYPE,
      is_all_product: true,
      is_active: isActive,
      is_mvno: false,
      mvno_notice_required: false,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    throw new Error(insertError?.message ?? "membership all product insert failed");
  }

  return { productId: created.id as number, created: true };
}

export async function syncMembershipCatalogForProvider(
  supabase: SupabaseClient,
  providerId: number,
): Promise<void> {
  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select(
      "id,code,name,benefit_category_id,provider_type,is_active,benefit_categories(code)",
    )
    .eq("id", providerId)
    .maybeSingle();

  if (providerError || !provider) {
    throw new Error(providerError?.message ?? "provider not found");
  }

  const category = Array.isArray(provider.benefit_categories)
    ? provider.benefit_categories[0]
    : provider.benefit_categories;
  const categoryCode = (category as { code?: string } | null)?.code ?? "";

  if (
    !isMembershipCatalogProvider({
      categoryCode,
      providerType: String(provider.provider_type),
    })
  ) {
    return;
  }

  await ensureMembershipAllProduct(supabase, {
    benefitCategoryId: provider.benefit_category_id as number,
    providerId: provider.id as number,
    providerCode: String(provider.code),
    providerName: String(provider.name),
    isActive: Boolean(provider.is_active),
  });
}
