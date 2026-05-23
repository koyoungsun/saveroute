-- 멤버십 카테고리 표시명 변경 (code=membership 유지)
-- discount_unit 에 point_percent 추가

UPDATE public.benefit_categories
SET
  name = '멤버십/포인트',
  updated_at = NOW()
WHERE code = 'membership'
  AND name <> '멤버십/포인트';

ALTER TABLE public.discounts
  DROP CONSTRAINT IF EXISTS discounts_discount_unit_check;

ALTER TABLE public.discounts
  ADD CONSTRAINT discounts_discount_unit_check
  CHECK (
    discount_unit IN (
      'percent',
      'point_percent',
      'won',
      'special_price',
      'free',
      'unknown'
    )
  );

ALTER TABLE public.coupons
  DROP CONSTRAINT IF EXISTS coupons_discount_unit_check;

ALTER TABLE public.coupons
  ADD CONSTRAINT coupons_discount_unit_check
  CHECK (
    discount_unit IN (
      'percent',
      'point_percent',
      'won',
      'special_price',
      'free',
      'unknown'
    )
  );
