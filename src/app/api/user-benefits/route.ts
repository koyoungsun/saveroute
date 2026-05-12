import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

type UserBenefitPayload = {
  benefit_category_id: number;
  provider_id: number;
  benefit_product_id: number;
  benefit_type?: "credit" | "debit" | null;
};

function asPositiveInteger(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const { data, error } = await supabase
    .from("user_benefits")
    .select("id,benefit_category_id,provider_id,benefit_product_id,is_active")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ benefits: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const benefitsRaw = (body as { benefits?: unknown })?.benefits;
  if (!Array.isArray(benefitsRaw)) {
    return NextResponse.json({ error: "benefits must be an array" }, { status: 400 });
  }

  const benefits: UserBenefitPayload[] = [];
  for (const item of benefitsRaw) {
    const benefitCategoryId = asPositiveInteger(
      (item as { benefit_category_id?: unknown })?.benefit_category_id,
    );
    const providerId = asPositiveInteger(
      (item as { provider_id?: unknown })?.provider_id,
    );
    const benefitProductId = asPositiveInteger(
      (item as { benefit_product_id?: unknown })?.benefit_product_id,
    );
    const benefitTypeRaw = (item as { benefit_type?: unknown })?.benefit_type;
    const benefitType =
      benefitTypeRaw === "credit" || benefitTypeRaw === "debit"
        ? benefitTypeRaw
        : null;

    if (!benefitCategoryId || !providerId || !benefitProductId) {
      return NextResponse.json({ error: "Invalid benefit item" }, { status: 400 });
    }

    benefits.push({
      benefit_category_id: benefitCategoryId,
      provider_id: providerId,
      benefit_product_id: benefitProductId,
      benefit_type: benefitType,
    });
  }

  const { error: deactivateError } = await supabase
    .from("user_benefits")
    .update({ is_active: false })
    .eq("user_id", userId);

  if (deactivateError) {
    return NextResponse.json({ error: deactivateError.message }, { status: 500 });
  }

  if (benefits.length === 0) {
    return NextResponse.json({ success: true, empty: true });
  }

  const rowsToInsert = benefits.map((benefit) => ({
    user_id: userId,
    benefit_category_id: benefit.benefit_category_id,
    provider_id: benefit.provider_id,
    benefit_product_id: benefit.benefit_product_id,
    benefit_type: benefit.benefit_type ?? null,
    is_active: true,
  }));

  const { error: insertError } = await supabase
    .from("user_benefits")
    .upsert(rowsToInsert, {
      onConflict: "user_id,benefit_category_id,provider_id,benefit_product_id",
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, empty: false });
}

