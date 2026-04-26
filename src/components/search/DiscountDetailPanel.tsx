import { ExternalLink } from "lucide-react";

export interface DiscountDetail {
  id: number;
  title: string;
  providerName: string;
  discountValue: number;
  discountUnit: "percent" | "won" | "special_price" | "free" | "unknown";
  usageType: string;
  isStackable: boolean;
  stackingNote?: string;
  conditionText?: string;
  sourceUrl?: string;
  lastCheckedAt: string;
  validUntil?: string;
  hasNoExpiry: boolean;
  isMvno: boolean;
}

interface DiscountDetailPanelProps {
  discounts: DiscountDetail[];
  hasMvnoDiscount: boolean;
}

const usageTypeLabels: Record<string, string> = {
  onsite_payment: "현장결제",
  app_booking: "앱 예매",
  online_booking: "온라인 예약",
  coupon_code: "쿠폰코드",
  membership_app: "멤버십 앱",
  unknown: "방식 확인 필요",
};

function formatDiscountValue({
  discountValue,
  discountUnit,
}: Pick<DiscountDetail, "discountValue" | "discountUnit">) {
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

export function DiscountDetailPanel({
  discounts,
  hasMvnoDiscount,
}: DiscountDetailPanelProps) {
  return (
    <div className="space-y-4 rounded-2xl bg-gray-50 p-4">
      <div className="divide-y divide-gray-200">
        {discounts.map((discount) => (
          <article key={discount.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {discount.title}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {discount.providerName} ·{" "}
                  {usageTypeLabels[discount.usageType] ??
                    usageTypeLabels.unknown}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-gray-900">
                {formatDiscountValue(discount)}
              </p>
            </div>

            {discount.conditionText ? (
              <p className="mt-3 text-xs text-gray-500">
                조건: {discount.conditionText}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={
                  discount.isStackable
                    ? "rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700"
                    : "rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700"
                }
              >
                {discount.isStackable ? "중복 가능" : "중복 불가"}
              </span>
              {discount.stackingNote ? (
                <span className="text-xs text-gray-400">
                  {discount.stackingNote}
                </span>
              ) : null}
            </div>

            {discount.sourceUrl ? (
              <a
                href={discount.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs text-gray-400"
              >
                출처 URL
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
              <span>최근 확인 {discount.lastCheckedAt}</span>
              {!discount.hasNoExpiry && discount.validUntil ? (
                <span>~{discount.validUntil}</span>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {hasMvnoDiscount ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          알뜰요금제 혜택은 통신사/요금제별로 다를 수 있어 실제 적용 여부
          확인이 필요합니다.
        </p>
      ) : null}
    </div>
  );
}
