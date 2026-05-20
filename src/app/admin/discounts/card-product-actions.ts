"use server";

import { revalidatePath } from "next/cache";

import {
  createCardBenefitProduct,
  type CardBenefitType,
} from "@/lib/admin/create-card-benefit-product";
import type { DiscountBenefitProductOption } from "@/lib/benefits/discount-product-options";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/write-admin-audit-log";

export type CreateCardBenefitProductInlineInput = {
  benefitCategoryId: number;
  providerId: number;
  name: string;
  benefitType: CardBenefitType;
  isActive?: boolean;
  code?: string;
};

export type CreateCardBenefitProductInlineResult =
  | {
      ok: true;
      product: DiscountBenefitProductOption;
      created: boolean;
      message?: string;
    }
  | {
      ok: false;
      duplicateProduct?: DiscountBenefitProductOption;
      message: string;
    };

export async function createCardBenefitProductInlineAction(
  input: CreateCardBenefitProductInlineInput,
): Promise<CreateCardBenefitProductInlineResult> {
  const benefitCategoryId = Number(input.benefitCategoryId);
  const providerId = Number(input.providerId);
  const name = input.name?.trim() ?? "";
  const benefitType = input.benefitType;

  if (!Number.isInteger(benefitCategoryId) || benefitCategoryId <= 0) {
    return { ok: false, message: "카드 카테고리 정보가 올바르지 않습니다." };
  }

  if (!Number.isInteger(providerId) || providerId <= 0) {
    return { ok: false, message: "카드사를 선택해 주세요." };
  }

  if (benefitType !== "credit" && benefitType !== "debit") {
    return { ok: false, message: "카드 유형을 선택해 주세요." };
  }

  const supabase = createSupabaseAdminClient();
  const [
    { data: category, error: categoryError },
    { data: provider, error: providerError },
  ] = await Promise.all([
    supabase
      .from("benefit_categories")
      .select("id,code")
      .eq("id", benefitCategoryId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("providers")
      .select("id,benefit_category_id,provider_type")
      .eq("id", providerId)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  if (categoryError || !category) {
    return { ok: false, message: "활성 카드 카테고리를 확인할 수 없습니다." };
  }

  if (category.code !== "card") {
    return { ok: false, message: "카드 카테고리에서만 신규 카드를 추가할 수 있습니다." };
  }

  if (providerError || !provider) {
    return { ok: false, message: "활성 카드사를 확인할 수 없습니다." };
  }

  if (provider.benefit_category_id !== benefitCategoryId) {
    return { ok: false, message: "선택한 카드사가 카드 카테고리와 일치하지 않습니다." };
  }

  if (provider.provider_type !== "card_company") {
    return { ok: false, message: "카드 상품은 card_company 제공사에만 추가할 수 있습니다." };
  }

  const result = await createCardBenefitProduct(supabase, {
    benefitCategoryId,
    providerId,
    name,
    benefitType,
    isActive: input.isActive ?? true,
    code: input.code?.trim() || undefined,
  });

  if (!result.ok) {
    if (result.reason === "duplicate") {
      return {
        ok: false,
        duplicateProduct: result.existingProduct,
        message: result.message,
      };
    }

    return { ok: false, message: result.message };
  }

  if (result.created) {
    await writeAdminAuditLog({
      action: "create",
      targetTable: "benefit_products",
      targetId: result.product.id,
      summary: `신규 카드 추가: ${result.product.name}`,
      afterData: {
        name: result.product.name,
        provider_id: providerId,
        benefit_type: benefitType,
      },
    });
  }

  revalidatePath("/admin/discounts/new");
  revalidatePath("/admin/discounts");
  revalidatePath("/admin/benefit-products");

  return {
    ok: true,
    product: result.product,
    created: result.created,
    message: "카드 상품이 추가되었습니다.",
  };
}
