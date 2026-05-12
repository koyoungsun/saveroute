import Link from "next/link";

import { PromoSlotForm } from "../PromoSlotForm";
import { createPromoSlotAction } from "./actions";

export default function NewPromoSlotPage() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">New Promo Slot</h1>
          <p className="text-muted mb-0">
            홈 하단 추천 할인 구좌를 등록합니다.
          </p>
        </div>
        <Link href="/admin/promo-slots" className="btn btn-outline-secondary">
          목록으로
        </Link>
      </div>

      <PromoSlotForm
        action={createPromoSlotAction}
        submitLabel="구좌 등록"
        pendingLabel="등록 중..."
      />
    </>
  );
}
