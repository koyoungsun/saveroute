-- 참조: supabase/migrations/057_benefit_products_all_and_discount_installment.sql

ALTER TABLE public.benefit_products
  ADD COLUMN IF NOT EXISTS benefit_type TEXT;

ALTER TABLE public.benefit_products
  ADD COLUMN IF NOT EXISTS is_all_product BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.benefit_products
  DROP CONSTRAINT IF EXISTS benefit_products_benefit_type_check;

UPDATE public.benefit_products
SET benefit_type = NULL
WHERE benefit_type IS NOT NULL AND trim(benefit_type) = '';

UPDATE public.benefit_products
SET benefit_type = 'credit'
WHERE benefit_type IS NOT NULL
  AND (
    lower(trim(benefit_type)) IN ('credit_card', 'credit')
    OR trim(benefit_type) IN ('신용', '신용카드')
  );

UPDATE public.benefit_products
SET benefit_type = 'debit'
WHERE benefit_type IS NOT NULL AND benefit_type <> 'all'
  AND (
    lower(trim(benefit_type)) IN ('debit_card', 'check', 'debit')
    OR trim(benefit_type) IN ('체크', '체크카드')
  );

UPDATE public.benefit_products
SET benefit_type = 'prepaid'
WHERE benefit_type IS NOT NULL AND benefit_type <> 'all'
  AND (
    lower(trim(benefit_type)) IN ('prepaid_card', 'prepaid')
    OR trim(benefit_type) IN ('선불', '선불카드')
  );

UPDATE public.benefit_products
SET benefit_type = 'all'
WHERE is_all_product = TRUE;

UPDATE public.benefit_products
SET benefit_type = NULL
WHERE benefit_type IS NOT NULL
  AND benefit_type NOT IN ('credit', 'debit', 'prepaid', 'all');

ALTER TABLE public.benefit_products
  ADD CONSTRAINT benefit_products_benefit_type_check
    CHECK (
      benefit_type IS NULL
      OR benefit_type IN ('credit', 'debit', 'prepaid', 'all')
    );

CREATE UNIQUE INDEX IF NOT EXISTS benefit_products_provider_all_product_uidx
  ON public.benefit_products (provider_id)
  WHERE is_all_product = TRUE AND benefit_type = 'all';

ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS installment_condition TEXT;

ALTER TABLE public.user_benefits
  ADD COLUMN IF NOT EXISTS benefit_type TEXT;

ALTER TABLE public.user_benefits
  DROP CONSTRAINT IF EXISTS user_benefits_benefit_type_check;

UPDATE public.user_benefits
SET benefit_type = NULL
WHERE benefit_type IS NOT NULL AND trim(benefit_type) = '';

UPDATE public.user_benefits
SET benefit_type = 'credit'
WHERE benefit_type IS NOT NULL
  AND (
    lower(trim(benefit_type)) IN ('credit_card', 'credit')
    OR trim(benefit_type) IN ('신용', '신용카드')
  );

UPDATE public.user_benefits
SET benefit_type = 'debit'
WHERE benefit_type IS NOT NULL AND benefit_type <> 'all'
  AND (
    lower(trim(benefit_type)) IN ('debit_card', 'check', 'debit')
    OR trim(benefit_type) IN ('체크', '체크카드')
  );

UPDATE public.user_benefits
SET benefit_type = 'prepaid'
WHERE benefit_type IS NOT NULL AND benefit_type <> 'all'
  AND (
    lower(trim(benefit_type)) IN ('prepaid_card', 'prepaid')
    OR trim(benefit_type) IN ('선불', '선불카드')
  );

UPDATE public.user_benefits ub
SET benefit_type = 'all'
FROM public.benefit_products bp
WHERE ub.benefit_product_id = bp.id AND bp.is_all_product = TRUE;

UPDATE public.user_benefits
SET benefit_type = NULL
WHERE benefit_type IS NOT NULL
  AND benefit_type NOT IN ('credit', 'debit', 'prepaid', 'all');

ALTER TABLE public.user_benefits
  ADD CONSTRAINT user_benefits_benefit_type_check
    CHECK (
      benefit_type IS NULL
      OR benefit_type IN ('credit', 'debit', 'prepaid', 'all')
    );
