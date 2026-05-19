-- benefit_products.name 관리자 검색용 정규화 + 트리거
-- 이름 정규화는 검색·중복점검(idx name_normalized)·트리거용. 045 HTML 시드 매칭은 DB 유니크 키 (provider,name, COALESCE(benefit_type,'')) 에 맞춤.

ALTER TABLE public.benefit_products
  ADD COLUMN IF NOT EXISTS benefit_type TEXT;

CREATE OR REPLACE FUNCTION public.bp_normalize_name(t TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT trim(regexp_replace(coalesce(t, ''), E'\\s+', ' ', 'g'))
$$;

COMMENT ON FUNCTION public.bp_normalize_name(TEXT) IS
  '카드/상품 표시명 검색·매칭용: 연속 공백 압축 후 trim.';

ALTER TABLE public.benefit_products
  ADD COLUMN IF NOT EXISTS name_normalized TEXT;

UPDATE public.benefit_products
SET name_normalized = public.bp_normalize_name(name)
WHERE name_normalized IS DISTINCT FROM public.bp_normalize_name(name);

CREATE INDEX IF NOT EXISTS idx_benefit_products_provider_name_normalized
  ON public.benefit_products (provider_id, name_normalized);

CREATE OR REPLACE FUNCTION public.trg_benefit_products_set_name_normalized()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.name_normalized := public.bp_normalize_name(NEW.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_benefit_products_set_name_normalized ON public.benefit_products;

CREATE TRIGGER trg_benefit_products_set_name_normalized
BEFORE INSERT OR UPDATE OF name ON public.benefit_products
FOR EACH ROW
EXECUTE FUNCTION public.trg_benefit_products_set_name_normalized();

COMMENT ON COLUMN public.benefit_products.name_normalized IS
  '이름 정규화본(검색·중복 점검). INSERT/UPDATE 시 트리거로 자동 동기화.';
