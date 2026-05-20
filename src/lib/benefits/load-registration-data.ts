import type { SupabaseClient } from "@supabase/supabase-js";

import { isCardCatalogPlaceholderForPicker } from "@/lib/benefits/card-benefit-kinds";
import { isUserBenefitEligibleForMatching } from "@/lib/benefits/benefit-product-request-status";
import { countMatchingCardDiscounts } from "@/lib/search/discount-matching";

export type BenefitProductRelation = { name: string; code?: string } | null;

export type LoadedUserBenefitRow = {
  id: number;
  benefit_category_id: number;
  provider_id: number;
  benefit_product_id: number | null;
  benefit_product_request_id: number | null;
  approval_status: "pending" | "approved" | "rejected" | null;
  benefit_type: "credit" | "debit" | "prepaid" | "all" | null;
  custom_name: string | null;
  connectedDiscountCount: number;
  created_at: string;
  benefit_category: { name: string } | { name: string }[] | null;
  provider: { name: string } | { name: string }[] | null;
  benefit_product: BenefitProductRelation | { name: string; code?: string }[] | null;
  benefit_product_request: {
    requested_name: string;
    requested_benefit_type: string;
    status: string;
    admin_memo: string | null;
  } | {
    requested_name: string;
    requested_benefit_type: string;
    status: string;
    admin_memo: string | null;
  }[] | null;
};

export type CardProductOption = {
  id: number;
  name: string;
  code: string | null;
  benefit_category_id: number;
  provider_id: number;
  providerName: string;
  /** benefit_products.card_type */
  cardType: "credit" | "debit" | "prepaid" | "unknown" | null;
  /** benefit_products.benefit_type (마스터 기준, 없으면 null) */
  benefitType: string | null;
  isAllProduct: boolean;
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

type CardProductMetaRow = {
  id: number;
  benefit_type: string | null;
  is_all_product: boolean;
};

/** 통신 혜택 등록 1차 선택 (이동통신 3사 + 알뜰폰) */
export type TelecomFirstChoiceId = "skt" | "kt" | "lguplus" | "mvno";

export const TELECOM_FIRST_CHOICES: { id: TelecomFirstChoiceId; label: string }[] = [
  { id: "skt", label: "SKT" },
  { id: "kt", label: "KT" },
  { id: "lguplus", label: "LG U+" },
  { id: "mvno", label: "알뜰폰" },
];

export type TelecomMembershipOption = {
  id: number;
  name: string;
  grade: string | null;
  providerCode: string;
  provider_id: number;
  benefit_type: string | null;
  isAllProduct: boolean;
};

export type MvnoBrandOption = {
  providerId: number;
  name: string;
  code: string;
  defaultProductId: number;
};

/** 알뜰폰 브랜드 드롭다운 정렬용 (DB 이름과 동일) */
export const MVNO_BRAND_DISPLAY_ORDER: string[] = [
  "KT엠모바일",
  "SK세븐모바일",
  "LG헬로모바일",
  "U+유모바일",
  "프리티",
  "티플러스",
  "모빙",
  "이야기모바일",
  "리브모바일",
  "스노우맨",
  "스마텔",
  "아이즈모바일",
  "에넥스텔레콤",
  "안심모바일",
  "우체국 알뜰폰",
  "스카이라이프모바일",
  "토스모바일",
];

const GRADE_ORDER = ["전체", "일반", "VIP", "VVIP"];

export function sortTelecomMembershipOptions(rows: TelecomMembershipOption[]): TelecomMembershipOption[] {
  return [...rows].sort((a, b) => {
    const ai = GRADE_ORDER.indexOf(a.grade ?? "");
    const bi = GRADE_ORDER.indexOf(b.grade ?? "");
    const as = ai === -1 ? 99 : ai;
    const bs = bi === -1 ? 99 : bi;
    if (as !== bs) return as - bs;
    return a.name.localeCompare(b.name, "ko");
  });
}

/** 같은 provider·상품명(+ benefit_type)에 대해 레거시로 남은 복수 benefit_product 행 중 id가 가장 작은 것만 유지 */
export function dedupeTelecomMembershipOptions(rows: TelecomMembershipOption[]): TelecomMembershipOption[] {
  const uniqueById = [...new Map(rows.map((row) => [row.id, row])).values()];
  const byLogical = new Map<string, TelecomMembershipOption>();
  for (const row of uniqueById) {
    const key = `${row.provider_id}-${row.name}-${row.benefit_type ?? ""}`;
    const prev = byLogical.get(key);
    if (!prev || row.id < prev.id) {
      byLogical.set(key, row);
    }
  }
  return [...byLogical.values()];
}

export function sortMvnoBrandOptions(rows: MvnoBrandOption[]): MvnoBrandOption[] {
  return [...rows].sort((a, b) => {
    const ai = MVNO_BRAND_DISPLAY_ORDER.indexOf(a.name);
    const bi = MVNO_BRAND_DISPLAY_ORDER.indexOf(b.name);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name, "ko");
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export type ExternalMembershipOption = {
  id: number;
  name: string;
  provider_id: number;
  providerName: string;
  providerCode: string;
  providerDisplayOrder: number;
  isAllProduct: boolean;
};

export function sortExternalMembershipOptions(
  rows: ExternalMembershipOption[],
): ExternalMembershipOption[] {
  return [...rows].sort((a, b) => {
    if (a.providerDisplayOrder !== b.providerDisplayOrder) {
      return a.providerDisplayOrder - b.providerDisplayOrder;
    }
    const providerCompare = a.providerName.localeCompare(b.providerName, "ko");
    if (providerCompare !== 0) return providerCompare;
    return a.name.localeCompare(b.name, "ko");
  });
}

export type BenefitsRegistrationPayload = {
  telecomCategoryId: number;
  /** null 이면 DB 에 mvno 행이 없음 · 아래 brand 옵션은 provider_type 로만 로드 */
  mvnoCategoryId: number | null;
  cardCategoryId: number;
  membershipCategoryId: number | null;
  telecomMembershipProducts: TelecomMembershipOption[];
  externalMembershipProducts: ExternalMembershipOption[];
  mvnoBrandOptions: MvnoBrandOption[];
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

export async function loadBenefitsRegistrationData(
  supabase: SupabaseClient,
  userId: string,
): Promise<BenefitsRegistrationPayload> {
  const [
    { data: telecomCat, error: telecomCatError },
    { data: mvnoCat, error: mvnoCatError },
    { data: cardCat, error: cardCatError },
    { data: membershipCat, error: membershipCatError },
  ] = await Promise.all([
    supabase.from("benefit_categories").select("id").eq("code", "telecom").maybeSingle(),
    supabase.from("benefit_categories").select("id").eq("code", "mvno").maybeSingle(),
    supabase.from("benefit_categories").select("id").eq("code", "card").maybeSingle(),
    supabase.from("benefit_categories").select("id").eq("code", "membership").maybeSingle(),
  ]);

  if (telecomCatError || !telecomCat) {
    throw new Error(`Telecom category missing: ${telecomCatError?.message ?? "no row"}`);
  }
  if (mvnoCatError) {
    throw new Error(`MVNO category query failed: ${mvnoCatError.message}`);
  }
  if (cardCatError || !cardCat) {
    throw new Error(`Card category missing: ${cardCatError?.message ?? "no row"}`);
  }
  if (membershipCatError) {
    throw new Error(`Membership category query failed: ${membershipCatError.message}`);
  }

  const telecomCategoryId = telecomCat.id;
  const mvnoCategoryId: number | null = mvnoCat?.id ?? null;
  const cardCategoryId = cardCat.id;
  const membershipCategoryId: number | null = membershipCat?.id ?? null;

  const mvnoProviderQuery = mvnoCategoryId
    ? supabase
        .from("providers")
        .select("id,name,code")
        .eq("benefit_category_id", mvnoCategoryId)
        .eq("provider_type", "telecom_mvno")
        .eq("is_active", true)
    : supabase
        .from("providers")
        .select("id,name,code")
        .eq("provider_type", "telecom_mvno")
        .eq("is_active", true);

  const externalMembershipQuery =
    membershipCategoryId === null
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("benefit_products")
          .select(
            `
            id,
            name,
            provider_id,
            benefit_type,
            is_all_product,
            provider:providers(name,code,display_order)
          `,
          )
          .eq("benefit_category_id", membershipCategoryId)
          .eq("product_type", "membership")
          .eq("is_all_product", true)
          .eq("is_active", true)
          .order("id", { ascending: true });

  const [
    { data: membershipRaw, error: membershipError },
    { data: externalMembershipRaw, error: externalMembershipError },
    { data: telecomMajorProvidersRaw, error: telecomMajorProvidersError },
    { data: mvnoProvidersRaw, error: mvnoProvidersError },
    { data: cardProvidersRaw, error: cardProvidersError },
    { data: cardProductsRaw, error: cardProdError },
    { data: userBenefits, error: ubError },
    { data: activeCardDiscounts, error: activeCardDiscountsError },
  ] = await Promise.all([
    supabase
      .from("benefit_products")
      .select("id,name,grade,provider_id,benefit_type,is_all_product")
      .eq("benefit_category_id", telecomCategoryId)
      .eq("product_type", "telecom_membership")
      .eq("is_active", true)
      .order("id", { ascending: true }),
    externalMembershipQuery,
    supabase
      .from("providers")
      .select("id,code")
      .eq("benefit_category_id", telecomCategoryId)
      .eq("provider_type", "telecom_major")
      .eq("is_active", true),
    mvnoProviderQuery,
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
        code,
        benefit_category_id,
        provider_id,
        card_type,
        benefit_type,
        is_all_product,
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
        benefit_product_request_id,
        approval_status,
        benefit_type,
        custom_name,
        created_at,
        benefit_category:benefit_categories(name),
        provider:providers(name),
        benefit_product:benefit_products(name, code),
        benefit_product_request:benefit_product_requests(requested_name,requested_benefit_type,status,admin_memo)
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

  if (membershipError) {
    throw new Error(membershipError.message);
  }
  if (externalMembershipError) {
    throw new Error(externalMembershipError.message);
  }
  if (telecomMajorProvidersError) {
    throw new Error(telecomMajorProvidersError.message);
  }
  if (mvnoProvidersError) {
    throw new Error(mvnoProvidersError.message);
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

  const telecomProviderCodeById = new Map(
    (telecomMajorProvidersRaw ?? []).map((p) => [p.id as number, String(p.code ?? "")]),
  );

  const telecomMembershipProducts: TelecomMembershipOption[] = sortTelecomMembershipOptions(
    dedupeTelecomMembershipOptions(
      (membershipRaw ?? []).map((row: Record<string, unknown>) => {
        const pid = row.provider_id as number;
        return {
          id: row.id as number,
          name: row.name as string,
          grade: (row.grade as string | null) ?? null,
          providerCode: telecomProviderCodeById.get(pid) ?? "",
          provider_id: pid,
          benefit_type: (row.benefit_type as string | null) ?? null,
          isAllProduct:
            Boolean(row.is_all_product) ||
            String(row.benefit_type ?? "").toLowerCase() === "all",
        };
      }),
    ),
  );

  const externalMembershipProducts: ExternalMembershipOption[] = sortExternalMembershipOptions(
    (externalMembershipRaw ?? []).map((row: Record<string, unknown>) => {
      const provider = relationOne(
        row.provider as
          | { name: string; code: string; display_order?: number }
          | { name: string; code: string; display_order?: number }[]
          | null,
      );
      return {
        id: row.id as number,
        name: row.name as string,
        provider_id: row.provider_id as number,
        providerName: provider?.name ?? "",
        providerCode: provider?.code ?? "",
        providerDisplayOrder: provider?.display_order ?? 500,
        isAllProduct:
          Boolean(row.is_all_product) ||
          String(row.benefit_type ?? "").toLowerCase() === "all",
      };
    }),
  );

  const mvnoProviderIds = (mvnoProvidersRaw ?? []).map((p) => p.id);

  let defaultLineByProvider = new Map<number, number>();
  if (mvnoProviderIds.length > 0) {
    const { data: mvnoProducts, error: dlError } = await supabase
      .from("benefit_products")
      .select("id,provider_id,code")
      .in("provider_id", mvnoProviderIds)
      .eq("is_active", true);

    if (dlError) {
      throw new Error(dlError.message);
    }

    const defaultSuffix = "_default_line";
    for (const row of mvnoProducts ?? []) {
      const code = row.code as string;
      if (typeof code !== "string" || !code.endsWith(defaultSuffix)) {
        continue;
      }
      const pid = row.provider_id as number;
      if (!defaultLineByProvider.has(pid)) {
        defaultLineByProvider.set(pid, row.id as number);
      }
    }
  }

  const mvnoBrandOptions: MvnoBrandOption[] = sortMvnoBrandOptions(
    (mvnoProvidersRaw ?? [])
      .map((p) => {
        const defaultProductId = defaultLineByProvider.get(p.id);
        if (!defaultProductId) {
          return null;
        }
        return {
          providerId: p.id,
          name: p.name,
          code: p.code,
          defaultProductId,
        };
      })
      .filter((x): x is MvnoBrandOption => x !== null),
  );

  const cardProducts: CardProductOption[] = (cardProductsRaw ?? [])
    .map((row: Record<string, unknown>) => {
      const provider = relationOne(row.provider as { name?: string } | null);
      const code = (row.code as string | null) ?? null;
      const benefitType = (row.benefit_type as string | null) ?? null;
      const cardType = row.card_type as CardProductOption["cardType"];
      const isAllProduct = Boolean(row.is_all_product);
      return {
        id: row.id as number,
        name: row.name as string,
        code,
        benefit_category_id: row.benefit_category_id as number,
        provider_id: row.provider_id as number,
        providerName: provider?.name ?? "카드사",
        cardType,
        benefitType,
        isAllProduct,
      };
    })
    .filter(
      (row) =>
        !isCardCatalogPlaceholderForPicker({
          name: row.name,
          code: row.code,
          card_type: row.cardType,
          benefit_type: row.benefitType,
          is_all_product: row.isAllProduct,
        }),
    );

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
  const discountProductIds = [
    ...new Set(
      cardDiscountScopes
        .map((d) => d.benefit_product_id)
        .filter((id): id is number => typeof id === "number"),
    ),
  ];

  let cardDiscountProductById = new Map<
    number,
    { id: number; benefit_type: string | null; is_all_product: boolean }
  >();
  if (discountProductIds.length > 0) {
    const { data: discountProducts, error: dpError } = await supabase
      .from("benefit_products")
      .select("id,benefit_type,is_all_product")
      .in("id", discountProductIds);
    if (dpError) {
      throw new Error(dpError.message);
    }
    cardDiscountProductById = new Map(
      ((discountProducts ?? []) as CardProductMetaRow[]).map((p) => [
        p.id,
        {
          id: p.id,
          benefit_type: p.benefit_type,
          is_all_product: p.is_all_product,
        },
      ]),
    );
  }

  const cardProductById = new Map(
    cardProducts.map((p) => [
      p.id,
      {
        id: p.id,
        benefit_type: p.benefitType,
        is_all_product: p.isAllProduct,
      },
    ]),
  );

  const benefitsWithDiscountCounts = ((userBenefits ?? []) as Omit<
    LoadedUserBenefitRow,
    "connectedDiscountCount"
  >[]).map((benefit) => {
    const eligibleForMatching = isUserBenefitEligibleForMatching({
      benefit_product_id: benefit.benefit_product_id,
      approval_status: benefit.approval_status,
    });
    const connectedDiscountCount =
      benefit.benefit_category_id === cardCategoryId && eligibleForMatching
        ? countMatchingCardDiscounts(
            {
              benefit_category_id: benefit.benefit_category_id,
              provider_id: benefit.provider_id,
              benefit_product_id: benefit.benefit_product_id,
              benefit_type: benefit.benefit_type,
              product:
                benefit.benefit_product_id == null
                  ? null
                  : cardProductById.get(benefit.benefit_product_id) ?? null,
            },
            cardDiscountScopes,
            cardDiscountProductById,
          )
        : 0;

    return {
      ...benefit,
      connectedDiscountCount,
    };
  });

  return {
    telecomCategoryId,
    mvnoCategoryId,
    cardCategoryId,
    membershipCategoryId,
    telecomMembershipProducts,
    externalMembershipProducts,
    mvnoBrandOptions,
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
