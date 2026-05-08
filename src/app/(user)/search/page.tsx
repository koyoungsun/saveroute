import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { EmptyState } from "@/components/search/EmptyState";
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
  discount_unit: DiscountUnit;
  usage_type: string;
  is_stackable: boolean;
  stacking_note: string | null;
  source_url: string | null;
  last_checked_at: string;
  valid_until: string | null;
  has_no_expiry: boolean;
  benefit_category: { name: string; code: string } | null;
  provider: { name: string } | null;
  benefit_product:
    | { name: string; is_mvno: boolean; mvno_notice_required: boolean }
    | null;
};

type DiscountUnit =
  | "percent"
  | "won"
  | "amount"
  | "special_price"
  | "free"
  | "unknown";

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
  discount_unit: DiscountUnit;
  usage_type: string;
  is_stackable: boolean;
  stacking_note: string | null;
  source_url: string | null;
  last_checked_at: string;
  valid_until: string | null;
  has_no_expiry: boolean;
  benefit_category:
    | { name: string; code: string }
    | { name: string; code: string }[]
    | null;
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
    benefit_category: asSingleOrNull(row.benefit_category),
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
    const scoreDiff = getDiscountScore(b) - getDiscountScore(a);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return (Number(b.discount_value) || 0) - (Number(a.discount_value) || 0);
  });
}

function getCategoryName(category: BrandRow["brand_categories"]) {
  if (Array.isArray(category)) {
    return category[0]?.name ?? "";
  }

  return category?.name ?? "";
}

function getDiscountScore(discount: DiscountRow) {
  const value = Number(discount.discount_value) || 0;

  if (discount.discount_unit === "free") {
    return 1_000_000_000;
  }

  if (discount.discount_unit === "percent") {
    return value * 10_000;
  }

  if (discount.discount_unit === "won" || discount.discount_unit === "amount") {
    return value;
  }

  if (discount.discount_unit === "special_price") {
    return Math.max(0, 100_000 - value);
  }

  return value;
}

function formatDiscountValue(value: number | string, unit: DiscountUnit) {
  const numberValue = Number(value) || 0;

  if (unit === "percent") {
    return `${numberValue}%`;
  }

  if (unit === "won" || unit === "amount") {
    return `${numberValue.toLocaleString()}원 할인`;
  }

  if (unit === "special_price") {
    return `${numberValue.toLocaleString()}원 특가`;
  }

  if (unit === "free") {
    return "무료";
  }

  return "할인 혜택";
}

function getBenefitTypeLabel(discount: DiscountRow) {
  const code = discount.benefit_category?.code;
  const name = discount.benefit_category?.name;
  const labels: Record<string, string> = {
    card: "카드",
    telecom: "통신사",
    membership: "멤버십",
    coupon: "쿠폰",
  };

  return (code ? labels[code] : null) ?? name ?? "혜택";
}

function formatValidUntil(discount: DiscountRow) {
  if (discount.has_no_expiry) {
    return "상시";
  }

  return discount.valid_until ? `${discount.valid_until}까지` : "기간 확인 필요";
}

function ResultMeta({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-gray-400">{label}</dt>
      <dd className="mt-0.5 truncate text-xs font-semibold text-gray-800">
        {value}
      </dd>
    </div>
  );
}

function TopResultCard({
  brandName,
  discount,
  isOwned,
}: {
  brandName: string;
  discount: DiscountRow;
  isOwned: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-[28px] bg-gray-950 text-white shadow-xl shadow-orange-950/10">
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-orange-600 px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-orange-100 ring-1 ring-white/20">
            {getBenefitTypeLabel(discount)}
          </span>
          <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-extrabold text-white">
            BEST
          </span>
        </div>
        {isOwned ? (
          <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-extrabold text-gray-950">
            보유 혜택
          </span>
        ) : null}

        <p className="mt-5 text-sm font-semibold text-white/70">{brandName}</p>
        <h2 className="mt-1 break-keep text-xl font-extrabold leading-snug">
          {discount.title}
        </h2>
        <p className="mt-4 text-4xl font-black tracking-tight text-orange-300">
          {formatDiscountValue(discount.discount_value, discount.discount_unit)}
        </p>
      </div>

      <div className="space-y-4 bg-white px-5 py-4 text-gray-900">
        <dl className="grid grid-cols-2 gap-3">
          <ResultMeta
            label="혜택상품"
            value={discount.benefit_product?.name ?? "전체 상품"}
          />
          <ResultMeta label="제공사" value={discount.provider?.name ?? "-"} />
          <ResultMeta
            label="카테고리"
            value={discount.benefit_category?.name ?? "-"}
          />
          <ResultMeta label="유효기간" value={formatValidUntil(discount)} />
        </dl>

        {discount.condition_text ? (
          <p className="line-clamp-3 rounded-2xl bg-orange-50 px-4 py-3 text-xs leading-5 text-gray-700">
            {discount.condition_text}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function ResultCard({
  brandName,
  discount,
  isBest,
  isOwned,
}: {
  brandName: string;
  discount: DiscountRow;
  isBest: boolean;
  isOwned: boolean;
}) {
  return (
    <article className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-gray-950 px-3 py-1 text-xs font-bold text-white">
          {getBenefitTypeLabel(discount)}
        </span>
        {isBest ? (
          <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-extrabold text-white">
            BEST
          </span>
        ) : null}
        {isOwned ? (
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-extrabold text-orange-600">
            보유 혜택
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-500">{brandName}</p>
          <h3 className="mt-1 break-keep text-base font-extrabold leading-snug text-gray-950">
            {discount.title}
          </h3>
        </div>
        <p className="shrink-0 text-2xl font-black tracking-tight text-orange-600">
          {formatDiscountValue(discount.discount_value, discount.discount_unit)}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-3">
        <ResultMeta
          label="혜택상품"
          value={discount.benefit_product?.name ?? "전체 상품"}
        />
        <ResultMeta label="제공사" value={discount.provider?.name ?? "-"} />
        <ResultMeta
          label="카테고리"
          value={discount.benefit_category?.name ?? "-"}
        />
        <ResultMeta label="유효기간" value={formatValidUntil(discount)} />
      </dl>

      {discount.condition_text ? (
        <p className="mt-3 line-clamp-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs leading-5 text-gray-700">
          {discount.condition_text}
        </p>
      ) : null}
    </article>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const keyword = getKeyword(params.keyword);
  const normalized = normalizeKeyword(keyword);

  if (!keyword) {
    return <EmptyState key={keyword} keyword={keyword} />;
  }

  const supabase = await createServerSupabaseClient();
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
    supabase
      .from("brands")
      .select("id,name,is_active", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("brands")
      .select("id,name,slug,aliases,brand_categories(name)")
      .ilike("name", `%${keyword}%`)
      .eq("is_active", true)
      .limit(20),
    supabase
      .from("brands")
      .select("id,name,slug,aliases,brand_categories(name)")
      .ilike("slug", `%${normalized}%`)
      .eq("is_active", true)
      .limit(20),
    supabase
      .from("brands")
      .select("id,name,slug,aliases,brand_categories(name)")
      .overlaps("aliases", aliasTerms)
      .eq("is_active", true)
      .limit(20),
    supabase
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

  const { data: discountRows, error: discountError } = await supabase
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
      benefit_category:benefit_categories(name,code),
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

  const ownedDiscountIds = new Set(
    userId
      ? activeDiscounts
          .filter((discount) => matchDiscountToBenefits(discount, benefitList))
          .map((discount) => discount.id)
      : [],
  );

  const matchedDiscountRows = sortMatchedDiscounts(activeDiscounts).sort((a, b) => {
    const ownedDiff =
      Number(ownedDiscountIds.has(b.id)) - Number(ownedDiscountIds.has(a.id));
    if (ownedDiff !== 0) {
      return ownedDiff;
    }

    return getDiscountScore(b) - getDiscountScore(a);
  });

  const hasMvnoDiscount = activeDiscounts.some(
    (discount) =>
      discount.benefit_product?.is_mvno ||
      discount.benefit_product?.mvno_notice_required,
  );
  const bestDiscountId = matchedDiscountRows[0]?.id ?? null;
  const [topDiscount, ...otherDiscounts] = matchedDiscountRows;

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

      <section className="mt-6 space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
              Best discounts
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-gray-950">
              지금 받을 수 있는 할인
            </h2>
          </div>
          <p className="shrink-0 text-xs font-semibold text-gray-400">
            {matchedDiscountRows.length}개
          </p>
        </div>

        {!topDiscount ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-700 shadow-sm">
            내 혜택과 매칭되는 할인이 없습니다.
          </div>
        ) : (
          <TopResultCard
            brandName={matchedBrand.name}
            discount={topDiscount}
            isOwned={ownedDiscountIds.has(topDiscount.id)}
          />
        )}

        <div className="space-y-3">
          {otherDiscounts.map((discount) => (
            <ResultCard
              key={discount.id}
              brandName={matchedBrand.name}
              discount={discount}
              isBest={discount.id === bestDiscountId}
              isOwned={ownedDiscountIds.has(discount.id)}
            />
          ))}
        </div>

        {hasMvnoDiscount ? (
          <p className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-xs leading-5 text-orange-800">
            알뜰요금제 혜택은 통신사/요금제별로 다를 수 있어 실제 적용 여부
            확인이 필요합니다.
          </p>
        ) : null}
      </section>
    </div>
  );
}
