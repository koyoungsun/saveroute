-- user_benefits: 선불카드 등록 시 benefit_type = prepaid 허용
ALTER TABLE public.user_benefits
  DROP CONSTRAINT IF EXISTS user_benefits_benefit_type_check,
  ADD CONSTRAINT user_benefits_benefit_type_check
    CHECK (benefit_type IN ('credit', 'debit', 'prepaid') OR benefit_type IS NULL);
