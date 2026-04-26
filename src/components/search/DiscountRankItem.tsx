interface DiscountRankItemProps {
  rank: number;
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
  discountUnit: DiscountRankItemProps["discountUnit"],
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

export function DiscountRankItem({
  rank,
  providerName,
  productName,
  discountValue,
  discountUnit,
  usageType,
}: DiscountRankItemProps) {
  return (
    <article className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-medium text-gray-400">{rank}위</p>
        <p className="mt-0.5 text-sm font-semibold text-gray-900">
          {providerName}
        </p>
        {productName ? (
          <p className="text-xs text-gray-500">{productName}</p>
        ) : null}
      </div>

      <div className="text-right">
        <p className="text-xl font-bold text-gray-900">
          {formatDiscountValue(discountValue, discountUnit)}
        </p>
        <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
          {usageTypeLabels[usageType] ?? usageTypeLabels.unknown}
        </span>
      </div>
    </article>
  );
}
