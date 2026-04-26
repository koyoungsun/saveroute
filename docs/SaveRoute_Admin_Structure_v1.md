# SaveRoute Admin Structure v1.0

> 어드민은 일반 사용자에게 노출하지 않음. `/admin` 직접 접근 시 로그인/권한 체크.

---

## 1. 접근 정책

| 항목 | 정책 |
|------|------|
| 접근 역할 | `master`, `operator`만 가능 |
| master | 1명, 모든 권한 |
| operator | 최대 5명, master가 초대 + 권한 설정 필요 |
| 일반 유저 개인정보 조회 | 불가 |
| 개인별 검색 추적 | 불가 |
| 집계 통계 조회 | 가능 |

---

## 2. 어드민 라우트 목록

```
/admin/login                    어드민 로그인
/admin/dashboard                대시보드 (KPI 카드 + 차트)
/admin/brands                   브랜드 목록
/admin/brands/new               브랜드 등록
/admin/brands/:id               브랜드 상세 (통계 포함)
/admin/brands/:id/edit          브랜드 수정
/admin/discounts                할인 목록
/admin/discounts/new            할인 등록
/admin/discounts/:id/edit       할인 수정
/admin/benefit-categories       베네핏 카테고리 관리
/admin/providers                제공사 관리
/admin/benefit-products         혜택 상품 관리
/admin/brand-requests           업데이트 요청 목록
/admin/update-check             할인 데이터 확인 필요 목록
/admin/search-logs              검색 로그
/admin/stats                    통계
/admin/accounts                 운영자 계정 관리
/admin/audit-logs               감사 로그
```

---

## 3. 레이아웃

- Bootstrap 5 기반 사이드바 레이아웃
- 상단: 어드민명, 로그아웃 버튼
- 좌측 사이드바: 메뉴 트리
- 본문: 각 페이지 콘텐츠
- 반응형 (모바일 햄버거 메뉴)

---

## 4. 대시보드 (`/admin/dashboard`)

### 상단 KPI 카드 (6개)

| 카드 | 데이터 소스 |
|------|------------|
| 오늘 검색 수 | `daily_search_stats` WHERE date = today |
| 누적 검색 수 | `search_logs` COUNT |
| 오늘 신규회원 | `daily_user_stats` WHERE date = today |
| 활성 할인 수 | `discounts` WHERE status = 'active' |
| 업데이트 필요 할인 수 | `discounts` WHERE last_checked_at < 30일 전 AND status = 'active' |
| 미지원 요청 수 | `brand_requests` WHERE status = 'pending' |

### 차트 목록 (Chart.js)

| 차트명 | 타입 | 데이터 소스 |
|--------|------|------------|
| 일별 검색 추이 | Line | `daily_search_stats` 최근 30일 |
| 일별 신규회원 증가 | Line | `daily_user_stats` 최근 30일 |
| 브랜드별 검색 TOP 10 | Bar | `brand_daily_stats` GROUP BY brand_id |
| 미지원 요청 TOP 10 | Bar | `brand_requests` ORDER BY request_count DESC |
| 성별 검색 분포 | Doughnut | `segment_search_stats` GROUP BY gender_group |
| 연령대별 검색 분포 | Bar | `segment_search_stats` GROUP BY age_group |
| 카테고리별 검색 비율 | Pie | 브랜드 카테고리 기반 검색 수 |

---

## 5. 브랜드 관리

### 목록 페이지 (`/admin/brands`)

- 검색 (브랜드명, slug, 별칭)
- 카테고리 필터
- 노출 여부 필터
- 테이블: 브랜드명, slug, 카테고리, 할인 수, 노출 여부, 최근 검색 수, 수정일
- 등록 버튼

### 등록/수정 폼

| 필드 | 타입 | 필수 |
|------|------|------|
| 브랜드명 | text | ✅ |
| slug | text (auto-generate 가능) | ✅ |
| 카테고리 | select (brand_categories) | ✅ |
| 별칭 (aliases) | tag input (배열) | - |
| 공식 URL | url | - |
| 로고 URL | url | - |
| 노출 여부 | toggle | ✅ |
| 메모 | textarea | - |

### 브랜드 상세 (`/admin/brands/:id`)

- 기본 정보 카드
- 통계 섹션
  - 누적 검색 수
  - 오늘 검색 수
  - 최근 7일 검색 수
  - 일별 검색 그래프 (Line, 최근 30일)
  - 성별/연령대 분포 차트
- 등록된 할인 목록

---

## 6. 할인 관리

### 목록 페이지 (`/admin/discounts`)

- 검색 (타이틀, 브랜드명)
- 브랜드 필터
- 베네핏 카테고리 필터
- 상태 필터 (draft / active / expired / hidden)
- 테이블: 브랜드, 제목, 카테고리, 제공사, 할인값, 상태, 만료일, 최근 확인일

### 등록/수정 폼

| 필드 | 타입 | 필수 |
|------|------|------|
| 브랜드 | select (brands) | ✅ |
| 베네핏 카테고리 | select (benefit_categories) | ✅ |
| 제공사 | select (providers, 카테고리 연동) | ✅ |
| 혜택 상품 | select (benefit_products, nullable) | - |
| 제목 | text | ✅ |
| 요약 | text | ✅ |
| 상세 설명 | textarea | - |
| 조건 설명 | textarea | - |
| 할인 값 | number | ✅ |
| 할인 단위 | select: percent / won / special_price / free / unknown | ✅ |
| 특가 금액 | number (nullable) | - |
| 적용 방식 | select: onsite_payment / app_booking / online_booking / coupon_code / membership_app / unknown | ✅ |
| 중복 적용 가능 | checkbox | - |
| 중복 적용 설명 | text | - |
| 시작일 | date | - |
| 만료일 | date | - |
| 만료일 없음 | checkbox → 체크 시 만료일 비활성화 | - |
| 출처 URL | url | - |
| 최근 확인일 | date | ✅ |
| 데이터 신뢰도 | select: high / medium / low | ✅ |
| 상태 | select: draft / active / expired / hidden | ✅ |
| 관리자 메모 | textarea | - |

---

## 7. 베네핏 카테고리 관리 (`/admin/benefit-categories`)

초기값:

| code | name |
|------|------|
| telecom | 통신사 |
| card | 카드 |
| coupon | 쿠폰 |
| membership | 멤버십 |

- 추후 확장 가능 (code/name/sort_order/is_active)
- 삭제 대신 `is_active = false`로 비활성화

---

## 8. 제공사 관리 (`/admin/providers`)

| 필드 | 설명 |
|------|------|
| 이름 | KT, SKT, 신한카드 등 |
| code | kt, skt, shinhan_card 등 |
| provider_type | telecom_major / telecom_mvno / card_company / coupon_platform / membership_company |
| 베네핏 카테고리 | benefit_categories 연결 |
| 공식 URL | - |
| 로고 URL | - |
| 활성 여부 | - |

초기 데이터 (seed):
- KT, SKT, LGU+, KT M모바일, SK 7mobile, U+ 알뜰모바일
- 신한카드, 삼성카드, 현대카드, 국민카드, 하나카드

---

## 9. 혜택 상품 관리 (`/admin/benefit-products`)

| 필드 | 설명 |
|------|------|
| 이름 | KT VIP, SKT T멤버십 등 |
| code | kt_vip, skt_tmembership 등 |
| product_type | telecom_membership / telecom_mvno_plan / credit_card / debit_card / prepaid_card / coupon / membership |
| 제공사 | providers 연결 |
| 베네핏 카테고리 | benefit_categories 연결 |
| 등급 (grade) | nullable (VIP, Gold, Silver 등) |
| card_type | credit / debit / prepaid / unknown (카드 상품에만 적용) |
| is_mvno | boolean |
| mvno_notice_required | boolean (알뜰요금제 안내 필요 여부) |
| 활성 여부 | - |

---

## 10. 업데이트 요청 관리 (`/admin/brand-requests`)

- 테이블: 키워드, 요청 횟수, 상태, 최근 요청일
- 상태 변경: pending → processing → completed / ignored
- 메모 입력 가능
- 요청 횟수 기준 정렬 (인기 키워드 파악)

---

## 11. 검색 로그 (`/admin/search-logs`)

- 날짜 범위 필터
- 키워드 검색
- result_status 필터 (matched / unmatched)
- 테이블: keyword, 매칭 브랜드, 성별, 연령대, 결과, 시각
- **user_id 컬럼 없음 (개인정보 보호)**

---

## 12. 통계 (`/admin/stats`)

- 날짜 범위 선택
- 일별 검색 트렌드
- 브랜드별 검색 TOP
- 성별/연령대별 분포
- 미지원 요청 트렌드

---

## 13. 계정 관리 (`/admin/accounts`)

**master만 접근 가능**

- 운영자 초대 (이메일 초대 발송)
- 운영자 권한 설정 (접근 가능 메뉴 범위)
- 운영자 비활성화
- 최대 5명 제한

---

## 14. 감사 로그 (`/admin/audit-logs`)

- 어드민 계정의 모든 생성/수정/삭제 액션 기록
- target_table, target_id, before_data, after_data 포함
- 필터: 관리자 계정, 대상 테이블, 날짜 범위
- 삭제 불가 (read-only)
