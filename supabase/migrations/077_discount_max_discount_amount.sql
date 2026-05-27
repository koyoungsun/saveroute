-- Cap on discount amount applied at checkout (won), separate from discount_value_max (rate range).

ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS max_discount_amount INT;

COMMENT ON COLUMN public.discounts.max_discount_amount IS
  'Maximum discount amount in KRW when applying this benefit; NULL = no cap.';
