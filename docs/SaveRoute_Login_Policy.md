# SaveRoute 로그인·검색 정책 (MVP)

## 원칙

1. **비로그인** 사용자는 **브랜드 검색** 및 **전체 활성 할인 결과 조회**가 가능하다.
2. **로그인**은 **개인화**(내 혜택 매칭, 마이페이지, 혜택 등록)가 필요할 때만 요구한다.
3. **내 통신사·카드 혜택 등록**, **내 할인 가능 배지**, **마이페이지**는 **로그인 사용자만** 접근한다.
4. MVP 인증 수단은 **이메일·비밀번호**와 **구글 OAuth**를 우선한다.
5. **카카오** 로그인은 UI·코드 구조만 두고 **추후 연결**한다 (`signInWithOAuth({ provider: 'kakao' })` 등).
6. **회원가입 필수** 정보는 **이메일( 및 비밀번호)** 만 사용한다.
7. **nickname / birth_year / gender**(및 온보딩 연령대 등)는 **선택**이며 초기 화면에서 강제하지 않는다.
8. **검색 로그**는 비로그인 포함 저장한다. **개인 식별 정보는 저장하지 않으며**, 앱에서는 `gender_group`·`age_group`를 **항상 NULL**로 넣는다. 스키마상 유지되는 필드는 `keyword`, `normalized_keyword`, `matched_brand_id`, `result_status`, `result_count`, `created_at` 등이다.
9. **user_benefits**는 Supabase **`auth.users.id`**(`user_id`)와 FK로 연결된다.
10. **RLS**: 사용자는 **본인 `user_benefits` 행만** 조회·삽입·수정·삭제할 수 있다.

## 보호 라우트

| 경로 | 정책 |
|------|------|
| `/search` | 공개 |
| `/` (홈 검색) | 공개 |
| `/my-benefits` | 로그인 필요 → `/auth/login?redirect=/my-benefits` |
| `/mypage` | 로그인 필요 → `/auth/login?redirect=/mypage` |
| `/onboarding` | 로그인 필요(선택 프로필)·미완료 플로우용 |

미들웨어(`middleware.ts`)와 각 페이지 `redirect`가 동일 정책을 따른다.

## UX 플로우

- 홈·검색은 **로그인 없이** 사용.
- 검색 결과에서 **「내 혜택 기준으로 보기」** CTA → `/auth/login?redirect=/my-benefits`.
- 이메일 로그인 기본 리다이렉트: **`redirect` 쿼리 없으면 `/my-benefits`**.
- 구글 로그인 완료 후 **`/auth/callback`** → `next`(기본 `/my-benefits`).
- 혜택 등록 후 검색으로 자유 이동.

## Supabase

- **OAuth**: Supabase 대시보드에서 Google 제공자 활성화 및 Site URL / Redirect URLs에  
  `{ORIGIN}/auth/callback` 등록 필요.
- **RLS**: `018_anon_public_search_rls.sql` — `anon` 카탈로그 SELECT. `018_search_logs_anon_insert_policy.sql` — `search_logs` 비식별 anon INSERT 및 `brand_requests` 초기 행 anon INSERT.
- **검색 로그**: `019_search_logs_segment_null.sql` — 로그인 사용자도 `gender_group`·`age_group`는 NULL만 허용 (비식별 로그).
- **user_benefits FK**: `020_user_benefits_fk_auth_users.sql` — `user_id`가 `auth.users(id)`를 직접 참조.

- **비로그인 검색·로컬 QA**: [`SaveRoute_Local_QA.md`](SaveRoute_Local_QA.md) · 마이그레이션 `023_fix_anon_catalog_read_policies.sql`.

## 검색 API

- `GET /api/search?keyword=` 는 로그인 여부와 무관하게 **동일 카탈로그**를 반환한다.
- `authenticated` 플래그와 `ownedDiscountIds`로 개인화 여부를 클라이언트가 구분한다.
