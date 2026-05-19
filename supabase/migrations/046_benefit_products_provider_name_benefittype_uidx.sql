-- Logical uniqueness aligned with 카드 표시명 + benefit 타입(NULL과 '' 통일).
-- 이미 해당 키 조합으로 중복 행이 있으면 생성 실패 — benefit_products_duplicate_check.sql 로 확인 후 통합 필요.
--
-- 참고: PostgreSQL에서는 동일 표현식의 유니크 인덱스가 있어도
-- INSERT ... ON CONFLICT (provider_id, name, (COALESCE(benefit_type,''))) 형태가 버전·파서별로 허용 불일치가 있어
-- 045 시드에서는 UPDATE 후 INSERT ... WHERE NOT EXISTS 로 유지함.
CREATE UNIQUE INDEX IF NOT EXISTS benefit_products_provider_name_benefittype_uidx
  ON public.benefit_products (provider_id, name, (COALESCE(benefit_type, '')));
