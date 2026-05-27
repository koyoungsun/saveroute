-- 금액별 할인(per_amount): 기준금액(condition_amount) + 할인금액(discount_value)

ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS condition_amount INT;

COMMENT ON COLUMN public.discounts.condition_amount IS
  '금액별 할인(per_amount) 기준금액. 예: 1000원당 50원 할인 시 1000.';

ALTER TABLE public.discounts
  DROP CONSTRAINT IF EXISTS discounts_discount_unit_check;

ALTER TABLE public.discounts
  ADD CONSTRAINT discounts_discount_unit_check
  CHECK (
    discount_unit IN (
      'percent',
      'point_percent',
      'won',
      'amount',
      'per_amount',
      'special_price',
      'free',
      'unknown'
    )
  );
