import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parsePromoSlotId } from "@/lib/promoSlotId";

import { PromoSlotForm, type PromoSlotFormValues } from "../../PromoSlotForm";
import { updatePromoSlotAction } from "./actions";

type EditPromoSlotPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPromoSlotPage({ params }: EditPromoSlotPageProps) {
  const { id } = await params;
  const slotId = parsePromoSlotId(id);

  if (!slotId) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
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
      priority,
      is_active,
      is_sponsored,
      sponsor_name,
      starts_at,
      ends_at
    `,
    )
    .eq("id", slotId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load promo slot: ${error.message}`);
  }

  if (!data) {
    notFound();
  }

  const promoSlot = data as PromoSlotFormValues;
  const updateAction = updatePromoSlotAction.bind(null, slotId);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Edit Promo Slot</h1>
          <p className="text-muted mb-0">
            운영 중인 홈 추천 할인 구좌를 수정합니다.
          </p>
        </div>
        <Link href="/admin/promo-slots" className="btn btn-outline-secondary">
          목록으로
        </Link>
      </div>

      <PromoSlotForm
        action={updateAction}
        values={promoSlot}
        submitLabel="수정 저장"
        pendingLabel="저장 중..."
      />
    </>
  );
}
