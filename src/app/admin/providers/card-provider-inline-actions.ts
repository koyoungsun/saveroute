"use server";

import { revalidatePath } from "next/cache";

import { resolveAdminGate } from "@/lib/admin/auth";
import {
  createInlineProvider,
  type InlineProviderOption,
} from "@/lib/admin/create-inline-provider";
import type { DiscountBenefitProductOption } from "@/lib/benefits/discount-product-options";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/write-admin-audit-log";

const ALL_PRODUCT_SELECT =
  "id,name,benefit_category_id,provider_id,benefit_type,is_all_product,product_type,grade,code,name_normalized";

export type CreateProviderInlineInput = {
  benefitCategoryId: number;
  name: string;
  isActive?: boolean;
};

export type CreateProviderInlineResult =
  | {
      ok: true;
      provider: InlineProviderOption;
      allProduct?: DiscountBenefitProductOption;
      created: boolean;
      message?: string;
    }
  | {
      ok: false;
      duplicateProvider?: InlineProviderOption;
      message: string;
    };

/** @deprecated Use CreateProviderInlineInput */
export type CreateCardProviderInlineInput = CreateProviderInlineInput;

/** @deprecated Use CreateProviderInlineResult */
export type CreateCardProviderInlineResult = CreateProviderInlineResult;

function mapAllProductRow(row: Record<string, unknown>): DiscountBenefitProductOption {
  return {
    id: row.id as number,
    name: row.name as string,
    benefit_category_id: row.benefit_category_id as number,
    provider_id: row.provider_id as number,
    benefit_type: (row.benefit_type as string | null) ?? null,
    is_all_product: Boolean(row.is_all_product),
    product_type: (row.product_type as string | null) ?? null,
    grade: (row.grade as string | null) ?? null,
    code: (row.code as string | null) ?? null,
    name_normalized: (row.name_normalized as string | null) ?? null,
  };
}

export async function createProviderInlineAction(
  input: CreateProviderInlineInput,
): Promise<CreateProviderInlineResult> {
  const gate = await resolveAdminGate();
  if (gate.type !== "ok") {
    return { ok: false, message: "관리자 권한이 필요합니다." };
  }

  const benefitCategoryId = Number(input.benefitCategoryId);
  const name = input.name?.trim() ?? "";

  if (!Number.isInteger(benefitCategoryId) || benefitCategoryId <= 0) {
    return { ok: false, message: "혜택 카테고리 정보가 올바르지 않습니다." };
  }

  const supabase = createSupabaseAdminClient();
  const result = await createInlineProvider(supabase, {
    benefitCategoryId,
    name,
    isActive: input.isActive ?? true,
  });

  if (!result.ok) {
    if (result.reason === "duplicate") {
      return {
        ok: false,
        duplicateProvider: result.existingProvider,
        message: result.message,
      };
    }

    return { ok: false, message: result.message };
  }

  let allProduct: DiscountBenefitProductOption | undefined;
  if (result.allProductId != null) {
    const { data: allProductRow } = await supabase
      .from("benefit_products")
      .select(ALL_PRODUCT_SELECT)
      .eq("id", result.allProductId)
      .maybeSingle();

    if (allProductRow) {
      allProduct = mapAllProductRow(allProductRow as Record<string, unknown>);
    }
  }

  if (result.created) {
    const summaryLabel =
      result.categoryCode === "card"
        ? `신규 카드사 추가: ${result.provider.name}`
        : `신규 멤버십 제공사 추가: ${result.provider.name}`;

    await writeAdminAuditLog({
      action: "create",
      targetTable: "providers",
      targetId: result.provider.id,
      summary: summaryLabel,
      afterData: {
        name: result.provider.name,
        benefit_category_id: benefitCategoryId,
        category_code: result.categoryCode,
      },
    });
  }

  revalidatePath("/admin/providers");
  revalidatePath("/admin/benefit-products");
  revalidatePath("/admin/discounts/new");
  revalidatePath("/admin/discounts");

  const successMessage =
    result.categoryCode === "card"
      ? "카드사가 추가되었습니다."
      : "제공사가 추가되었습니다.";

  return {
    ok: true,
    provider: result.provider,
    allProduct,
    created: result.created,
    message: successMessage,
  };
}

export async function createCardProviderInlineAction(
  input: CreateProviderInlineInput,
): Promise<CreateProviderInlineResult> {
  return createProviderInlineAction(input);
}
