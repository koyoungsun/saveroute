interface DiscountRankFirstProps {
  providerName: string;
  productName?: string;
  discountValue: number;
  discountUnit: "percent" | "won" | "special_price" | "free" | "unknown";
  usageType: string;
}

const usageTypeLabels: Record<string, string> = {
  onsite_payment: "현장결제",
  app_booking: "앱 예매",
  online_booking: "온라인 예약",
  coupon_code: "쿠폰코드",
  membership_app: "멤버십 앱",
  unknown: "방식 확인 필요",
};

function formatDiscountValue(
  discountValue: number,
  discountUnit: DiscountRankFirstProps["discountUnit"],
) {
  if (discountUnit === "percent") {
    return `최대 ${discountValue}%`;
  }

  if (discountUnit === "won") {
    return `${discountValue.toLocaleString()}원 할인`;
  }

  if (discountUnit === "special_price") {
    return `특가 ${discountValue.toLocaleString()}원`;
  }

  if (discountUnit === "free") {
    return "무료";
  }

  return "할인 있음";
}

export function DiscountRankFirst({
  providerName,
  productName,
  discountValue,
  discountUnit,
  usageType,
}: DiscountRankFirstProps) {
  return (
    <article className="rounded-2xl bg-blue-600 p-5 text-white">
      <p className="text-sm opacity-80">{providerName}</p>
      <p className="mt-1 text-3xl font-extrabold">
        {formatDiscountValue(discountValue, discountUnit)}
      </p>
      <span className="mt-2 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-xs">
        {usageTypeLabels[usageType] ?? usageTypeLabels.unknown}
      </span>
      {productName ? (
        <p className="mt-2 text-xs opacity-70">{productName}</p>
      ) : null}
    </article>
  );
}
