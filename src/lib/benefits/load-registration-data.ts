import type { SupabaseClient } from "@supabase/supabase-js";

export type BenefitProductRelation = { name: string; code?: string } | null;

export type LoadedUserBenefitRow = {
  id: number;
  benefit_category_id: number;
  provider_id: number;
  benefit_product_id: number | null;
  benefit_type: "credit" | "debit" | null;
  connectedDiscountCount: number;
  created_at: string;
  benefit_category: { name: string } | { name: string }[] | null;
  provider: { name: string } | { name: string }[] | null;
  benefit_product: BenefitProductRelation | { name: string; code?: string }[] | null;
};

export type CardProductOption = {
  id: number;
  name: string;
  benefit_category_id: number;
  provider_id: number;
  providerName: string;
  cardType: "credit" | "debit" | "prepaid" | "unknown" | null;
};

export type CardProviderOption = {
  id: number;
  name: string;
  code: string;
};

type ActiveDiscountScopeRow = {
  provider_id: number;
  benefit_product_id: number | null;
};

export type BenefitsRegistrationPayload = {
  telecomCategoryId: number;
  cardCategoryId: number;
  /** 활성 MVNO 요금제 상품 id (통신사 ‘알뜰폰’ 선택 시 일괄 등록·판별용) */
  mvnoProductIds: number[];
  cardProviders: CardProviderOption[];
  cardProducts: CardProductOption[];
  userBenefits: LoadedUserBenefitRow[];
};

function relationOne<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

/** 통신사 단일 선택 UI 후보 (대표 멤버십 상품 코드) */
export const TELECOM_PRESETS = [
  { carrierKey: "skt", label: "SKT", hint: "T 멤버십", productCode: "skt_tmembership" },
  { carrierKey: "kt", label: "KT", hint: "VIP 등", productCode: "kt_vip" },
  { carrierKey: "lguplus", label: "LG U+", hint: "U+ 멤버십", productCode: "lguplus_vip" },
  { carrierKey: "mvno", label: "알뜰폰", hint: "MVNO", productCode: null },
] as const;

export type TelecomCarrierKey = (typeof TELECOM_PRESETS)[number]["carrierKey"];

export function inferTelecomCarrierKey(
  benefits: LoadedUserBenefitRow[],
  telecomCategoryId: number,
  mvnoProductIdSet: Set<number>,
): TelecomCarrierKey | null {
  const telecomRows = benefits.filter((b) => b.benefit_category_id === telecomCategoryId);

  const mvnoHits = telecomRows.filter(
    (b) =>
      b.benefit_product_id !== null &&
      mvnoProductIdSet.has(b.benefit_product_id),
  );

  if (mvnoHits.length > 0) {
    return "mvno";
  }

  const code = telecomRows
    .map((b) => relationOne(b.benefit_product)?.code)
    .find((c) => typeof c === "string");

  if (!code) {
    return null;
  }

  const preset = TELECOM_PRESETS.find((p) => p.productCode === code);
  return preset?.carrierKey ?? null;
}

export async function loadBenefitsRegistrationData(
  supabase: SupabaseClient,
  userId: string,
): Promise<BenefitsRegistrationPayload> {
  const [{ data: telecomCat, error: telecomCatError }, { data: cardCat, error: cardCatError }] =
    await Promise.all([
      supabase.from("benefit_categories").select("id").eq("code", "telecom").maybeSingle(),
      supabase.from("benefit_categories").select("id").eq("code", "card").maybeSingle(),
    ]);

  if (telecomCatError || !telecomCat) {
    throw new Error(`Telecom category missing: ${telecomCatError?.message}`);
  }
  if (cardCatError || !cardCat) {
    throw new Error(`Card category missing: ${cardCatError?.message}`);
  }

  const telecomCategoryId = telecomCat.id;
  const cardCategoryId = cardCat.id;

  const [
    { data: mvnoProviders, error: mvnoProvError },
    { data: cardProvidersRaw, error: cardProvidersError },
    { data: cardProductsRaw, error: cardProdError },
    { data: userBenefits, error: ubError },
    { data: activeCardDiscounts, error: activeCardDiscountsError },
  ] = await Promise.all([
    supabase
      .from("providers")
      .select("id")
      .eq("benefit_category_id", telecomCategoryId)
      .eq("provider_type", "telecom_mvno")
      .eq("is_active", true),
    supabase
      .from("providers")
      .select("id,name,code")
      .eq("benefit_category_id", cardCategoryId)
      .eq("provider_type", "card_company")
      .eq("is_active", true),
    supabase
      .from("benefit_products")
      .select(
        `
        id,
        name,
        benefit_category_id,
        provider_id,
        card_type,
        provider:providers(name)
      `,
      )
      .eq("benefit_category_id", cardCategoryId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("user_benefits")
      .select(
        `
        id,
        benefit_category_id,
        provider_id,
        benefit_product_id,
        benefit_type,
        created_at,
        benefit_category:benefit_categories(name),
        provider:providers(name),
        benefit_product:benefit_products(name, code)
      `,
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("discounts")
      .select("provider_id,benefit_product_id")
      .eq("benefit_category_id", cardCategoryId)
      .eq("status", "active"),
  ]);

  if (mvnoProvError) {
    throw new Error(mvnoProvError.message);
  }
  if (cardProvidersError) {
    throw new Error(cardProvidersError.message);
  }
  if (cardProdError) {
    throw new Error(cardProdError.message);
  }
  if (ubError) {
    throw new Error(ubError.message);
  }
  if (activeCardDiscountsError) {
    throw new Error(activeCardDiscountsError.message);
  }

  const mvnoProviderIds = (mvnoProviders ?? []).map((p) => p.id);

  let mvnoProductIds: number[] = [];
  if (mvnoProviderIds.length > 0) {
    const { data: mvnoProducts, error: mvnoProdError } = await supabase
      .from("benefit_products")
      .select("id")
      .in("provider_id", mvnoProviderIds)
      .eq("is_active", true);

    if (mvnoProdError) {
      throw new Error(mvnoProdError.message);
    }

    mvnoProductIds = (mvnoProducts ?? []).map((row) => row.id);
  }

  const cardProducts: CardProductOption[] = (cardProductsRaw ?? []).map((row: Record<string, unknown>) => {
    const provider = relationOne(row.provider as { name?: string } | null);
    return {
      id: row.id as number,
      name: row.name as string,
      benefit_category_id: row.benefit_category_id as number,
      provider_id: row.provider_id as number,
      providerName: provider?.name ?? "카드사",
      cardType: row.card_type as CardProductOption["cardType"],
    };
  });

  const preferredProviderNames = [
    "신한카드",
    "삼성카드",
    "현대카드",
    "KB국민카드",
    "롯데카드",
    "우리카드",
    "하나카드",
    "BC카드",
    "NH농협카드",
  ];
  const cardProviders = (cardProvidersRaw ?? [])
    .map((row) => ({
      id: row.id,
      name: row.name === "국민카드" ? "KB국민카드" : row.name,
      code: row.code,
    }))
    .sort((a, b) => {
      const aIndex = preferredProviderNames.indexOf(a.name);
      const bIndex = preferredProviderNames.indexOf(b.name);
      if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

  const cardDiscountScopes = (activeCardDiscounts ?? []) as ActiveDiscountScopeRow[];
  const benefitsWithDiscountCounts = ((userBenefits ?? []) as Omit<
    LoadedUserBenefitRow,
    "connectedDiscountCount"
  >[]).map((benefit) => {
    const connectedDiscountCount =
      benefit.benefit_category_id === cardCategoryId
        ? cardDiscountScopes.filter((discount) => {
            if (discount.provider_id !== benefit.provider_id) {
              return false;
            }

            return (
              discount.benefit_product_id === null ||
              discount.benefit_product_id === benefit.benefit_product_id
            );
          }).length
        : 0;

    return {
      ...benefit,
      connectedDiscountCount,
    };
  });

  return {
    telecomCategoryId,
    cardCategoryId,
    mvnoProductIds,
    cardProviders,
    cardProducts,
    userBenefits: benefitsWithDiscountCounts,
  };
}

export async function countActiveUserBenefits(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("user_benefits")
    .select("*", { head: true, count: "exact" })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    return 0;
  }

  return count ?? 0;
}
