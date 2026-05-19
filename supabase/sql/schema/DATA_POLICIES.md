# SaveRoute 데이터 정책 (최종 스키마 기준)

`schema/*.sql` 과 `docs/SaveRoute_DB_ERD_v1.md` 에 반영된 운영 규칙입니다.

## benefit_products — 카드사 전체 상품

| 항목 | 값 |
|------|-----|
| `name` | `{카드사명} 전체` (예: `삼성카드 전체`) |
| `benefit_type` | `all` |
| `is_all_product` | `true` |
| `product_type` | `credit_card` |
| `card_type` | `unknown` |
| `code` | `{provider_code}_all` (예: `samsung_card_all`) |

**유니크:** `benefit_products_provider_all_product_uidx` — `provider_id` 당 카드사 전체 상품 **1개만** 허용.

**시드:** `seed/058_card_company_all_products.sql`, migration `058_seed_card_company_all_products.sql`

**멱등 키:** `(provider_id, name, COALESCE(benefit_type, ''))`

## user_benefits — 카드사 전체 등록

- 사용자가 카드사 전체를 등록하면 `benefit_product_id` = 해당 `{카드사명} 전체` 행 id
- `benefit_type` = `all`

## discounts — 카드사 전체 할인

- 카드사 전체에 적용되는 할인은 `benefit_product_id`에 **"{카드사명} 전체"** 상품 id를 연결한다.
- `benefit_product_id`를 null 로 두지 않는 것을 권장한다 (매칭·관리 일관성).
- `provider_id`는 해당 카드사와 일치해야 한다.
- `installment_condition`은 UI 표시용(할인 계산 미사용).

## 마이그레이션 vs 통합 스키마

| 용도 | 위치 |
|------|------|
| Supabase 이력 적용 | `supabase/migrations/` 번호 순 |
| 신규 환경·문서·리뷰 | `supabase/sql/schema/` (최종 CREATE 스냅샷) |
| 운영 DB 점진 패치 | `supabase/sql/patch/` (057 등, idempotent ALTER) |

`004` / `008` / `007` migration 원본은 **과거 이력**이며, 최종 컬럼 정의는 `schema/` 를 기준으로 한다.
