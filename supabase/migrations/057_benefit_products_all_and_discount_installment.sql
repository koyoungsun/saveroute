-- benefit_products: 카드사 전체 상품(is_all_product) + benefit_type 'all' 허용
-- discounts: 할부 조건 안내(installment_condition)
-- user_benefits: benefit_type 'all' 허용
--
-- 운영 DB 패치용(idempotent). 신규 DB CREATE: supabase/sql/schema/*.sql

ALTER TABLE public.benefit_products
  ADD COLUMN IF NOT EXISTS benefit_type TEXT;

ALTER TABLE public.benefit_products
  ADD COLUMN IF NOT EXISTS is_all_product BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.benefit_products.is_all_product IS
  '카드사 전체 상품 여부. true 이면 name 은 보통 "{카드사명} 전체", benefit_type=all';

ALTER TABLE public.benefit_products
  DROP CONSTRAINT IF EXISTS benefit_products_benefit_type_check;

-- benefit_products.benefit_type 정규화 (CHECK 추가 전)
UPDATE public.benefit_products
SET benefit_type = NULL
WHERE benefit_type IS NOT NULL
  AND trim(benefit_type) = '';

UPDATE public.benefit_products
SET benefit_type = 'credit'
WHERE benefit_type IS NOT NULL
  AND (
    lower(trim(benefit_type)) IN ('credit_card', 'credit')
    OR trim(benefit_type) IN ('신용', '신용카드')
  );

UPDATE public.benefit_products
SET benefit_type = 'debit'
WHERE benefit_type IS NOT NULL
  AND benefit_type <> 'all'
  AND (
    lower(trim(benefit_type)) IN ('debit_card', 'check', 'debit')
    OR trim(benefit_type) IN ('체크', '체크카드')
  );

UPDATE public.benefit_products
SET benefit_type = 'prepaid'
WHERE benefit_type IS NOT NULL
  AND benefit_type <> 'all'
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

COMMENT ON COLUMN public.discounts.installment_condition IS
  '할부/결제 조건 안내 문구. 할인 계산에는 사용하지 않음(UI 표시용).';

ALTER TABLE public.user_benefits
  ADD COLUMN IF NOT EXISTS benefit_type TEXT;

ALTER TABLE public.user_benefits
  DROP CONSTRAINT IF EXISTS user_benefits_benefit_type_check;

-- user_benefits.benefit_type 정규화 (CHECK 추가 전)
UPDATE public.user_benefits
SET benefit_type = NULL
WHERE benefit_type IS NOT NULL
  AND trim(benefit_type) = '';

UPDATE public.user_benefits
SET benefit_type = 'credit'
WHERE benefit_type IS NOT NULL
  AND (
    lower(trim(benefit_type)) IN ('credit_card', 'credit')
    OR trim(benefit_type) IN ('신용', '신용카드')
  );

UPDATE public.user_benefits
SET benefit_type = 'debit'
WHERE benefit_type IS NOT NULL
  AND benefit_type <> 'all'
  AND (
    lower(trim(benefit_type)) IN ('debit_card', 'check', 'debit')
    OR trim(benefit_type) IN ('체크', '체크카드')
  );

UPDATE public.user_benefits
SET benefit_type = 'prepaid'
WHERE benefit_type IS NOT NULL
  AND benefit_type <> 'all'
  AND (
    lower(trim(benefit_type)) IN ('prepaid_card', 'prepaid')
    OR trim(benefit_type) IN ('선불', '선불카드')
  );

UPDATE public.user_benefits ub
SET benefit_type = 'all'
FROM public.benefit_products bp
WHERE ub.benefit_product_id = bp.id
  AND bp.is_all_product = TRUE;

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
