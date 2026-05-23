import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ensureCardProviderAllProduct,
  normalizeProviderCode,
} from "@/lib/admin/provider-requests";
import { syncMembershipCatalogForProvider } from "@/lib/benefits/membership-catalog";

export type InlineProviderOption = {
  id: number;
  name: string;
  benefit_category_id: number;
};

export type InlineProviderCategoryCode = "card" | "membership";

export type CreateInlineProviderInput = {
  benefitCategoryId: number;
  name: string;
  isActive?: boolean;
};

export type CreateInlineProviderResult =
  | {
      ok: true;
      provider: InlineProviderOption;
      allProductId: number | null;
      created: boolean;
      categoryCode: InlineProviderCategoryCode;
    }
  | {
      ok: false;
      reason: "duplicate";
      existingProvider: InlineProviderOption;
      message: string;
    }
  | {
      ok: false;
      reason: "validation" | "error";
      message: string;
    };

const CATEGORY_COPY: Record<
  InlineProviderCategoryCode,
  {
    emptyNameMessage: string;
    unsupportedMessage: string;
    duplicateMessage: string;
    insertFailedMessage: string;
    catalogFailedMessage: string;
  }
> = {
  card: {
    emptyNameMessage: "카드사명을 입력해 주세요.",
    unsupportedMessage: "카드 카테고리에서만 카드사를 추가할 수 있습니다.",
    duplicateMessage: "이미 등록된 카드사입니다. 기존 카드사를 선택합니다.",
    insertFailedMessage: "카드사 등록에 실패했습니다.",
    catalogFailedMessage: "카드사 전체 상품 생성에 실패했습니다.",
  },
  membership: {
    emptyNameMessage: "제공사명을 입력해 주세요.",
    unsupportedMessage: "멤버십 카테고리에서만 제공사를 추가할 수 있습니다.",
    duplicateMessage: "이미 등록된 제공사입니다. 기존 제공사를 선택합니다.",
    insertFailedMessage: "제공사 등록에 실패했습니다.",
    catalogFailedMessage: "멤버십 전체 상품 생성에 실패했습니다.",
  },
};

function mapProviderRow(row: Record<string, unknown>): InlineProviderOption {
  return {
    id: row.id as number,
    name: row.name as string,
    benefit_category_id: row.benefit_category_id as number,
  };
}

function providerTypeForCategory(
  categoryCode: InlineProviderCategoryCode,
): "card_company" | "membership_company" {
  return categoryCode === "card" ? "card_company" : "membership_company";
}

function isSupportedCategoryCode(
  code: string,
): code is InlineProviderCategoryCode {
  return code === "card" || code === "membership";
}

export async function findExistingInlineProviderByName(
  supabase: SupabaseClient,
  benefitCategoryId: number,
  name: string,
): Promise<InlineProviderOption | null> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return null;
  }

  const { data, error } = await supabase
    .from("providers")
    .select("id,name,benefit_category_id")
    .eq("benefit_category_id", benefitCategoryId)
    .ilike("name", trimmedName)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProviderRow(data as Record<string, unknown>);
}

async function resolveUniqueProviderCode(
  supabase: SupabaseClient,
  name: string,
): Promise<string> {
  let code = normalizeProviderCode(name);

  const { data: conflict } = await supabase
    .from("providers")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (conflict) {
    code = `${code}_${randomUUID().slice(0, 8)}`;
  }

  return code;
}

async function fetchProviderAllProductId(
  supabase: SupabaseClient,
  providerId: number,
): Promise<number | null> {
  const { data } = await supabase
    .from("benefit_products")
    .select("id")
    .eq("provider_id", providerId)
    .eq("is_all_product", true)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id != null ? (data.id as number) : null;
}

export async function createInlineProvider(
  supabase: SupabaseClient,
  input: CreateInlineProviderInput,
): Promise<CreateInlineProviderResult> {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    return {
      ok: false,
      reason: "validation",
      message: "제공사명을 입력해 주세요.",
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
      ok: false,
      reason: "error",
      message: "활성 혜택 카테고리를 확인할 수 없습니다.",
    };
  }

  if (!isSupportedCategoryCode(category.code)) {
    return {
      ok: false,
      reason: "validation",
      message: "카드 또는 멤버십 카테고리에서만 제공사를 추가할 수 있습니다.",
    };
  }

  const categoryCode = category.code;
  const copy = CATEGORY_COPY[categoryCode];

  if (!trimmedName) {
    return {
      ok: false,
      reason: "validation",
      message: copy.emptyNameMessage,
    };
  }

  const existing = await findExistingInlineProviderByName(
    supabase,
    input.benefitCategoryId,
    trimmedName,
  );

  if (existing) {
    return {
      ok: false,
      reason: "duplicate",
      existingProvider: existing,
      message: copy.duplicateMessage,
    };
  }

  const providerCode = await resolveUniqueProviderCode(supabase, trimmedName);

  const { data: created, error: insertError } = await supabase
    .from("providers")
    .insert({
      name: trimmedName,
      code: providerCode,
      benefit_category_id: input.benefitCategoryId,
      provider_type: providerTypeForCategory(categoryCode),
      is_active: input.isActive ?? true,
      display_order: 500,
    })
    .select("id,name,benefit_category_id")
    .single();

  if (insertError || !created) {
    return {
      ok: false,
      reason: "error",
      message: insertError?.message ?? copy.insertFailedMessage,
    };
  }

  const provider = mapProviderRow(created as Record<string, unknown>);

  try {
    if (categoryCode === "card") {
      const allProductId = await ensureCardProviderAllProduct(supabase, {
        providerId: provider.id,
        providerName: trimmedName,
        providerCode,
      });

      return {
        ok: true,
        provider,
        allProductId,
        created: true,
        categoryCode,
      };
    }

    await syncMembershipCatalogForProvider(supabase, provider.id);
    const allProductId = await fetchProviderAllProductId(supabase, provider.id);

    return {
      ok: true,
      provider,
      allProductId,
      created: true,
      categoryCode,
    };
  } catch (syncError) {
    await supabase.from("providers").delete().eq("id", provider.id);
    return {
      ok: false,
      reason: "error",
      message:
        syncError instanceof Error
          ? `${copy.catalogFailedMessage}: ${syncError.message}`
          : copy.catalogFailedMessage,
    };
  }
}
