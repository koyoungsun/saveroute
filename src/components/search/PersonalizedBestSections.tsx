import Link from "next/link";

export type PersonalizedDiscount = {
  id: number;
  brandName: string;
  title: string;
  discountValue: number;
  discountUnit: string;
  providerName: string;
};

function formatDiscountValue(value: number, unit: string) {
  if (unit === "percent") {
    return `${value}%`;
  }

  if (unit === "won" || unit === "amount") {
    return `${value.toLocaleString()}원`;
  }

  if (unit === "special_price") {
    return `${value.toLocaleString()}원 특가`;
  }

  if (unit === "free") {
    return "무료";
  }

  return value > 0 ? `${value}` : "혜택";
}

function DiscountCard({ discount }: { discount: PersonalizedDiscount }) {
  return (
    <Link
      href={`/search?keyword=${encodeURIComponent(discount.brandName)}`}
      className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-gray-500">
            {discount.brandName} · {discount.providerName}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-extrabold leading-5 text-gray-950">
            {discount.title}
          </h3>
        </div>
        <p className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-sm font-black text-orange-600">
          {formatDiscountValue(discount.discountValue, discount.discountUnit)}
        </p>
      </div>
    </Link>
  );
}

function DiscountSection({
  title,
  discounts,
  emptyHint,
}: {
  title: string;
  discounts: PersonalizedDiscount[];
  emptyHint: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-base font-black text-gray-950">{title}</h2>
        <span className="text-xs font-semibold text-gray-400">최대 3개</span>
      </div>
      {discounts.length > 0 ? (
        <div className="grid gap-3">
          {discounts.map((discount) => (
            <DiscountCard key={discount.id} discount={discount} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-sm leading-6 text-gray-500">
          <p className="font-semibold text-gray-700">아직 매칭되는 할인이 없어요.</p>
          <p className="mt-1">{emptyHint}</p>
        </div>
      )}
    </section>
  );
}

export function PersonalizedBestSections({
  isAuthenticated,
  hasBenefits,
  telecomDiscounts,
  cardDiscounts,
}: {
  isAuthenticated: boolean;
  hasBenefits: boolean;
  telecomDiscounts: PersonalizedDiscount[];
  cardDiscounts: PersonalizedDiscount[];
}) {
  if (!isAuthenticated) {
    return (
      <section className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
        <h2 className="text-base font-black text-gray-950">맞춤 할인 BEST</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          로그인 후 내 혜택을 등록하면, 통신사·카드 기준으로 받을 수 있는 할인을
          먼저 보여드려요.
        </p>
        <Link
          href="/auth/login?redirect=/my-benefits"
          className="mt-4 inline-flex h-12 items-center justify-center rounded-3xl bg-sr-primary px-5 text-sm font-semibold text-white hover:bg-sr-primary-hover"
        >
          로그인하고 혜택 등록
        </Link>
      </section>
    );
  }

  if (!hasBenefits) {
    return (
      <section className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
        <h2 className="text-base font-black text-gray-950">맞춤 할인 BEST</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          보유 통신사·카드를 등록하면 홈과 검색에서 &lsquo;내 할인 가능&rsquo; 할인을
          먼저 볼 수 있어요.
        </p>
        <Link
          href="/my-benefits"
          className="mt-4 inline-flex h-12 items-center justify-center rounded-3xl bg-sr-primary px-5 text-sm font-semibold text-white hover:bg-sr-primary-hover"
        >
          내 혜택 등록하기
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <DiscountSection
        title="내 통신사 할인 BEST"
        discounts={telecomDiscounts}
        emptyHint="등록한 통신사 혜택과 연결된 할인이 생기면 여기에 표시됩니다."
      />
      <DiscountSection
        title="내 카드 할인 BEST"
        discounts={cardDiscounts}
        emptyHint="등록한 카드·카드사 전체 혜택과 연결된 할인이 생기면 여기에 표시됩니다."
      />
    </div>
  );
}
