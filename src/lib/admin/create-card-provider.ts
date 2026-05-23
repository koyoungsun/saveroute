import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createInlineProvider,
  findExistingInlineProviderByName,
  type CreateInlineProviderInput,
  type CreateInlineProviderResult,
  type InlineProviderOption,
} from "@/lib/admin/create-inline-provider";

export type CardProviderOption = InlineProviderOption;

export type CreateCardProviderInput = CreateInlineProviderInput;

export type CreateCardProviderResult =
  | {
      ok: true;
      provider: CardProviderOption;
      allProductId: number;
      created: boolean;
    }
  | {
      ok: false;
      reason: "duplicate";
      existingProvider: CardProviderOption;
      message: string;
    }
  | {
      ok: false;
      reason: "validation" | "error";
      message: string;
    };

export async function findExistingCardProviderByName(
  supabase: SupabaseClient,
  benefitCategoryId: number,
  name: string,
): Promise<CardProviderOption | null> {
  return findExistingInlineProviderByName(supabase, benefitCategoryId, name);
}

export async function createCardProvider(
  supabase: SupabaseClient,
  input: CreateCardProviderInput,
): Promise<CreateCardProviderResult> {
  const result = await createInlineProvider(supabase, input);

  if (!result.ok) {
    return result;
  }

  if (result.categoryCode !== "card") {
    return {
      ok: false,
      reason: "validation",
      message: "카드 카테고리에서만 카드사를 추가할 수 있습니다.",
    };
  }

  if (result.allProductId == null) {
    return {
      ok: false,
      reason: "error",
      message: "카드사 전체 상품 생성에 실패했습니다.",
    };
  }

  return {
    ok: true,
    provider: result.provider,
    allProductId: result.allProductId,
    created: result.created,
  };
}
