# SaveRoute SQL 구조 (최종 스키마 기준)

Supabase **실행 이력**은 `supabase/migrations/` 번호 순서를 따릅니다.  
이 폴더는 **역할별 참조·패치·최종 스키마 스냅샷**을 정리합니다.

## 디렉터리 역할

| 폴더 | 역할 |
|------|------|
| `../migrations/` | **실제 적용 이력** — schema / RLS / seed / patch 가 시간순으로 누적 |
| `schema/` | **최종 CREATE 스냅샷** — 신규 DB·문서·코드리뷰용 (004/007/008 원본보다 최신) |
| `seed/` | 멱등 시드 **패턴 예시** (카드사 전체 상품 등) |
| `patch/` | 운영 DB **점진 패치** 참조 (057 등 idempotent ALTER) |
| `cleanup/` | 테스트 카드 탐지·검증 SELECT (`detect_*`, `verify_*`) |

## migrations vs schema (중요)

| 테이블 | migration 원본 | 최종 스키마에만 있는 컬럼 |
|--------|----------------|---------------------------|
| `benefit_products` | `004` | `benefit_type`, `is_all_product` (+ `044` name_normalized 등 별도 migration) |
| `user_benefits` | `008` | `benefit_type` (`027` migration에서 최초 추가) |
| `discounts` | `007` | `installment_condition` (`057` migration) |

- **기존 Supabase 프로젝트:** `migrations/` 순서대로 적용 (057은 운영 패치 겸용).
- **신규 환경 문서화·부분 부트스트랩:** `schema/benefit_products.sql`, `user_benefits.sql`, `discounts.sql` 을 기준으로 한다.
- **데이터 정책:** `schema/DATA_POLICIES.md`, `docs/SaveRoute_DB_ERD_v1.md` §7

## benefit_products 유니크 기준

- 일반 상품: `(provider_id, name, COALESCE(benefit_type, ''))` — `benefit_products_provider_name_benefittype_uidx`
- 카드사 전체: `provider_id` 당 1개 — `benefit_products_provider_all_product_uidx` (`is_all_product=true`, `benefit_type=all`)

## seed 멱등 규칙

1. `WHERE NOT EXISTS (... provider_id + name + benefit_type ...)`  
2. 또는 `INSERT ... ON CONFLICT (code) DO UPDATE SET ...` (code UNIQUE)  
3. 중복 실행해도 duplicate key 오류가 나지 않도록 작성

## 스키마 변경 타임라인 (benefit_type 계열)

| Migration | 내용 |
|-----------|------|
| 027 | `user_benefits.benefit_type` 추가 (credit/debit) |
| 044 | `benefit_products.benefit_type` 추가 |
| 046 | `(provider_id, name, benefit_type)` 유니크 인덱스 |
| 047 | `user_benefits` prepaid 허용 |
| **057** | `is_all_product`, `installment_condition`, benefit_type 정규화 + `all` CHECK |
| 058 | 카드사별 `{카드사명} 전체` 시드 |
| 059 | 삼성 카드고릴라 신규 카드 시드 |
| **060** | 하나카드 제외 테스트 카드 `is_active=false` + 연쇄 user_benefits 정리 |

마이그레이션 적용 순서: **057 → 058 → 059 → 060** (060 검증은 058 카드사 전체 시드 필요)

테스트 카드 탐지(수동): `cleanup/detect_test_card_products.sql`  
정리 후 검증(수동): `cleanup/verify_after_card_cleanup.sql`  
**운영 테스트 데이터 초기화:** `cleanup/clear_test_operational_data.sql` (또는 `npm run cleanup:test-operational-data`)
