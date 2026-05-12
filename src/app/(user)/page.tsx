import Image from "next/image";
import Link from "next/link";

import {
  PersonalizedBestSections,
  type PersonalizedDiscount,
} from "@/components/search/PersonalizedBestSections";
import { HomePromoSlotSection } from "@/components/home/HomePromoSlotSection";
import { NoticeSection } from "@/components/home/NoticeSection";
import { PopularBrandChips } from "@/components/search/PopularBrandChips";
import { RecentSearches } from "@/components/search/RecentSearches";
import { SearchBar } from "@/components/search/SearchBar";
import {
  toHomePromoSlot,
  type HomePromoSlotRow,
} from "@/lib/homePromoSlots";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const popularBrands = ["롯데월드", "CGV", "스타벅스", "에버랜드", "서울랜드"];
const telecomCategoryCodes = new Set(["telecom", "membership", "mvno"]);
const cardCategoryCodes = new Set(["card"]);

type Relation<T> = T | T[] | null;

type UserBenefitRow = {
  benefit_category_id: number;
  provider_id: number;
  benefit_product_id: number | null;
  benefit_category: Relation<{ code: string; name: string }>;
};

type DiscountRow = {
  id: number;
  benefit_category_id: number;
  provider_id: number;
  benefit_product_id: number | null;
  title: string;
  discount_value: number | string;
  discount_unit: string;
  brand: Relation<{ name: string }>;
  provider: Relation<{ name: string }>;
};

function getUserDisplayName(email?: string | null) {
  if (!email) {
    return "";
  }

  return email.split("@")[0] ?? "";
}

function getRelation<T>(relation: Relation<T>) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function matchesBenefit(discount: DiscountRow, benefit: UserBenefitRow) {
  if (
    discount.benefit_category_id !== benefit.benefit_category_id ||
    discount.provider_id !== benefit.provider_id
  ) {
    return false;
  }

  if (discount.benefit_product_id == null) {
    return true;
  }

  return discount.benefit_product_id === benefit.benefit_product_id;
}

function toPersonalizedDiscount(discount: DiscountRow): PersonalizedDiscount {
  return {
    id: discount.id,
    brandName: getRelation(discount.brand)?.name ?? "브랜드",
    title: discount.title,
    discountValue: Number(discount.discount_value) || 0,
    discountUnit: discount.discount_unit,
    providerName: getRelation(discount.provider)?.name ?? "제공사",
  };
}

function getBestDiscounts(
  discounts: DiscountRow[],
  benefits: UserBenefitRow[],
  categoryCodes: Set<string>,
) {
  const scopedBenefits = benefits.filter((benefit) => {
    const code = getRelation(benefit.benefit_category)?.code;
    return code ? categoryCodes.has(code) : false;
  });

  if (scopedBenefits.length === 0) {
    return [];
  }

  return discounts
    .filter((discount) =>
      scopedBenefits.some((benefit) => matchesBenefit(discount, benefit)),
    )
    .sort((a, b) => (Number(b.discount_value) || 0) - (Number(a.discount_value) || 0))
    .slice(0, 3)
    .map(toPersonalizedDiscount);
}

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const nowIso = new Date().toISOString();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: promoSlotData, error: promoSlotError }] = await Promise.all([
    supabase
      .from("promo_slots")
      .select(
        `
          id,
          title,
          description,
          badge,
          image_url,
          link_type,
          href,
          hashtags,
          starts_at,
          ends_at,
          priority,
          is_sponsored,
          sponsor_name
        `,
      )
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
      .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
      .order("priority", { ascending: false }),
  ]);
  const displayName = getUserDisplayName(user?.email);
  const promoSlots = promoSlotError
    ? []
    : ((promoSlotData ?? []) as HomePromoSlotRow[]).map(toHomePromoSlot);
  let userBenefits: UserBenefitRow[] = [];
  let activeDiscounts: DiscountRow[] = [];

  if (user) {
    const [
      { data: benefitData },
      { data: discountData },
    ] = await Promise.all([
      supabase
        .from("user_benefits")
        .select(
          `
          benefit_category_id,
          provider_id,
          benefit_product_id,
          benefit_category:benefit_categories(code,name)
        `,
        )
        .eq("user_id", user.id)
        .eq("is_active", true),
      supabase
        .from("discounts")
        .select(
          `
          id,
          benefit_category_id,
          provider_id,
          benefit_product_id,
          title,
          discount_value,
          discount_unit,
          brand:brands(name),
          provider:providers(name)
        `,
        )
        .eq("status", "active")
        .order("discount_value", { ascending: false })
        .limit(100),
    ]);

    userBenefits = (benefitData ?? []) as UserBenefitRow[];
    activeDiscounts = (discountData ?? []) as DiscountRow[];
  }

  const telecomDiscounts = getBestDiscounts(
    activeDiscounts,
    userBenefits,
    telecomCategoryCodes,
  );
  const cardDiscounts = getBestDiscounts(
    activeDiscounts,
    userBenefits,
    cardCategoryCodes,
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 md:py-16">
      <section className="overflow-hidden rounded-[32px] border border-orange-100 bg-white shadow-xl shadow-orange-950/10">
        <Image
          src="/icons/main-top.png"
          alt="SaveRoute. 식당, 영화관, 놀이동산 어디든 내가 가진 최고의 할인을 찾아드려요. 카드, 통신사, 멤버십 혜택을 등록하고 브랜드별 최적 할인을 한 번에 확인하세요. 카드 혜택 탐색, 통신사 혜택 탐색, 멤버십 혜택 탐색."
          width={1024}
          height={683}
          priority
          style={{ height: "auto", width: "100%" }}
        />
      </section>

      <div className="mx-auto mt-10 w-full max-w-2xl">
        {user ? (
          <>
            <div className="mb-4 space-y-1">
              <p className="text-lg font-semibold text-gray-900">
                {displayName}님,
              </p>
              <p className="text-lg font-semibold text-gray-900">
                어디에서 가장 싸게 쓸 수 있을까요?
              </p>
            </div>
            <SearchBar />
            <RecentSearches />
            <div className="mt-8">
              <PersonalizedBestSections
                isAuthenticated
                hasBenefits={userBenefits.length > 0}
                telecomDiscounts={telecomDiscounts}
                cardDiscounts={cardDiscounts}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Link
                href="/auth/login"
                className="mx-auto flex h-12 w-[70%] items-center justify-center rounded-3xl bg-sr-primary text-center font-semibold text-white hover:bg-sr-primary-hover"
              >
                로그인
              </Link>
              <Link
                href="/auth/signup"
                className="mx-auto flex h-12 w-[70%] items-center justify-center rounded-3xl border border-gray-200 bg-white text-center font-semibold text-gray-900 hover:bg-gray-50"
              >
                회원가입
              </Link>
            </div>

            <div className="mt-6">
              <SearchBar />
              <RecentSearches />
              <div className="mt-8">
                <PersonalizedBestSections
                  isAuthenticated={false}
                  hasBenefits={false}
                  telecomDiscounts={[]}
                  cardDiscounts={[]}
                />
              </div>
            </div>
          </>
        )}
        <HomePromoSlotSection slots={promoSlots} />
        <NoticeSection />
      </div>

      {user ? (
        <div className="mt-8">
          <PopularBrandChips brands={popularBrands} />
        </div>
      ) : null}
    </div>
  );
}
