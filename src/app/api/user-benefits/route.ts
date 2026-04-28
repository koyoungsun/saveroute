import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

type BenefitCategory = "telecom" | "card";

type UserBenefitPayload = {
  category: BenefitCategory;
  provider_id: string;
  benefit_product_id: string | null;
};

function isBenefitCategory(value: unknown): value is BenefitCategory {
  return value === "telecom" || value === "card";
}

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = sessionData.session.user.id;
  const { data, error } = await supabase
    .from("user_benefits")
    .select("id,category,provider_id,benefit_product_id")
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ benefits: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = sessionData.session.user.id;

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
    const category = (item as { category?: unknown })?.category;
    const providerId = asString((item as { provider_id?: unknown })?.provider_id);
    const benefitProductIdRaw = (item as { benefit_product_id?: unknown })
      ?.benefit_product_id;
    const benefitProductId =
      benefitProductIdRaw === null ? null : asString(benefitProductIdRaw);

    if (!isBenefitCategory(category) || !providerId) {
      return NextResponse.json({ error: "Invalid benefit item" }, { status: 400 });
    }

    benefits.push({
      category,
      provider_id: providerId,
      benefit_product_id: benefitProductId,
    });
  }

  if (benefits.filter((b) => b.category === "telecom").length > 2) {
    return NextResponse.json(
      { error: "telecom benefits max is 2" },
      { status: 400 },
    );
  }

  if (benefits.filter((b) => b.category === "card").length > 3) {
    return NextResponse.json({ error: "card benefits max is 3" }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("user_benefits")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (benefits.length === 0) {
    return NextResponse.json({ success: true, empty: true });
  }

  const rowsToInsert = benefits.map((benefit) => ({
    user_id: userId,
    category: benefit.category,
    provider_id: benefit.provider_id,
    benefit_product_id: benefit.benefit_product_id,
  }));

  const { error: insertError } = await supabase.from("user_benefits").insert(rowsToInsert);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, empty: false });
}

