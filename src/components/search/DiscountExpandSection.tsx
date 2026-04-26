"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import {
  DiscountDetail,
  DiscountDetailPanel,
} from "@/components/search/DiscountDetailPanel";

interface DiscountExpandSectionProps {
  discounts: DiscountDetail[];
  hasMvnoDiscount: boolean;
}

export function DiscountExpandSection({
  discounts,
  hasMvnoDiscount,
}: DiscountExpandSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = isExpanded ? ChevronUp : ChevronDown;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        className="flex w-full items-center justify-center gap-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600"
      >
        {isExpanded ? "접기" : "+ 더보기"}
        <Icon className="size-4" aria-hidden="true" />
      </button>

      {isExpanded ? (
        <div className="mt-2">
          <DiscountDetailPanel
            discounts={discounts}
            hasMvnoDiscount={hasMvnoDiscount}
          />
        </div>
      ) : null}
    </div>
  );
}
