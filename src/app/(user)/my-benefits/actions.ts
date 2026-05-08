"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type BenefitActionState = {
  message?: string;
  fieldErrors?: Partial<
    Record<"benefit_category_id" | "provider_id" | "benefit_product_id", string>
  >;
};

function readPositiveInteger(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function requireSession() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    redirect("/auth/login?redirect=/my-benefits");
  }

  return { supabase, userId: data.session.user.id };
}

export async function addUserBenefitAction(
  _prevState: BenefitActionState,
  formData: FormData,
): Promise<BenefitActionState> {
  const benefitCategoryId = readPositiveInteger(formData, "benefit_category_id");
  const providerId = readPositiveInteger(formData, "provider_id");
  const benefitProductId = readPositiveInteger(formData, "benefit_product_id");

  const fieldErrors: BenefitActionState["fieldErrors"] = {};
  if (!benefitCategoryId) {
    fieldErrors.benefit_category_id = "혜택 카테고리를 선택해 주세요.";
  }
  if (!providerId) {
    fieldErrors.provider_id = "제공사를 선택해 주세요.";
  }
  if (!benefitProductId) {
    fieldErrors.benefit_product_id = "혜택상품을 선택해 주세요.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const { supabase, userId } = await requireSession();
  const [
    { data: category, error: categoryError },
    { data: provider, error: providerError },
    { data: product, error: productError },
  ] = await Promise.all([
    supabase
      .from("benefit_categories")
      .select("id")
      .eq("id", benefitCategoryId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("providers")
      .select("benefit_category_id")
      .eq("id", providerId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("benefit_products")
      .select("benefit_category_id,provider_id")
      .eq("id", benefitProductId)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  if (categoryError || !category) {
    return {
      fieldErrors: {
        benefit_category_id: "활성 혜택 카테고리를 선택해 주세요.",
      },
      message: categoryError?.message,
    };
  }

  if (providerError || !provider) {
    return {
      fieldErrors: {
        provider_id: "활성 제공사를 선택해 주세요.",
      },
      message: providerError?.message,
    };
  }

  if (provider.benefit_category_id !== benefitCategoryId) {
    return {
      fieldErrors: {
        provider_id: "선택한 카테고리에 속한 제공사를 선택해 주세요.",
      },
    };
  }

  if (productError || !product) {
    return {
      fieldErrors: {
        benefit_product_id: "활성 혜택상품을 선택해 주세요.",
      },
      message: productError?.message,
    };
  }

  if (
    product.benefit_category_id !== benefitCategoryId ||
    product.provider_id !== providerId
  ) {
    return {
      fieldErrors: {
        benefit_product_id:
          "선택한 카테고리와 제공사에 속한 혜택상품을 선택해 주세요.",
      },
    };
  }

  const row = {
    user_id: userId,
    benefit_category_id: benefitCategoryId,
    provider_id: providerId,
    benefit_product_id: benefitProductId,
    is_active: true,
  };

  const { error: insertError } = await supabase.from("user_benefits").insert(row);

  if (insertError?.code === "23505") {
    const { error: reactivateError } = await supabase
      .from("user_benefits")
      .update({ is_active: true })
      .eq("user_id", userId)
      .eq("benefit_category_id", benefitCategoryId)
      .eq("provider_id", providerId)
      .eq("benefit_product_id", benefitProductId);

    if (reactivateError) {
      return {
        message: `혜택 저장에 실패했습니다: ${reactivateError.message}`,
      };
    }
  } else if (insertError) {
    return {
      message: `혜택 저장에 실패했습니다: ${insertError.message}`,
    };
  }

  revalidatePath("/my-benefits");
  return { message: "혜택이 저장되었습니다." };
}

export async function deactivateUserBenefitAction(formData: FormData) {
  const benefitId = readPositiveInteger(formData, "user_benefit_id");

  if (!benefitId) {
    return;
  }

  const { supabase, userId } = await requireSession();
  await supabase
    .from("user_benefits")
    .update({ is_active: false })
    .eq("id", benefitId)
    .eq("user_id", userId);

  revalidatePath("/my-benefits");
}
