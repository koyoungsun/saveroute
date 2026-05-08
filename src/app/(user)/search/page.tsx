import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DiscountDetail } from "@/components/search/DiscountDetailPanel";
import { DiscountExpandSection } from "@/components/search/DiscountExpandSection";
import { DiscountRankFirst } from "@/components/search/DiscountRankFirst";
import { DiscountRankItem } from "@/components/search/DiscountRankItem";
import { EmptyState } from "@/components/search/EmptyState";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SearchPageProps = {
  searchParams: Promise<{
    keyword?: string | string[];
  }>;
};

function getKeyword(keyword?: string | string[]) {
  if (Array.isArray(keyword)) {
    return keyword[0]?.trim() ?? "";
  }

  return keyword?.trim() ?? "";
}

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLowerCase().replace(/[^가-힣a-zA-Z0-9]/g, "");
}

function isOrderedSubsequence(needle: string, haystack: string) {
  if (!needle) return false;

  let needleIndex = 0;
  for (const character of haystack) {
    if (character === needle[needleIndex]) {
      needleIndex += 1;
      if (needleIndex === needle.length) {
        return true;
      }
    }
  }

  return false;
}

function getBroadSearchTerm(normalized: string) {
  return normalized.length >= 2 ? normalized.slice(0, 2) : normalized;
}

type BrandRow = {
  id: number;
  name: string;
  slug: string;
  aliases: string[] | null;
  brand_categories: { name: string } | { name: string }[] | null;
};

type DiscountRow = {
  id: number;
  benefit_category_id: number;
  provider_id: number;
  benefit_product_id: number | null;
  title: string;
  condition_text: string | null;
  discount_value: number | string;
  discount_unit: DiscountDetail["discountUnit"];
  usage_type: string;
  is_stackable: boolean;
  stacking_note: string | null;
  source_url: string | null;
  last_checked_at: string;
  valid_until: string | null;
  has_no_expiry: boolean;
  provider: { name: string } | null;
  benefit_product:
    | { name: string; is_mvno: boolean; mvno_notice_required: boolean }
    | null;
};

type UserBenefitRow = {
  benefit_category_id: number;
  provider_id: number;
  benefit_product_id: number | null;
};

/** Supabase may infer FK embeds as single objects or arrays depending on typings; normalize to DiscountRow. */
function asSingleOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeDiscountRow(row: {
  id: number;
  benefit_category_id: number;
  provider_id: number;
  benefit_product_id: number | null;
  title: string;
  condition_text: string | null;
  discount_value: number | string;
  discount_unit: DiscountDetail["discountUnit"];
  usage_type: string;
  is_stackable: boolean;
  stacking_note: string | null;
  source_url: string | null;
  last_checked_at: string;
  valid_until: string | null;
  has_no_expiry: boolean;
  provider: { name: string } | { name: string }[] | null;
  benefit_product:
    | { name: string; is_mvno: boolean; mvno_notice_required: boolean }
    | { name: string; is_mvno: boolean; mvno_notice_required: boolean }[]
    | null;
}): DiscountRow {
  return {
    id: row.id,
    benefit_category_id: row.benefit_category_id,
    provider_id: row.provider_id,
    benefit_product_id: row.benefit_product_id,
    title: row.title,
    condition_text: row.condition_text,
    discount_value: row.discount_value,
    discount_unit: row.discount_unit,
    usage_type: row.usage_type,
    is_stackable: row.is_stackable,
    stacking_note: row.stacking_note,
    source_url: row.source_url,
    last_checked_at: row.last_checked_at,
    valid_until: row.valid_until,
    has_no_expiry: row.has_no_expiry,
    provider: asSingleOrNull(row.provider),
    benefit_product: asSingleOrNull(row.benefit_product),
  };
}

function pickMatchedBrand(brands: BrandRow[], keyword: string, normalized: string) {
  const keywordLower = keyword.toLowerCase();

  const exactName =
    brands.find((brand) => brand.name.toLowerCase() === keywordLower) ?? null;
  if (exactName) return exactName;

  const exactSlug =
    brands.find((brand) => normalizeKeyword(brand.slug) === normalized) ?? null;
  if (exactSlug) return exactSlug;

  const exactAlias =
    brands.find((brand) =>
      (brand.aliases ?? []).some(
        (alias) => normalizeKeyword(alias) === normalized || alias === keyword,
      ),
    ) ?? null;
  if (exactAlias) return exactAlias;

  const normalizedName =
    brands.find((brand) => normalizeKeyword(brand.name).includes(normalized)) ??
    null;
  if (normalizedName) return normalizedName;

  const normalizedSlug =
    brands.find((brand) => normalizeKeyword(brand.slug).includes(normalized)) ??
    null;
  if (normalizedSlug) return normalizedSlug;

  const normalizedAlias =
    brands.find((brand) =>
      (brand.aliases ?? []).some((alias) =>
        normalizeKeyword(alias).includes(normalized),
      ),
    ) ?? null;
  if (normalizedAlias) return normalizedAlias;

  const looseName =
    brands.find((brand) =>
      isOrderedSubsequence(normalized, normalizeKeyword(brand.name)),
    ) ?? null;
  if (looseName) return looseName;

  const looseSlug =
    brands.find((brand) =>
      isOrderedSubsequence(normalized, normalizeKeyword(brand.slug)),
    ) ?? null;
  if (looseSlug) return looseSlug;

  const looseAlias =
    brands.find((brand) =>
      (brand.aliases ?? []).some((alias) =>
        isOrderedSubsequence(normalized, normalizeKeyword(alias)),
      ),
    ) ?? null;
  if (looseAlias) return looseAlias;

  return null;
}

function matchDiscountToBenefits(discount: DiscountRow, benefits: UserBenefitRow[]) {
  const inferredScope: "provider_all" | "product_specific" =
    discount.benefit_product_id == null ? "provider_all" : "product_specific";

  return benefits.some((b) => {
    if (
      b.benefit_category_id !== discount.benefit_category_id ||
      b.provider_id !== discount.provider_id
    ) {
      return false;
    }

    if (inferredScope === "provider_all") {
      return true;
    }

    if (discount.benefit_product_id == null) {
      return false;
    }

    return b.benefit_product_id === discount.benefit_product_id;
  });
}

function sortMatchedDiscounts(discounts: DiscountRow[]) {
  return [...discounts].sort((a, b) => {
    const aValue = Number(a.discount_value) || 0;
    const bValue = Number(b.discount_value) || 0;
    return bValue - aValue;
  });
}

function getCategoryName(category: BrandRow["brand_categories"]) {
  if (Array.isArray(category)) {
    return category[0]?.name ?? "";
  }

  return category?.name ?? "";
}

function toDiscountDetail(discount: DiscountRow): DiscountDetail {
  const mvno =
    discount.benefit_product?.is_mvno ||
    discount.benefit_product?.mvno_notice_required ||
    false;

  return {
    id: discount.id,
    title: discount.benefit_product?.name
      ? `${discount.benefit_product.name} · ${discount.title}`
      : discount.title,
    providerName: discount.provider?.name ?? "혜택 제공사",
    discountValue: Number(discount.discount_value) || 0,
    discountUnit: discount.discount_unit,
    usageType: discount.usage_type,
    isStackable: discount.is_stackable,
    stackingNote: discount.stacking_note ?? undefined,
    conditionText: discount.condition_text ?? undefined,
    sourceUrl: discount.source_url ?? undefined,
    lastCheckedAt: discount.last_checked_at,
    validUntil: discount.valid_until ?? undefined,
    hasNoExpiry: discount.has_no_expiry,
    isMvno: mvno,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const keyword = getKeyword(params.keyword);
  const normalized = normalizeKeyword(keyword);

  if (!keyword) {
    return <EmptyState key={keyword} keyword={keyword} />;
  }

  const supabase = await createServerSupabaseClient();
  const searchSupabase = createSupabaseAdminClient();
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id ?? null;
  const aliasTerms = Array.from(new Set([keyword, normalized].filter(Boolean)));
  const broadSearchTerm = getBroadSearchTerm(normalized);

  const { data: profile } = userId
    ? await supabase
        .from("profiles")
        .select("gender_group,age_group")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };

  const [
    { count: anonVisibleBrandCount, error: anonBrandCountError },
    {
      data: recentBrands,
      count: adminBrandCount,
      error: recentBrandsError,
    },
    { data: nameMatches, error: nameError },
    { data: slugMatches, error: slugError },
    { data: aliasMatches, error: aliasError },
    { data: broadNameMatches, error: broadNameError },
  ] = await Promise.all([
    supabase
      .from("brands")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    searchSupabase
      .from("brands")
      .select("id,name,is_active", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(10),
    searchSupabase
      .from("brands")
      .select("id,name,slug,aliases,brand_categories(name)")
      .ilike("name", `%${keyword}%`)
      .eq("is_active", true)
      .limit(20),
    searchSupabase
      .from("brands")
      .select("id,name,slug,aliases,brand_categories(name)")
      .ilike("slug", `%${normalized}%`)
      .eq("is_active", true)
      .limit(20),
    searchSupabase
      .from("brands")
      .select("id,name,slug,aliases,brand_categories(name)")
      .overlaps("aliases", aliasTerms)
      .eq("is_active", true)
      .limit(20),
    searchSupabase
      .from("brands")
      .select("id,name,slug,aliases,brand_categories(name)")
      .ilike("name", `%${broadSearchTerm}%`)
      .eq("is_active", true)
      .limit(20),
  ]);

  const brandCandidates = [
    ...(nameMatches ?? []),
    ...(slugMatches ?? []),
    ...(aliasMatches ?? []),
    ...(broadNameMatches ?? []),
  ].reduce<BrandRow[]>((unique, brand) => {
    if (unique.some((item) => item.id === brand.id)) {
      return unique;
    }
    unique.push(brand as BrandRow);
    return unique;
  }, []);

  const matchedBrand = pickMatchedBrand(
    brandCandidates,
    keyword,
    normalized,
  );

  console.log("[search debug] brands visibility", {
    keyword,
    anonVisibleActiveBrandCount: anonVisibleBrandCount,
    adminBrandCount,
    recentBrands:
      recentBrands?.map((brand) => ({
        id: brand.id,
        name: brand.name,
        isActive: brand.is_active,
      })) ?? [],
    errors: {
      anonBrandCount: anonBrandCountError?.code ?? null,
      recentBrands: recentBrandsError?.code ?? null,
    },
  });

  console.log("[search debug] brand lookup", {
    keyword,
    normalized,
    nameMatches: nameMatches?.length ?? 0,
    slugMatches: slugMatches?.length ?? 0,
    aliasMatches: aliasMatches?.length ?? 0,
    broadNameMatches: broadNameMatches?.length ?? 0,
    matchedBrands: brandCandidates.length,
    matchedBrandId: matchedBrand?.id ?? null,
    errors: {
      name: nameError?.code ?? null,
      slug: slugError?.code ?? null,
      alias: aliasError?.code ?? null,
      broadName: broadNameError?.code ?? null,
    },
  });

  const resultStatus = matchedBrand ? "matched" : "unmatched";

  try {
    await supabase.from("search_logs").insert({
      keyword,
      normalized_keyword: normalized,
      matched_brand_id: matchedBrand?.id ?? null,
      gender_group: profile?.gender_group ?? null,
      age_group: profile?.age_group ?? null,
      result_status: resultStatus,
    });

    const today = new Date().toISOString().slice(0, 10);
    const { data: dailyExisting } = await supabase
      .from("daily_search_stats")
      .select("total_search_count,matched_search_count,unmatched_search_count")
      .eq("date", today)
      .maybeSingle();

    if (dailyExisting) {
      await supabase
        .from("daily_search_stats")
        .update({
          total_search_count: dailyExisting.total_search_count + 1,
          matched_search_count:
            dailyExisting.matched_search_count + (matchedBrand ? 1 : 0),
          unmatched_search_count:
            dailyExisting.unmatched_search_count + (matchedBrand ? 0 : 1),
        })
        .eq("date", today);
    } else {
      await supabase.from("daily_search_stats").insert({
        date: today,
        total_search_count: 1,
        matched_search_count: matchedBrand ? 1 : 0,
        unmatched_search_count: matchedBrand ? 0 : 1,
      });
    }

    if (matchedBrand) {
      const { data: brandDailyExisting } = await supabase
        .from("brand_daily_stats")
        .select("search_count")
        .eq("date", today)
        .eq("brand_id", matchedBrand.id)
        .maybeSingle();

      if (brandDailyExisting) {
        await supabase
          .from("brand_daily_stats")
          .update({ search_count: brandDailyExisting.search_count + 1 })
          .eq("date", today)
          .eq("brand_id", matchedBrand.id);
      } else {
        await supabase.from("brand_daily_stats").insert({
          date: today,
          brand_id: matchedBrand.id,
          search_count: 1,
          detail_view_count: 0,
          discount_click_count: 0,
        });
      }
    }
  } catch {
    // Logging/stat failures should not block search results.
  }

  if (!matchedBrand) {
    console.log("[search debug] discount lookup", {
      keyword,
      matchedBrandId: null,
      discounts: 0,
      status: "active",
      skipped: "no matched brand",
    });

    return <EmptyState key={keyword} keyword={keyword} />;
  }

  const { data: discountRows, error: discountError } = await searchSupabase
    .from("discounts")
    .select(
      `
      id,
      benefit_category_id,
      provider_id,
      benefit_product_id,
      title,
      condition_text,
      discount_value,
      discount_unit,
      usage_type,
      is_stackable,
      stacking_note,
      source_url,
      last_checked_at,
      valid_until,
      has_no_expiry,
      provider:providers(name),
      benefit_product:benefit_products(name,is_mvno,mvno_notice_required)
    `,
    )
    .eq("brand_id", matchedBrand.id)
    .eq("status", "active")
    .order("discount_value", { ascending: false });

  console.log("[search debug] discount lookup", {
    keyword,
    matchedBrandId: matchedBrand.id,
    discounts: discountRows?.length ?? 0,
    status: "active",
    error: discountError
      ? {
          code: discountError.code,
          message: discountError.message,
          details: discountError.details,
          hint: discountError.hint,
        }
      : null,
  });

  const activeDiscounts = sortMatchedDiscounts(
    (discountRows ?? []).map(normalizeDiscountRow),
  );

  if (activeDiscounts.length === 0) {
    return <EmptyState key={keyword} keyword={keyword} />;
  }

  const { data: userBenefits } = userId
    ? await supabase
      .from("user_benefits")
      .select("benefit_category_id,provider_id,benefit_product_id")
      .eq("user_id", userId)
      .eq("is_active", true)
    : { data: null };
  const benefitList = (userBenefits ?? []) as UserBenefitRow[];

  const matchedDiscountRows = sortMatchedDiscounts(
    userId
      ? activeDiscounts.filter((discount) =>
          matchDiscountToBenefits(discount, benefitList),
        )
      : activeDiscounts,
  );

  const matchedDiscounts = matchedDiscountRows.map(toDiscountDetail);
  const allDiscounts = activeDiscounts.map(toDiscountDetail);

  const hasMvnoDiscount = allDiscounts.some((discount) => discount.isMvno);

  const topMatched = matchedDiscounts.slice(0, 3);
  const [firstDiscount, ...restDiscounts] = topMatched;

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="홈으로 돌아가기"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm">
          <span className="block truncate">{keyword}</span>
        </div>
      </div>

      <section className="mt-8">
        <h1 className="text-xl font-bold text-gray-900">{matchedBrand.name}</h1>
        {getCategoryName(matchedBrand.brand_categories) ? (
          <p className="mt-1 text-xs text-gray-500">
            {getCategoryName(matchedBrand.brand_categories)}
          </p>
        ) : null}
      </section>

      <section className="mt-6 space-y-3">
        <p className="text-xs font-medium text-gray-400">내 할인 베스트</p>

        {!firstDiscount ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-700 shadow-sm">
            내 혜택과 매칭되는 할인이 없습니다.
          </div>
        ) : (
          <DiscountRankFirst
            providerName={firstDiscount.providerName}
            productName={firstDiscount.title}
            discountValue={firstDiscount.discountValue}
            discountUnit={firstDiscount.discountUnit}
            usageType={firstDiscount.usageType}
          />
        )}

        {restDiscounts.map((discount, index) => (
          <DiscountRankItem
            key={discount.id}
            rank={index + 2}
            providerName={discount.providerName}
            productName={discount.title}
            discountValue={discount.discountValue}
            discountUnit={discount.discountUnit}
            usageType={discount.usageType}
          />
        ))}

        <DiscountExpandSection
          discounts={allDiscounts}
          hasMvnoDiscount={hasMvnoDiscount}
        />
      </section>
    </div>
  );
}
