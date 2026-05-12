ALTER TABLE public.user_benefits
  ADD COLUMN IF NOT EXISTS benefit_type TEXT;

ALTER TABLE public.user_benefits
  DROP CONSTRAINT IF EXISTS user_benefits_benefit_type_check,
  ADD CONSTRAINT user_benefits_benefit_type_check
    CHECK (benefit_type IN ('credit', 'debit') OR benefit_type IS NULL);

UPDATE public.user_benefits ub
SET benefit_type = bp.card_type
FROM public.benefit_products bp
WHERE ub.benefit_product_id = bp.id
  AND ub.benefit_type IS NULL
  AND bp.card_type IN ('credit', 'debit');
