-- Range discount value support: discount_value = min/base, discount_value_max = max (nullable)

ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS discount_value_max NUMERIC;

COMMENT ON COLUMN public.discounts.discount_value IS
  '할인값(최소). 범위 할인 시 하한, 단일 할인 시 기본값.';
COMMENT ON COLUMN public.discounts.discount_value_max IS
  '할인값(최대). percent/won 범위 할인 시 상한. null이면 단일 할인값.';
