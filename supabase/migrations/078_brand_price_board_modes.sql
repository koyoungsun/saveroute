-- Brand-level price board calculation modes (admin-configured)
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS price_input_mode TEXT,
  ADD COLUMN IF NOT EXISTS payment_apply_mode TEXT;

ALTER TABLE public.brands
  DROP CONSTRAINT IF EXISTS brands_price_input_mode_check;

ALTER TABLE public.brands
  ADD CONSTRAINT brands_price_input_mode_check
  CHECK (
    price_input_mode IS NULL
    OR price_input_mode IN ('manual_total', 'per_person', 'ticket_type')
  );

ALTER TABLE public.brands
  DROP CONSTRAINT IF EXISTS brands_payment_apply_mode_check;

ALTER TABLE public.brands
  ADD CONSTRAINT brands_payment_apply_mode_check
  CHECK (
    payment_apply_mode IS NULL
    OR payment_apply_mode IN ('single', 'grouped_prepay', 'split')
  );

COMMENT ON COLUMN public.brands.price_input_mode IS
  'Admin: manual_total | per_person | ticket_type. NULL = infer on search.';

COMMENT ON COLUMN public.brands.payment_apply_mode IS
  'Admin: single | grouped_prepay | split. NULL = infer on search.';
