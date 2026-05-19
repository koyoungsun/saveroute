-- 카드고릴라 기준 삼성카드 신규 benefit_products 추가 (생성물)
-- 생성: node scripts/sync-samsung-cardgorilla-catalog.cjs (2026-05-17)
--
-- 참고: benefit_products 에 display_order / slug 칼럼 없음. is_active = TRUE 로 INSERT.
-- 중복 논리 키: (provider_id, name, COALESCE(benefit_type,''))
--
-- 통계 요약
-- 카드고릴라 크레딧 행 수: 103
-- 카드고릴라 체크(debit) 행 수: 8
-- exact 문자열 일치(카드고릴라 이름 == 리포 시드): 16
-- 신규 insert 대상 행 수: 92 (credit 84, debit 8)
-- alias 표기 차이 매칭(신규 insert 생략) pair 수: 3
-- deprecated 검토 후보 리포 내 시드 미포함: 49
--

WITH hid AS (
  SELECT id AS provider_id FROM public.providers WHERE code = 'samsung_card' LIMIT 1
),
cid AS (
  SELECT id AS benefit_category_id FROM public.benefit_categories WHERE code = 'card' LIMIT 1
),
incoming AS (
  SELECT *
  FROM (VALUES
('삼성 iD SELECT ALL 카드'::TEXT, 'samsung_cg_cred_id_select_all'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 & MILEAGE PLATINUM (스카이패스)'::TEXT, 'samsung_cg_cred_mileage_platinum'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD SELECT ON 카드'::TEXT, 'samsung_cg_cred_id_select_on'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('THE iD. 1st'::TEXT, 'samsung_cg_cred_the_id_1st'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('THE 1 (스카이패스)'::TEXT, 'samsung_cg_cred_the_1'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('THE iD. PLATINUM(포인트)'::TEXT, 'samsung_cg_cred_the_id_platinum'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD PLUG-IN 카드'::TEXT, 'samsung_cg_cred_id_plug_in'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('네이버페이 taptap'::TEXT, 'samsung_cg_cred_taptap'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('국민행복 삼성카드 V2'::TEXT, 'samsung_cg_cred_x688a637479cb'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 스페셜마일리지(스카이패스)'::TEXT, 'samsung_cg_cred_x008fb2f6948a'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('American Express® Reserve'::TEXT, 'samsung_cg_cred_american_express_reserve'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('트레이더스신세계 삼성카드'::TEXT, 'samsung_cg_cred_xebe8088244a5'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('토스 삼성카드'::TEXT, 'samsung_cg_cred_x4e89881c8722'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('무신사 삼성카드'::TEXT, 'samsung_cg_cred_x09eed595586d'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('모니모카드'::TEXT, 'samsung_cg_cred_x87990d189f69'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('모니모A 카드'::TEXT, 'samsung_cg_cred_x2c18633af94d'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('American Express Blue'::TEXT, 'samsung_cg_cred_american_express_blue'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('THE iD. TITANIUM(포인트)'::TEXT, 'samsung_cg_cred_the_id_titanium'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KTX 삼성카드'::TEXT, 'samsung_cg_cred_xb628bb8eb753'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신세계이마트 삼성카드7'::TEXT, 'samsung_cg_cred_xef42e6dfb37a'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 BIZ iD BENEFIT카드'::TEXT, 'samsung_cg_cred_biz_id_benefit'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('카카오뱅크 개인사업자 삼성카드'::TEXT, 'samsung_cg_cred_xffb472f29917'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('K-패스 삼성카드'::TEXT, 'samsung_cg_cred_xb0ab6d8bf037'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('T나는혜택 삼성카드'::TEXT, 'samsung_cg_cred_xef4882d74919'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD STATION 카드 (HD현대오일뱅크)'::TEXT, 'samsung_cg_cred_id_station_hd'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD STATION 카드 (SK에너지)'::TEXT, 'samsung_cg_cred_id_station_sk'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('카카오페이 신용카드'::TEXT, 'samsung_cg_cred_x0aa0df774443'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성페이카드'::TEXT, 'samsung_cg_cred_x9bdfaae046ba'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 BIZ LEADERS'::TEXT, 'samsung_cg_cred_biz_leaders'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('카카오뱅크 삼성카드'::TEXT, 'samsung_cg_cred_x89a62fdaee63'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카앤모아카드'::TEXT, 'samsung_cg_cred_x7e7a214ee34c'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('MY S-OIL 삼성카드'::TEXT, 'samsung_cg_cred_my_s_oil'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('스타벅스 삼성카드'::TEXT, 'samsung_cg_cred_xdeb6f692991c'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성스토어 BENEFIT 삼성카드'::TEXT, 'samsung_cg_cred_benefit'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('CU·배달의민족 삼성카드 taptap'::TEXT, 'samsung_cg_cred_cu_taptap'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD ONE 카드'::TEXT, 'samsung_cg_cred_id_one'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('스카이패스 삼성아멕스카드'::TEXT, 'samsung_cg_cred_xb5aa9e82be22'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KT 삼성카드'::TEXT, 'samsung_cg_cred_x938e0960a08c'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('에버랜드 삼성카드'::TEXT, 'samsung_cg_cred_xbc765ad8fc9f'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LG U+ 삼성카드'::TEXT, 'samsung_cg_cred_lg_u'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD STATION 카드 (GS칼텍스)'::TEXT, 'samsung_cg_cred_id_station_gs'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('RAUME O'::TEXT, 'samsung_cg_cred_raume_o'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('G마켓 삼성카드'::TEXT, 'samsung_cg_cred_x3dc78737f742'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 모바일플러스카드'::TEXT, 'samsung_cg_cred_xe55c8629054f'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('SSG.COM 삼성카드'::TEXT, 'samsung_cg_cred_ssg_com'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성페이 삼성카드 taptap'::TEXT, 'samsung_cg_cred_4af5f9f470b0'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('iD MOVE카드'::TEXT, 'samsung_cg_cred_id_move'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('TRADERS CLUB 삼성카드'::TEXT, 'samsung_cg_cred_traders_club'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('기후동행 삼성카드'::TEXT, 'samsung_cg_cred_x549410a77bc3'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신세계 더 마일리지 삼성카드 (스카이패스)'::TEXT, 'samsung_cg_cred_x260c64c0b3ba'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신세계 THE S VIP'::TEXT, 'samsung_cg_cred_the_s_vip'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD CARE 카드'::TEXT, 'samsung_cg_cred_id_care'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('다이소 삼성카드'::TEXT, 'samsung_cg_cred_xeb0738d293db'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신세계 신백리워드 삼성카드'::TEXT, 'samsung_cg_cred_x7bfcde22a694'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('네이버웹툰 삼성 iD 카드'::TEXT, 'samsung_cg_cred_x953165380423'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('글로벌쇼핑 삼성카드 5 V2'::TEXT, 'samsung_cg_cred_5_v2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('CJ 삼성 iD 카드'::TEXT, 'samsung_cg_cred_cj_id'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('우리동네GS 삼성카드'::TEXT, 'samsung_cg_cred_x5ccbea6ce931'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('Toss taptap S'::TEXT, 'samsung_cg_cred_toss_taptap_s'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('롯데월드카드'::TEXT, 'samsung_cg_cred_xeb79d35c821e'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성스토어 삼성카드'::TEXT, 'samsung_cg_cred_xccf2d0c0577b'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('RAUME O (스카이패스)'::TEXT, 'samsung_cg_cred_8e08a3c58290'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('하나투어 삼성카드'::TEXT, 'samsung_cg_cred_x44c89b5463f0'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('부릉 삼성카드 BIZ'::TEXT, 'samsung_cg_cred_xee903b5585b4'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성라이온즈카드'::TEXT, 'samsung_cg_cred_x58fcfab70a1f'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('S-OIL 삼성카드 & POINT'::TEXT, 'samsung_cg_cred_s_oil_point'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('W컨셉 삼성카드'::TEXT, 'samsung_cg_cred_x38c2664f7971'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('PAYCO taptap'::TEXT, 'samsung_cg_cred_payco_taptap'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('라이프파트너 삼성카드'::TEXT, 'samsung_cg_cred_xad65ed8803da'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('엠베스트 엘리하이 삼성카드'::TEXT, 'samsung_cg_cred_x7399a86348ac'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신세계 아울렛 BENEFIT 삼성카드'::TEXT, 'samsung_cg_cred_9648a4266cd2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('요기요 삼성카드'::TEXT, 'samsung_cg_cred_x8afd66491fa9'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('홈플러스 삼성카드'::TEXT, 'samsung_cg_cred_x63fbc792e610'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('번개장터 삼성카드'::TEXT, 'samsung_cg_cred_xabc515224091'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('NS홈쇼핑 삼성카드'::TEXT, 'samsung_cg_cred_x0dced261f855'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('CJ ONE 삼성카드'::TEXT, 'samsung_cg_cred_cj_one'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('RAUME O (아시아나)'::TEXT, 'samsung_cg_cred_876f16b6956c'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('SC제일은행 아시아나 삼성지엔미카드'::TEXT, 'samsung_cg_cred_x4809610901b7'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('THE iD. TITANIUM (아시아나)'::TEXT, 'samsung_cg_cred_f072310da87c'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 애니패스+'::TEXT, 'samsung_cg_cred_x54ed986a732b'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 지엔미+'::TEXT, 'samsung_cg_cred_x2283457b750b'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('아시아나 삼성애니패스플래티늄카드'::TEXT, 'samsung_cg_cred_x449b64b7b5d0'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('아시아나 삼성지엔미플래티늄카드'::TEXT, 'samsung_cg_cred_x014723e7b001'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('카라이프 삼성카드 DISCOUNT+'::TEXT, 'samsung_cg_cred_discount'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('K-패스 삼성체크카드'::TEXT, 'samsung_cg_deb_xaa31dad78d21'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('삼성체크카드 & CASHBACK'::TEXT, 'samsung_cg_deb_cashback'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('삼성체크카드 & POINT'::TEXT, 'samsung_cg_deb_point'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('국민행복 삼성체크카드 V2'::TEXT, 'samsung_cg_deb_xc2b03b6269ad'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('국민행복 삼성체크카드'::TEXT, 'samsung_cg_deb_xd95926783969'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('삼성빅보너스체크카드'::TEXT, 'samsung_cg_deb_x72cd9d62fedb'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('제주도 삼성체크카드'::TEXT, 'samsung_cg_deb_xd5c7c5e44f76'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT),
  ('삼성포인트체크카드'::TEXT, 'samsung_cg_deb_xa5f4824bf2a4'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT, 'debit'::TEXT)
  ) AS t(name, code, product_type, card_type, benefit_type)
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
  i.name,
  i.code,
  i.product_type,
  NULL::TEXT,
  i.card_type,
  i.benefit_type,
  FALSE,
  FALSE,
  TRUE
FROM incoming i
CROSS JOIN hid h
CROSS JOIN cid c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.benefit_products bp
  WHERE bp.provider_id = h.provider_id
    AND bp.name = i.name
    AND COALESCE(bp.benefit_type, '') = COALESCE(i.benefit_type, '')
);

