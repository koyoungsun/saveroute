-- benefit_products.name_normalized: 검색용 '카드' 불용어 제거 (name 원본은 변경하지 않음)

CREATE OR REPLACE FUNCTION public.bp_normalize_name(t TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
AS $$
DECLARE
  collapsed TEXT;
  parts TEXT[];
  part TEXT;
  cleaned TEXT;
  result_parts TEXT[] := '{}';
BEGIN
  collapsed := lower(trim(regexp_replace(coalesce(t, ''), E'\\s+', ' ', 'g')));
  IF collapsed = '' THEN
    RETURN '';
  END IF;

  parts := regexp_split_to_array(collapsed, E'\\s+');

  FOREACH part IN ARRAY parts LOOP
    IF part = '카드' THEN
      CONTINUE;
    END IF;

    IF right(part, 2) = '카드' AND length(part) > 2 THEN
      cleaned := left(part, length(part) - 2);
    ELSE
      cleaned := part;
    END IF;

    IF cleaned <> '' THEN
      result_parts := array_append(result_parts, cleaned);
    END IF;
  END LOOP;

  RETURN array_to_string(result_parts, ' ');
END;
$$;

COMMENT ON FUNCTION public.bp_normalize_name(TEXT) IS
  '카드/상품 검색용 name_normalized: 소문자·공백 압축 후 토큰 단위 ''카드'' 불용어 제거(접미/단독).';

UPDATE public.benefit_products
SET name_normalized = public.bp_normalize_name(name)
WHERE name_normalized IS DISTINCT FROM public.bp_normalize_name(name);

COMMENT ON COLUMN public.benefit_products.name_normalized IS
  '이름 검색용 정규화본. INSERT/UPDATE name 시 트리거로 자동 동기화(카드 불용어 제거 포함).';
