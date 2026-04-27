import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { DiscountDetail } from "@/components/search/DiscountDetailPanel";
import { DiscountExpandSection } from "@/components/search/DiscountExpandSection";
import { DiscountRankFirst } from "@/components/search/DiscountRankFirst";
import { DiscountRankItem } from "@/components/search/DiscountRankItem";
import { EmptyState } from "@/components/search/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SearchPageProps = {
  searchParams: Promise<{
    keyword?: string | string[];
  }>;
};

const dummyBrands = ["롯데월드", "CGV", "스타벅스", "에버랜드", "서울랜드"];

const dummyDiscounts: DiscountDetail[] = [
  {
    id: 1,
    title: "신한카드 Deep Dream",
    providerName: "신한카드",
    discountValue: 30,
    discountUnit: "percent",
    usageType: "onsite_payment",
    isStackable: false,
    stackingNote: "타 할인과 중복 적용 불가",
    conditionText: "신한카드 Deep Dream 현장 결제 시 적용",
    sourceUrl: "https://example.com",
    lastCheckedAt: "2025-01-10",
    validUntil: "2025-12-31",
    hasNoExpiry: false,
    isMvno: false,
  },
  {
    id: 2,
    title: "KT VIP",
    providerName: "KT 멤버십",
    discountValue: 20,
    discountUnit: "percent",
    usageType: "app_booking",
    isStackable: false,
    stackingNote: "멤버십 앱 예매 기준",
    conditionText: "KT VIP 등급 회원 대상",
    sourceUrl: "https://example.com",
    lastCheckedAt: "2025-01-10",
    validUntil: "2025-12-31",
    hasNoExpiry: false,
    isMvno: false,
  },
  {
    id: 3,
    title: "SKT T멤버십",
    providerName: "SKT 멤버십",
    discountValue: 15,
    discountUnit: "percent",
    usageType: "onsite_payment",
    isStackable: true,
    stackingNote: "일부 쿠폰과 중복 가능",
    conditionText: "T멤버십 바코드 제시 후 현장 결제",
    sourceUrl: "https://example.com",
    lastCheckedAt: "2025-01-10",
    hasNoExpiry: true,
    isMvno: false,
  },
];

function getKeyword(keyword?: string | string[]) {
  if (Array.isArray(keyword)) {
    return keyword[0]?.trim() ?? "";
  }

  return keyword?.trim() ?? "";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const keyword = getKeyword(params.keyword);

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    const redirectTo = `/search?keyword=${encodeURIComponent(keyword)}`;
    redirect(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`);
  }

  const matchedBrand = dummyBrands.find((brand) => brand === keyword);

  if (!keyword || !matchedBrand) {
    return <EmptyState keyword={keyword} />;
  }

  const [firstDiscount, ...restDiscounts] = dummyDiscounts;
  const hasMvnoDiscount = dummyDiscounts.some((discount) => discount.isMvno);

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
        <h1 className="text-xl font-bold text-gray-900">{matchedBrand}</h1>
        <p className="mt-1 text-xs text-gray-500">여가</p>
      </section>

      <section className="mt-6 space-y-3">
        <p className="text-xs font-medium text-gray-400">내 할인 베스트</p>

        <DiscountRankFirst
          providerName={firstDiscount.providerName}
          productName={firstDiscount.title}
          discountValue={firstDiscount.discountValue}
          discountUnit={firstDiscount.discountUnit}
          usageType={firstDiscount.usageType}
        />

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
          discounts={dummyDiscounts}
          hasMvnoDiscount={hasMvnoDiscount}
        />
      </section>
    </div>
  );
}
