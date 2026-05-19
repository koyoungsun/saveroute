-- 하나카드 HTML(card-name) 추출 마스터 동기화 (benefit_products)
-- 소스: scripts/data/hana_cards_html_extract_133.manifest.json
-- 주의: 사용자 제출 집계와 매니페스트 행 수가 다를 수 있음 — manifest 검수 후 재생성.
--
-- 중복 키: (provider_id, name, COALESCE(benefit_type, '')) 유니크 인덱스 benefit_products_provider_name_benefittype_uidx
--   (046 마이그레이션 또는 기존 DB에 동일 이름 인덱스가 있음)
-- 표현식·COALESCE 포함 유니크는 ON CONFLICT (열 목록)로 지정이 어려우므로
--   「기존 행 UPDATE → 없으면 INSERT」패턴 사용.
--
-- benefit_type 매핑: credit / debit / prepaid (소문자, CHECK·앱 규약과 일치)
-- Prerequisites: providers.code=hana_card, benefit_categories.code=card, 044 적용 후 실행
-- 중복 방지/idempotent 근거 인덱스: (provider_id, name, COALESCE(benefit_type,''))
--   benefit_category_id 는 이 인덱스에 포함되지 않음 → 과거 카테고리 오설정 행과 충돌 시
--   category 조건까지 요구하면 UPDATE/NOT EXISTS 가 행을 못 보고 INSERT 가 유니크를 깸.
-- 따라서 매칭·존재 판별은 provider_id + name + COALESCE(benefit_type) 만 사용하고,
-- UPDATE 시 benefit_category_id 는 카드 카테고리로 정규화한다.

WITH hid AS (
  SELECT id AS provider_id FROM public.providers WHERE code = 'hana_card' LIMIT 1
),
cid AS (
  SELECT id AS benefit_category_id FROM public.benefit_categories WHERE code = 'card' LIMIT 1
),
incoming AS (
  SELECT *
  FROM (VALUES
  ('하나 나라사랑카드(체크)'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('모두의 일상 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('노리 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('노리2 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('트래블로그 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('Young Hana+ 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('MULTI Any 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('Club SK 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('k-pass 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('달달 하나 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('해피포인트 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 비바+ 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나멤버스 1Q 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 MY WAY 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 T1 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 더블업 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 아이행복 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 트래블GO 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 올바른 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 컬쳐 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 해피 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 스마트애니 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 시럽 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 Young 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 글로벌페이 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 여행 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 레일플러스 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 미니 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 팝 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 SSGPAY 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 카카오페이 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 네이버페이 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 PAYCO 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 삼성페이 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 교직원공제회 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 복지 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 직장인 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 학생증 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 군인 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 청소년 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 어린이 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 주유 할인 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 쇼핑 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 생활 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 대중교통 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('하나 통신 할인 체크카드'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('트래블로그 선불카드'::TEXT, 'prepaid_card'::TEXT, 'prepaid'::TEXT, 'prepaid'::TEXT),
  ('JADE Classic'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('JADE Prime'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('JADE First Centum'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('CLUB SK'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('CLUB SK Platinum'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('MULTI'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('MULTI Young'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('MULTI Oil'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('MULTI Living'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('MULTI On'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('MULTI Any'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('1Q Daily+'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('1Q Shopping+'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('1Q Living+'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('1Q Special+'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('1Q T'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('1Q Pay'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('1Q Platinum'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('1Q Air'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('#tag1'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('#tag2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('#tag3'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('원더카드 FREE'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('원더카드 DAILY'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('원더카드 LIVING'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('원더카드 TRAVEL'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('원더카드 MOBILITY'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('트래블로그'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('트래블GO'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('마일 1.6'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('마일 1.8'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('마일리지 Club'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('SKT 할인카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KT 할인카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LGU+ 할인카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성페이 하나카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('네이버페이 하나카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('카카오페이 하나카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('PAYCO 하나카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('SSGPAY 하나카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 시그니처'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 CLUB H'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Club Premium'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Club 1Q'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Club SK'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Touch 7'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Simple'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Any PLUS'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Smart'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Smart Any'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Smart Global'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Shopping'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Shopping+'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Travel'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Travel Premium'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Mileage'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Mileage Platinum'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Air'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Air 1Q'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 T'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 T Premium'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 직장인 카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 직장인 플래티넘'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 레일플러스'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 주유 할인카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 생활 할인카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 통신 할인카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 영화 할인카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 쇼핑 할인카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 카페 할인카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 외식 할인카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 병원 할인카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 교육 할인카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 펫 카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 반려생활 카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 골프 카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 여행 카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 항공 카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 호텔 카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 프리미엄 카드'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 시그니처 프리미엄'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Black'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Black Premium'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Titanium'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Platinum'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Gold'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Silver'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Green'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Blue'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Purple'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Red'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나 Orange'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT)
  ) AS t(name, product_type, card_type, benefit_type)
),
incoming_deduped AS (
  SELECT DISTINCT ON (name, COALESCE(benefit_type, ''))
    name,
    product_type,
    card_type,
    benefit_type
  FROM incoming
  ORDER BY name, COALESCE(benefit_type, ''), product_type
),
ins AS (
  SELECT
    d.*,
    'hana_html_' || substring(md5(concat_ws(chr(1), 'hana_card', d.name, d.product_type))::TEXT, 1, 26) AS new_code
  FROM incoming_deduped d
),
upd AS (
  UPDATE public.benefit_products bp
  SET
    benefit_category_id = c.benefit_category_id,
    product_type = ins.product_type,
    card_type = ins.card_type,
    benefit_type = ins.benefit_type,
    name = ins.name,
    is_active = TRUE,
    updated_at = NOW()
  FROM ins, hid h, cid c
  WHERE bp.provider_id = h.provider_id
    AND bp.name = ins.name
    AND COALESCE(bp.benefit_type, '') = COALESCE(ins.benefit_type, '')
  RETURNING bp.id
)
INSERT INTO public.benefit_products (
  benefit_category_id,
  provider_id,
  name,
  code,
  product_type,
  grade,
  card_type,
  benefit_type,
  is_mvno,
  mvno_notice_required,
  is_active
)
SELECT
  c.benefit_category_id,
  h.provider_id,
  ins.name,
  ins.new_code,
  ins.product_type,
  NULL::TEXT,
  ins.card_type,
  ins.benefit_type,
  FALSE,
  FALSE,
  TRUE
FROM ins
CROSS JOIN hid h
CROSS JOIN cid c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.benefit_products bp
  WHERE bp.provider_id = h.provider_id
    AND bp.name = ins.name
    AND COALESCE(bp.benefit_type, '') = COALESCE(ins.benefit_type, '')
);

