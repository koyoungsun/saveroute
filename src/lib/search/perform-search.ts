import type { SupabaseClient } from "@supabase/supabase-js";

import { loadDiscountBenefitProductIdsByDiscountId } from "@/lib/admin/discount-benefit-product-links";
import {
  attachBenefitProductIdsToDiscounts,
  collectUniqueBenefitProductIds,
} from "@/lib/benefits/discount-benefit-products";
import type { BrandResult, SearchApiPayload } from "@/types/search";

import type {
  BenefitCategoryRow,
  BenefitProductRow,
  BrandCandidateRow,
  DiscountBaseRow,
  ProviderRow,
  UserBenefitRow,
} from "./helpers";
import {
  mapBaseDiscountToResult,
  matchDiscountToBenefits,
  normalizeKeyword,
  rowsById,
  sortDiscountsByRate,
  toBenefitProductMatchMeta,
  uniqueNumbers,
} from "./helpers";
import {
  buildMatchResult,
  dedupeBrandsById,
  escapeIlikePattern,
  filterExactAliasCandidates,
  filterExactNameCandidates,
  filterFuzzyCandidates,
  filterPartialAliasCandidates,
  filterPartialNameCandidates,
  pickBestInTier,
  slugExactMatch,
  strategyDebugLabel,
} from "./match-brand";

const BRAND_SELECT =
  "id,name,slug,official_url,is_active,category_id,aliases";

export async function performSearch(
  supabase: SupabaseClient,
  keywordRaw: string,
  options?: { sessionId?: string | null },
): Promise<SearchApiPayload> {
  const keyword = keywordRaw.trim();
  const normalized = normalizeKeyword(keyword);

  const empty = (
    authenticated: boolean,
    hasRegisteredBenefits = false,
  ): SearchApiPayload => ({
    keyword,
    normalizedKeyword: normalized,
    matchedBrand: null,
    discounts: [],
    ownedDiscountIds: [],
    bestDiscountId: null,
    brandCategoryName: "",
    brandCategoryCode: "",
    hasMvnoDiscount: false,
    authenticated,
    hasRegisteredBenefits,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  const authenticated = Boolean(userId);
  const sessionId = options?.sessionId ?? null;

  if (!keyword) {
    return empty(authenticated);
  }

  let slugProbe: BrandCandidateRow[] = [];
  let nameProbe: BrandCandidateRow[] = [];

  let matchResult: ReturnType<typeof buildMatchResult> | null = null;

  const escExactName = escapeIlikePattern(keyword);
  const { data: tier1Rows } = await supabase
    .from("brands")
    .select(BRAND_SELECT)
    .eq("is_active", true)
    .ilike("name", escExactName);

  const tier1 = filterExactNameCandidates((tier1Rows ?? []) as BrandCandidateRow[], keyword);
  const pick1 = pickBestInTier(tier1, "exact_name");
  if (pick1) matchResult = buildMatchResult(pick1, "exact_name");

  if (!matchResult) {
    const variants = [
      ...new Set([keyword, keyword.toLowerCase(), normalized].filter(Boolean)),
    ];
    const merged = new Map<number, BrandCandidateRow>();
    for (const v of variants) {
      const { data } = await supabase
        .from("brands")
        .select(BRAND_SELECT)
        .eq("is_active", true)
        .contains("aliases", [v]);
      for (const row of (data ?? []) as BrandCandidateRow[]) {
        merged.set(row.id, row);
      }
    }
    const tier2 = filterExactAliasCandidates([...merged.values()], keyword, normalized);
    const pick2 = pickBestInTier(tier2, "exact_alias");
    if (pick2) matchResult = buildMatchResult(pick2, "exact_alias");
  }

  if (!matchResult && normalized.length >= 2) {
    const escNorm = escapeIlikePattern(normalized);
    const { data: tier3Rows } = await supabase
      .from("brands")
      .select(BRAND_SELECT)
      .eq("is_active", true)
      .ilike("slug", `%${escNorm}%`)
      .limit(40);

    slugProbe = (tier3Rows ?? []) as BrandCandidateRow[];
    const tier3 = slugProbe.filter((b) => slugExactMatch(b, keyword, normalized));
    const pick3 = pickBestInTier(tier3, "exact_slug");
    if (pick3) matchResult = buildMatchResult(pick3, "exact_slug");
  }

  if (!matchResult && normalized.length >= 2) {
    const escKw = escapeIlikePattern(keyword);
    const { data: tier4Rows } = await supabase
      .from("brands")
      .select(BRAND_SELECT)
      .eq("is_active", true)
      .ilike("name", `%${escKw}%`)
      .limit(80);

    nameProbe = (tier4Rows ?? []) as BrandCandidateRow[];
    const tier4 = filterPartialNameCandidates(nameProbe, normalized);
    const pick4 = pickBestInTier(tier4, "partial_name");
    if (pick4) matchResult = buildMatchResult(pick4, "partial_name");
  }

  if (!matchResult && normalized.length >= 2) {
    const { data: tier5Rows } = await supabase
      .from("brands")
      .select(BRAND_SELECT)
      .eq("is_active", true)
      .not("aliases", "is", null)
      .limit(350);

    const tier5 = filterPartialAliasCandidates((tier5Rows ?? []) as BrandCandidateRow[], normalized);
    const pick5 = pickBestInTier(tier5, "partial_alias");
    if (pick5) matchResult = buildMatchResult(pick5, "partial_alias");
  }

  if (!matchResult && normalized.length >= 3) {
    const fuzzyPool = dedupeBrandsById([...slugProbe, ...nameProbe]);
    const tier6 = filterFuzzyCandidates(fuzzyPool, normalized);
    const pick6 = pickBestInTier(tier6, "fuzzy");
    if (pick6) matchResult = buildMatchResult(pick6, "fuzzy");
  }

  const matchedRow = matchResult?.brand ?? null;

  if (process.env.NODE_ENV === "development") {
    if (matchedRow && matchResult) {
      console.debug(
        `[${keyword}] matched by ${strategyDebugLabel(matchResult.strategy)} -> ${matchedRow.name} | normalized=${normalized} | score=${matchResult.score}`,
      );
    } else {
      console.debug(`[${keyword}] no brand match | normalized=${normalized}`);
    }
  }

  const matchedBrand: BrandResult | null = matchedRow
    ? {
        id: matchedRow.id,
        name: matchedRow.name,
        slug: matchedRow.slug,
        official_url: matchedRow.official_url,
        category_id: matchedRow.category_id,
      }
    : null;

  let discountsRaw: ReturnType<typeof mapBaseDiscountToResult>[] = [];
  let brandCategoryName = "";
  let brandCategoryCode = "";
  let productMatchById = new Map<
    number,
    NonNullable<ReturnType<typeof toBenefitProductMatchMeta>>
  >();

  if (matchedRow) {
    const { data: discountRows } = await supabase
      .from("discounts")
      .select(
        `
      id,
      brand_id,
      status,
      benefit_category_id,
      provider_id,
      benefit_product_id,
      title,
      condition_text,
      notice_text,
      apply_basis,
      stackable_policy,
      usage_channel,
      installment_condition,
      discount_value,
      discount_value_max,
      discount_unit,
      usage_type,
      is_stackable,
      stacking_note,
      source_url,
      last_checked_at,
      valid_until,
      has_no_expiry
    `,
      )
      .eq("brand_id", matchedRow.id)
      .eq("status", "active");

    const discountBaseRowsRaw = (discountRows ?? []) as DiscountBaseRow[];
    const linkedProductIdsByDiscount = await loadDiscountBenefitProductIdsByDiscountId(
      supabase,
      discountBaseRowsRaw.map((row) => row.id),
    );
    const discountBaseRows = attachBenefitProductIdsToDiscounts(
      discountBaseRowsRaw,
      linkedProductIdsByDiscount,
    );
    const benefitCategoryIds = uniqueNumbers(
      discountBaseRows.map((d) => d.benefit_category_id),
    );
    const providerIds = uniqueNumbers(discountBaseRows.map((d) => d.provider_id));
    const benefitProductIds = collectUniqueBenefitProductIds(discountBaseRows);

    const [
      { data: brandCategories },
      { data: benefitCategories },
      { data: providers },
      { data: benefitProducts },
    ] = await Promise.all([
      matchedRow.category_id
        ? supabase.from("brand_categories").select("id,name,code").eq("id", matchedRow.category_id)
        : { data: [] },
      benefitCategoryIds.length > 0
        ? supabase.from("benefit_categories").select("id,name,code").in("id", benefitCategoryIds)
        : { data: [] },
      providerIds.length > 0
        ? supabase.from("providers").select("id,name").in("id", providerIds)
        : { data: [] },
      benefitProductIds.length > 0
        ? supabase
            .from("benefit_products")
            .select("id,name,is_mvno,mvno_notice_required,benefit_type,is_all_product")
            .in("id", benefitProductIds)
        : { data: [] },
    ]);

    const brandCategory = ((brandCategories ?? []) as { name: string; code: string }[])[0];
    brandCategoryName = brandCategory?.name ?? "";
    brandCategoryCode = brandCategory?.code ?? "";

    const bcMap = rowsById((benefitCategories ?? []) as BenefitCategoryRow[]);
    const prMap = rowsById((providers ?? []) as ProviderRow[]);
    const bpMap = rowsById((benefitProducts ?? []) as BenefitProductRow[]);
    productMatchById = new Map(
      [...bpMap.values()].map((row) => [row.id, toBenefitProductMatchMeta(row)!]),
    );

    discountsRaw = discountBaseRows.map((row) =>
      mapBaseDiscountToResult(row, bcMap, prMap, bpMap),
    );
  }

  let userBenefitList: UserBenefitRow[] = [];
  if (userId) {
    const { data: userBenefits } = await supabase
      .from("user_benefits")
      .select(
        `
        benefit_category_id,
        provider_id,
        benefit_product_id,
        benefit_type,
        product:benefit_products(id,benefit_type,is_all_product)
      `,
      )
      .eq("user_id", userId)
      .eq("is_active", true);

    userBenefitList = ((userBenefits ?? []) as Array<{
      benefit_category_id: number;
      provider_id: number;
      benefit_product_id: number | null;
      benefit_type: string | null;
      product: { id: number; benefit_type: string | null; is_all_product: boolean } | { id: number; benefit_type: string | null; is_all_product: boolean }[] | null;
    }>).map((row) => {
      const prod = Array.isArray(row.product) ? row.product[0] : row.product;
      return {
        benefit_category_id: row.benefit_category_id,
        provider_id: row.provider_id,
        benefit_product_id: row.benefit_product_id,
        benefit_type: row.benefit_type,
        product: prod
          ? {
              id: prod.id,
              benefit_type: prod.benefit_type,
              is_all_product: prod.is_all_product,
            }
          : null,
      };
    });
  }

  const hasRegisteredBenefits = userBenefitList.length > 0;
  const personalizedDiscounts =
    authenticated && !hasRegisteredBenefits
      ? []
      : authenticated
        ? discountsRaw.filter((discount) =>
            matchDiscountToBenefits(discount, userBenefitList, productMatchById),
          )
        : discountsRaw;

  /** 할인율·금액 기준 내림차순 (동점 처리 포함) */
  const byRate = sortDiscountsByRate(personalizedDiscounts);

  const resultStatus = matchedBrand ? "matched" : "unmatched";
  const resultCount = byRate.length;

  try {
    await supabase.from("search_logs").insert({
      keyword,
      normalized_keyword: normalized,
      matched_brand_id: matchedBrand?.id ?? null,
      gender_group: null,
      age_group: null,
      result_status: resultStatus,
      result_count: resultCount,
      user_id: userId,
    });

    if (userId || sessionId) {
      await supabase.from("activity_logs").insert({
        user_id: userId,
        session_id: userId ? null : sessionId,
        event_type: "search",
        keyword,
        path: "/search",
      });
    }

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

  const ownedDiscountIds =
    authenticated && hasRegisteredBenefits ? byRate.map((d) => d.id) : [];

  let bestDiscountId: number | null = null;
  if (byRate.length > 0) {
    bestDiscountId = byRate[0]!.id;
  }

  const hasMvnoDiscount = byRate.some(
    (d) => d.benefit_product?.is_mvno || d.benefit_product?.mvno_notice_required,
  );

  return {
    keyword,
    normalizedKeyword: normalized,
    matchedBrand,
    discounts: byRate,
    ownedDiscountIds,
    bestDiscountId,
    brandCategoryName,
    brandCategoryCode,
    hasMvnoDiscount,
    authenticated,
    hasRegisteredBenefits,
  };
}
