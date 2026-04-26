# SaveRoute PRD v1.0

> 프로젝트 책임자: Aiden | 회사: CoreRoute | 최종 수정: 2025-04

---

## 1. 서비스 개요

### 1.1 서비스 정의

**SaveRoute**는 사용자가 등록한 통신사 멤버십 / 카드 혜택을 기준으로, 특정 브랜드·상호에서 어떤 혜택을 사용하는 것이 가장 유리한지 빠르게 안내하는 모바일 우선 PWA 서비스다.

> 핵심 가치: "할인 정보를 많이 보여주는 것"이 아니라 **"귀찮은 비교와 판단 시간을 줄여주는 것"**

### 1.2 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) + TypeScript |
| 백엔드/DB | Supabase (Auth + PostgreSQL + Storage) |
| 사용자 UI | Tailwind CSS (모바일 우선) |
| 어드민 UI | Bootstrap 5 + Chart.js |
| 배포 | Vercel |
| 서비스 형태 | PWA (모바일 우선) |

### 1.3 사용자 역할

| 역할 | 설명 |
|------|------|
| `user` | 일반 사용자. 검색·혜택 설정 가능 |
| `operator` | 어드민 운영자. master 초대 필요. 최대 5명 |
| `master` | 최고 관리자. 1명. 모든 권한 |

---

## 2. MVP 범위

### 포함 기능

- 회원가입 / 로그인 / 세션 유지
- 내 혜택 설정 (통신사, 통신사 등급, 알뜰요금제, 카드사, 카드, 카드 타입)
- 브랜드·상호 검색
- 검색 결과 노출 (할인율 기준 최대 3개)
- 내 혜택 베스트 / 최대 할인 추천 노출
- `+` 더보기 상세 정보
- 데이터 없는 상호 업데이트 요청
- 어드민 (브랜드/할인/카테고리/제공사/혜택상품 CRUD)
- 어드민 대시보드 KPI 카드 + 차트
- 검색 로그 / 요청 로그 / 통계

### 제외 기능 (v2 이후)

- 위치 기반 추천
- 온라인 쇼핑몰 실시간 가격 비교
- 청구할인 정밀 계산
- 개인별 검색 이력 추적
- 복잡한 쿠폰 적용 로직
- 배너 광고

---

## 3. 사용자 화면 상세

### 3.1 홈 (`/`)

**비로그인 상태**
- 로고, 메인 입력창, 검색 버튼 노출
- placeholder: `"어디에서 가장 싸게 쓸 수 있을까요?"`
- 검색 시도 → 로그인/회원가입 화면으로 이동 (검색어 쿼리 파라미터 유지)

**로그인 상태**
- 로고, 메인 입력창, 검색 버튼
- (선택) 최근 많이 찾은 브랜드 칩 노출

### 3.2 검색 결과 (`/search?keyword=`)

**결과 있음 (matched)**

```
[브랜드명]

🏆 내 할인 베스트
1. 신한카드          최대 30%    현장결제
2. KT 멤버십         최대 20%    앱 예매
3. SKT 멤버십        최대 15%    현장결제

[+ 더보기]
```

- 할인율(%) 기준 내림차순 정렬 (최대 3개)
- `won` / `special_price` / `free` 단위는 별도 표시, 정렬은 단순 우선순위 규칙
- 각 항목: 할인명, 할인율/할인가, 적용 방식 태그

**더보기 영역 (토글 또는 별도 페이지)**

- 전체 active 할인 목록
- 상세 조건 (`condition_text`)
- 중복 적용 여부 + 설명 (`stacking_note`)
- 출처 URL (`source_url`) — 없으면 미표시
- 최근 확인일 (`last_checked_at`)
- 만료일 (`valid_until`) — `has_no_expiry = true`이면 미노출
- 알뜰요금제 해당 시: `"알뜰요금제 혜택은 통신사/요금제별로 다를 수 있어 실제 적용 여부 확인이 필요합니다."` 안내

**결과 없음 (unmatched)**

- 안내 문구: `"아직 해당 업체의 할인 정보가 없습니다."`
- `[업데이트 요청하기]` 버튼
- 동일 키워드 누적 검색 3회 이상 시 버튼을 더 강조(primary 스타일)
- 요청 시 `brand_requests` 테이블의 `request_count` 증가 (신규 row 생성 아님)
- `request_count` 최대 10회

**브랜드 있으나 active 할인 없음**

- `"현재 등록된 할인이 없습니다."` 안내
- 만료된 할인만 있는 경우: `"만료된 할인 정보만 있습니다."` 안내

### 3.3 내 혜택 설정 (`/my-benefits`)

| 항목 | 설명 |
|------|------|
| 통신사 선택 | provider_type = `telecom_major` \| `telecom_mvno` |
| 통신사 등급 선택 | grade 필드 기반 |
| 알뜰요금제 선택 | is_mvno = true 인 benefit_products |
| 카드사 선택 | provider_type = `card_company` |
| 카드 선택 | product_type = `credit_card` \| `debit_card` \| `prepaid_card` |
| 카드 타입 표시 | card_type 값 표시 (신용/체크/선불/기타) |

- 등록된 혜택 목록 노출
- 저장 버튼 (upsert to `user_benefits`)

### 3.4 마이페이지 (`/mypage`)

- 내 혜택 요약 (등록된 혜택 수)
- 성별 선택 (선택 입력, 집계 통계 전용)
- 연령대 선택 (선택 입력, 집계 통계 전용)
- 내 혜택 수정 → `/my-benefits` 링크
- 이용약관 (`/terms`)
- 개인정보 처리방침 (`/privacy`)
- 로그아웃
- 회원 탈퇴 (확인 모달 후 처리)

---

## 4. 예외 케이스 처리

| 상황 | 처리 방법 |
|------|-----------|
| 로그인 안 됨 | 검색 시 로그인 유도 (검색어 보존) |
| 내 혜택 없음 | `"혜택을 먼저 등록해주세요"` + `/my-benefits` 이동 버튼 |
| 카드 없음 | 카드 혜택 항목 미노출, 통신사 혜택만 표시 |
| 통신사 없음 | 통신사 혜택 항목 미노출, 카드 혜택만 표시 |
| 검색 결과 없음 | unmatched 화면 + 업데이트 요청 버튼 |
| 브랜드 있으나 active 할인 없음 | `"현재 등록된 할인이 없습니다."` |
| 만료된 할인만 있음 | `"만료된 할인 정보만 있습니다."` |
| 알뜰요금제 데이터 신뢰도 낮음 (`low`) | 결과 노출 + 별도 안내 문구 표시 |
| 네트워크 오류 | Toast 에러 + 재시도 버튼 |
| 권한 없음 (어드민) | `/admin/login`으로 리다이렉트 |
| 어드민 세션 만료 | 자동 로그아웃 + `/admin/login` |
| 업데이트 요청 최대 카운트 도달 (10회) | `"이미 최다 요청된 업체입니다."` 안내 |
| 할인 데이터 source_url 없음 | 출처 URL 항목 미노출 |
| has_no_expiry = true | 만료일 항목 미노출 |

---

## 5. 검색 및 정렬 로직

```
1. 검색어 정규화 (공백 제거, 소문자, 특수문자 제거)
2. brands.name 또는 aliases[]에서 정규화 키워드 매칭
3. 로그인 사용자의 user_benefits 조회
4. 해당 브랜드의 status = 'active' 인 discounts 조회
5. user_benefits와 discounts를
   benefit_category_id / provider_id / benefit_product_id 기준으로 매칭
6. discount_unit = 'percent' → discount_value 기준 내림차순 정렬
7. discount_unit = 'won' / 'special_price' / 'free' / 'unknown' →
   별도 표시, percent 이후에 노출 (MVP: 단순 우선순위)
8. 최대 3개 노출 (내 혜택 베스트)
9. + 더보기: 전체 active 할인 노출 (내 혜택 + 전체)
10. status = 'expired' 할인 기본 미노출
11. is_mvno = true 혜택 포함 시 알뜰요금제 안내 문구 노출
12. has_no_expiry = true 시 만료일 미노출
```

---

## 6. 개인정보 보호 정책

- `search_logs`: user_id 저장 금지
- `result_click_logs`: user_id 저장 금지
- 성별/연령대는 집계 통계 전용 (개인 추적 불가)
- 어드민: 일반 유저 개인정보 상세 조회 불가
- 어드민: 개인별 검색 이력 조회 불가

---

## 7. PWA 설정

- `manifest.json`: name, short_name, icons, start_url, display: standalone
- Service Worker: 정적 자산 캐싱
- iOS Safari 홈 화면 추가 메타태그 지원
