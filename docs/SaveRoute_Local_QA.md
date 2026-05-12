# SaveRoute 로컬 QA (검색·혜택 개인화)

비로그인 검색·로그인 후 «내 할인 가능»·미등록 브랜드 요청까지 재현할 때의 순서입니다.

## 전제

- 루트에 `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Next dev: `npm run dev` (기본 `http://localhost:3000`)

## 1. DB 마이그레이션

원격 프로젝트에 마이그레이션이 반영되어 있어야 비로그인(anon) 검색이 카탈로그를 읽습니다.

- **권장:** 프로젝트를 링크한 뒤  
  `npx supabase link` → `npx supabase db push`  
  (`supabase/config.toml` 은 `supabase init` 으로 생성됨)
- **또는:** Dashboard → SQL Editor 에서 누락분만 실행  
  - 특히 **`023_fix_anon_catalog_read_policies.sql`** — `anon`/`authenticated` 카탈로그 SELECT + `search_logs.result_count` 보강  
  - QA 브랜드·할인: **`022_seed_search_personalization_qa_data.sql`** 또는 아래 시드 스크립트

## 2. QA 시드 (서비스 롤)

마이그레이션과 동일한 QA 데이터를 빠르게 넣을 때:

```bash
npm run seed:qa
```

(MVNO 상품 021 수준 + QA 브랜드 5·할인 5)

## 3. anon RLS 빠른 확인

```bash
npm run check:anon
```

`qa-starbucks` 행이 **anon**으로 보이면 비로그인 검색 전제가 갖춰진 것입니다. 비어 있으면 **`023`** 이 원격에 반영되지 않은 경우가 많습니다.

## 4. 비로그인 검색 API

```bash
node -e "fetch('http://localhost:3000/api/search?keyword='+encodeURIComponent('스타벅스')).then(r=>r.json()).then(console.log)"
```

확인:

- `matchedBrand` 존재, `discounts.length >= 1`
- `authenticated === false` 이면 `ownedDiscountIds` 는 빈 배열 → **«내 할인 가능» 없음**
- 첫 할인에 맞게 `bestDiscountId` 설정 → UI **BEST**

브랜드별 키워드 예: 스타벅스, CGV, 메가커피, 배스킨라빈스, 파리바게뜨.

## 5. search_logs

마이그레이션 **`017`** 또는 **`023`** 로 `result_count` 컬럼이 있어야 로그에 건수가 쌓입니다. 없으면 삽입은 앱에서 조용히 스킵될 수 있습니다.

## 6. 로그인·온보딩·개인화

1. 새 계정 가입/로그인 → 혜택 없으면 **`/onboarding`**
2. **KT** 선택(통신사 카드) → 완료 후 홈/검색
3. **스타벅스** 검색 → **KT 멤버십 스타벅스** 할인에 **«내 할인 가능»**

## 7. 카드 혜택

**`/my-benefits`** 에서 신한·KB 카드 상품 추가 후 **메가커피** / **파리바게뜨** 검색 → 해당 할인에 배지.

## 8. 미등록 브랜드

**`테스트미등록브랜드123`** 검색 → **「아직 등록되지 않은 브랜드입니다.»** → **업데이트 요청하기** → `brand_requests` 에 `pending` 행 (서버는 비로그인 시 서비스 롤로 처리).

## 9. 삭제

**`/my-benefits`** 에서 혜택 제거 후 동일 브랜드 재검색 → **«내 할인 가능»** 소멸.

## 참고 파일

| 목적 | 파일 |
|------|------|
| anon 카탈로그 읽기·result_count | `supabase/migrations/023_fix_anon_catalog_read_policies.sql` |
| QA 브랜드·할인 (메모 접두사 `QA_SEED\|`) | `supabase/migrations/022_seed_search_personalization_qa_data.sql` |
| 로컬 시드 스크립트 | `scripts/seed-personalization-qa.cjs` |
| anon 진단 | `scripts/check-anon-brands.cjs` |

QA 데이터만 지울 때 (Dashboard SQL 등):

```sql
DELETE FROM public.discounts WHERE admin_memo LIKE 'QA_SEED|%';
DELETE FROM public.brands WHERE admin_memo LIKE 'QA_SEED|%';
```
