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
      className="sr-user-card block p-4 transition hover:-translate-y-0.5 hover:border-[color:var(--sr-primary)]/35 hover:shadow-[var(--sr-glow-primary)]"
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
        <p className="sr-user-badge shrink-0 px-3 py-1 text-sm font-black text-gray-950">
          {formatDiscountValue(discount.discountValue, discount.discountUnit)}
        </p>
      </div>
    </Link>
  );
}

function MyPageBestItem({ discount }: { discount: PersonalizedDiscount }) {
  return (
    <li className="sr-user-mypage-best-item">
      <Link
        href={`/search?keyword=${encodeURIComponent(discount.brandName)}`}
        className="sr-user-mypage-best-link"
      >
        <span className="sr-user-mypage-best-link__brand">
          {discount.brandName}
        </span>
        <span className="sr-user-mypage-best-link__title">{discount.title}</span>
      </Link>
      <span className="sr-user-mypage-best-badge">
        {formatDiscountValue(discount.discountValue, discount.discountUnit)}
      </span>
    </li>
  );
}

function DiscountSection({
  title,
  discounts,
  emptyHint,
  variant,
}: {
  title: string;
  discounts: PersonalizedDiscount[];
  emptyHint: string;
  variant: "home" | "mypage";
}) {
  if (variant === "mypage") {
    return (
      <section className="sr-user-benefit-accordion-card sr-user-mypage-card sr-user-mypage-best-card">
        <div className="sr-user-mypage-best-head">
          <h2 className="sr-user-benefit-accordion-card__title sr-user-mypage-accent-title sr-user-mypage-best-title">
            {title}
          </h2>
          <span className="sr-user-mypage-best-meta">최대 3개</span>
        </div>
        {discounts.length > 0 ? (
          <ul className="sr-user-mypage-best-list">
            {discounts.map((discount) => (
              <MyPageBestItem key={discount.id} discount={discount} />
            ))}
          </ul>
        ) : (
          <p className="sr-user-mypage-best-empty">{emptyHint}</p>
        )}
      </section>
    );
  }

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
        <div className="sr-user-card rounded-2xl border border-dashed p-4 text-sm leading-6 text-gray-500">
          <p className="font-semibold text-gray-700">아직 매칭되는 할인이 없어요.</p>
          <p className="mt-1">{emptyHint}</p>
        </div>
      )}
    </section>
  );
}

function MyPageBestPlaceholder({
  title,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <section className="sr-user-benefit-accordion-card sr-user-mypage-card sr-user-mypage-best-card">
      <h2 className="sr-user-benefit-accordion-card__title sr-user-mypage-accent-title sr-user-mypage-best-title">
        {title}
      </h2>
      <Link
        href={ctaHref}
        className="sr-user-btn-primary inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-white"
      >
        {ctaLabel}
      </Link>
    </section>
  );
}

export function PersonalizedBestSections({
  isAuthenticated,
  hasBenefits,
  telecomDiscounts,
  cardDiscounts,
  variant = "home",
}: {
  isAuthenticated: boolean;
  hasBenefits: boolean;
  telecomDiscounts: PersonalizedDiscount[];
  cardDiscounts: PersonalizedDiscount[];
  variant?: "home" | "mypage";
}) {
  if (!isAuthenticated) {
    if (variant === "mypage") {
      return (
        <MyPageBestPlaceholder
          title="맞춤 할인 BEST"
          ctaHref="/auth/login?redirect=/my-benefits"
          ctaLabel="로그인하고 혜택 등록"
        />
      );
    }

    return (
      <section className="sr-user-card sr-user-card--best rounded-3xl p-5">
        <div className="sr-user-best-line mb-3" aria-hidden />
        <h2 className="text-base font-black text-gray-950">맞춤 할인 BEST</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          로그인 후 내 혜택을 등록하면, 통신사·카드 기준으로 받을 수 있는 할인을
          먼저 보여드려요.
        </p>
        <Link
          href="/auth/login?redirect=/my-benefits"
          className="sr-user-btn-primary mt-4 inline-flex h-12 items-center justify-center rounded-3xl px-5 text-sm font-semibold text-white"
        >
          로그인하고 혜택 등록
        </Link>
      </section>
    );
  }

  if (!hasBenefits) {
    if (variant === "mypage") {
      return (
        <MyPageBestPlaceholder
          title="맞춤 할인 BEST"
          ctaHref="/my-benefits"
          ctaLabel="내 혜택 등록하기"
        />
      );
    }

    return (
      <section className="sr-user-card sr-user-card--best rounded-3xl p-5">
        <div className="sr-user-best-line mb-3" aria-hidden />
        <h2 className="text-base font-black text-gray-950">맞춤 할인 BEST</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          보유 통신사·카드를 등록하면 홈과 검색에서 ‘내 할인 가능’ 할인을 먼저 볼 수 있어요.
        </p>
        <Link
          href="/my-benefits"
          className="sr-user-btn-primary mt-4 inline-flex h-12 items-center justify-center rounded-3xl px-5 text-sm font-semibold text-white"
        >
          내 혜택 등록하기
        </Link>
      </section>
    );
  }

  const stackClass =
    variant === "mypage" ? "sr-user-mypage-best-stack" : "space-y-6";

  return (
    <div className={stackClass}>
      <DiscountSection
        variant={variant}
        title="내 통신사 할인 BEST"
        discounts={telecomDiscounts}
        emptyHint="등록한 통신사 혜택과 연결된 할인이 표시됩니다."
      />
      <DiscountSection
        variant={variant}
        title="내 카드 할인 BEST"
        discounts={cardDiscounts}
        emptyHint="등록한 카드 혜택과 연결된 할인이 표시됩니다."
      />
    </div>
  );
}
