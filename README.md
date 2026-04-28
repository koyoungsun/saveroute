## 프로젝트 소개

**SaveRoute**는 사용자가 등록한 혜택(통신사/카드 등)을 기반으로, 특정 브랜드에서 **가장 유리한 할인 경로**를 찾아주는 **모바일 퍼스트 PWA**입니다.

- **CoreRoute**: 현재(초기 단계) 임시 회사/프로젝트 오너 컨텍스트로 사용합니다.
- **Supabase**: 인증(Auth)과 데이터베이스(DB)를 사용합니다.

## 핵심 기능

- **혜택 등록**: 통신사/카드 혜택을 최대 개수 제한 내에서 등록/저장
- **검색**: 브랜드 키워드로 할인 정보를 조회
- **혜택 매칭**: 등록된 혜택과 할인 데이터(카테고리/제공사/상품 범위)를 매칭하여 상위 결과를 우선 노출
- **검색 로그/통계(경량)**: 검색 로그 저장 및 일별 집계(개인 식별 정보 최소화)

## 기술 스택

- **Frontend**: Next.js (App Router), TypeScript
- **User UI**: Tailwind CSS (모바일 퍼스트, 430px 레이아웃 기준)
- **Admin UI**: Bootstrap 5 + Chart.js
- **Backend/DB**: Supabase (Auth + Postgres)

## 현재 구현 상태

- **인증**
  - 이메일/비밀번호 회원가입/로그인
  - 보호 페이지 서버 세션 가드 적용: `/search`, `/my-benefits`, `/mypage`
- **내 혜택(My Benefits)**
  - `providers`, `benefit_products`, `user_benefits` 기반으로 로드/저장
  - 저장 API: `POST /api/user-benefits`
- **검색(Search)**
  - `brands`(이름/aliases) 매칭 후 `discounts` 조회
  - 사용자 `user_benefits`와 할인 매칭 (provider-level / product-specific 지원)
  - 검색 로그 저장 및 일별 통계 업데이트

## 주요 페이지

- **홈**: `/`
  - 로그인 상태에 따라 인사말/검색 또는 로그인·회원가입 진입 제공
- **검색(보호)**: `/search?keyword=...`
- **내 혜택 설정(보호)**: `/my-benefits`
- **마이페이지(보호)**: `/mypage`
- **인증**
  - 로그인: `/auth/login`
  - 회원가입: `/auth/signup`
- **Admin (Mock/초기)**
  - `/admin/*` (Bootstrap 5 기반 화면, 일부는 목업 단계)

## 보안/개인정보 원칙

- **검색 로그에는 `user_id`를 저장하지 않습니다.**
- **카드 번호, 결제 정보(결제 수단/결제 이력/승인 내역 등)는 저장하지 않습니다.**
- 저장하는 데이터는 서비스 제공에 필요한 최소 범위로 제한합니다.
  - 예: 혜택 카테고리/제공사/혜택 상품 참조(식별자) 중심
- Supabase RLS(Row Level Security)를 통해 사용자 데이터 접근을 제한합니다.

## 로컬 실행 방법

### 사전 준비

- Node.js(프로젝트에서 요구하는 버전) 및 npm 설치
- Supabase 프로젝트 생성 후, 로컬에서 사용할 **환경 변수 키만** 준비
  - **주의**: 이 저장소/README에는 비밀 값(Secrets)을 기록하지 않습니다.

### 설치

```bash
npm install
```

### 환경 변수 설정

`.env.local`에 아래 키를 설정합니다(값은 개인/환경에 따라 다름).

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`에 접속합니다.

## 향후 개발 계획

- 검색 결과 정교화(가중치/정렬 개선, 더 다양한 할인 타입 지원)
- 브랜드 업데이트 요청/피드백 루프(요청 수 기반 우선순위 등)
- 사용자 프로필(성별/연령대) 설정 UI 및 통계 고도화(개인정보 최소화 원칙 유지)
- Admin CRUD 실제 구현(브랜드/할인/혜택 상품 관리)
- PWA 품질 강화(오프라인 대응, 성능/접근성 개선)

---

### 참고

- 본 문서는 운영 환경 구성/배포 방식, Supabase 정책(RLS) 및 테이블 스키마가 확장됨에 따라 업데이트될 수 있습니다.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
