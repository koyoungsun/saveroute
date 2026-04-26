# SaveRoute DB ERD v1.0

> Supabase (PostgreSQL) 기반. `auth.users`는 Supabase 제공 기본 테이블.

---

## 1. ERD 관계 요약

```
auth.users (Supabase)
    │
    └──< profiles (1:1)
    └──< user_benefits (1:N)
    └──< coupons (1:N)

benefit_categories
    └──< providers (1:N)
    └──< benefit_products (1:N)
    └──< discounts (1:N)
    └──< user_benefits (1:N)

providers
    └──< benefit_products (1:N)
    └──< discounts (1:N)
    └──< user_benefits (1:N)

benefit_products
    └──< discounts (1:N, nullable)
    └──< user_benefits (1:N, nullable)

brand_categories
    └──< brands (1:N)

brands
    └──< discounts (1:N)
    └──< search_logs (1:N, nullable)
    └──< brand_daily_stats (1:N)
    └──< result_click_logs (1:N)

discounts
    └──< result_click_logs (1:N)

profiles
    └──< admin_audit_logs (1:N, admin only)
```

---

## 2. 테이블 상세 설계

### `profiles`
> Supabase auth.users와 1:1 연결. 앱 전용 사용자 정보.

```sql
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'user'
                  CHECK (role IN ('user', 'operator', 'master')),
  gender_group    TEXT CHECK (gender_group IN ('male', 'female', 'other', NULL)),
  age_group       TEXT CHECK (age_group IN ('10s', '20s', '30s', '40s', '50s', '60s+', NULL)),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `benefit_categories`
> 통신사, 카드, 쿠폰, 멤버십 등 혜택 분류.

```sql
CREATE TABLE benefit_categories (
  id          SERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,   -- 'telecom', 'card', 'coupon', 'membership'
  name        TEXT NOT NULL,          -- '통신사', '카드'
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `providers`
> KT, SKT, 신한카드 등 혜택 제공사.

```sql
CREATE TABLE providers (
  id                   SERIAL PRIMARY KEY,
  benefit_category_id  INT NOT NULL REFERENCES benefit_categories(id),
  name                 TEXT NOT NULL,
  code                 TEXT NOT NULL UNIQUE,   -- 'kt', 'skt', 'shinhan_card'
  provider_type        TEXT NOT NULL
                       CHECK (provider_type IN (
                         'telecom_major', 'telecom_mvno',
                         'card_company', 'coupon_platform', 'membership_company'
                       )),
  official_url         TEXT,
  logo_url             TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `benefit_products`
> KT VIP, T멤버십, 신한카드 Deep Dream 등 구체적 혜택 상품.

```sql
CREATE TABLE benefit_products (
  id                   SERIAL PRIMARY KEY,
  benefit_category_id  INT NOT NULL REFERENCES benefit_categories(id),
  provider_id          INT NOT NULL REFERENCES providers(id),
  name                 TEXT NOT NULL,
  code                 TEXT NOT NULL UNIQUE,
  product_type         TEXT NOT NULL
                       CHECK (product_type IN (
                         'telecom_membership', 'telecom_mvno_plan',
                         'credit_card', 'debit_card', 'prepaid_card',
                         'coupon', 'membership'
                       )),
  grade                TEXT,                -- 'VIP', 'Gold', 'Silver' (nullable)
  card_type            TEXT
                       CHECK (card_type IN ('credit', 'debit', 'prepaid', 'unknown', NULL)),
  is_mvno              BOOLEAN NOT NULL DEFAULT FALSE,
  mvno_notice_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `brand_categories`
> 음식, 여가, 쇼핑 등 브랜드 분류.

```sql
CREATE TABLE brand_categories (
  id          SERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `brands`
> 롯데월드, 스타벅스 등 검색 대상 브랜드/상호.

```sql
CREATE TABLE brands (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  category_id  INT REFERENCES brand_categories(id),
  aliases      TEXT[] DEFAULT '{}',    -- 검색 별칭 배열 ['롯데월드', 'lotte world']
  official_url TEXT,
  logo_url     TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  admin_memo   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 검색 성능을 위한 인덱스
CREATE INDEX idx_brands_name ON brands USING gin(to_tsvector('simple', name));
CREATE INDEX idx_brands_aliases ON brands USING gin(aliases);
```

---

### `discounts`
> 브랜드별 할인 정보. 핵심 테이블.

```sql
CREATE TABLE discounts (
  id                  SERIAL PRIMARY KEY,
  brand_id            INT NOT NULL REFERENCES brands(id),
  benefit_category_id INT NOT NULL REFERENCES benefit_categories(id),
  provider_id         INT NOT NULL REFERENCES providers(id),
  benefit_product_id  INT REFERENCES benefit_products(id),   -- nullable
  title               TEXT NOT NULL,
  summary             TEXT NOT NULL,
  detail              TEXT,
  condition_text      TEXT,
  discount_value      NUMERIC NOT NULL DEFAULT 0,
  discount_unit       TEXT NOT NULL
                      CHECK (discount_unit IN (
                        'percent', 'won', 'special_price', 'free', 'unknown'
                      )),
  special_price       NUMERIC,                               -- nullable
  usage_type          TEXT NOT NULL
                      CHECK (usage_type IN (
                        'onsite_payment', 'app_booking', 'online_booking',
                        'coupon_code', 'membership_app', 'unknown'
                      )),
  is_stackable        BOOLEAN NOT NULL DEFAULT FALSE,
  stacking_note       TEXT,
  valid_from          DATE,
  valid_until         DATE,
  has_no_expiry       BOOLEAN NOT NULL DEFAULT FALSE,
  source_url          TEXT,
  last_checked_at     DATE NOT NULL,
  data_confidence     TEXT NOT NULL DEFAULT 'medium'
                      CHECK (data_confidence IN ('high', 'medium', 'low')),
  status              TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'active', 'expired', 'hidden')),
  admin_memo          TEXT,
  created_by          UUID REFERENCES profiles(id),
  updated_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discounts_brand_id ON discounts(brand_id);
CREATE INDEX idx_discounts_status ON discounts(status);
CREATE INDEX idx_discounts_provider_id ON discounts(provider_id);
```

---

### `user_benefits`
> 사용자가 등록한 내 혜택 목록.

```sql
CREATE TABLE user_benefits (
  id                  SERIAL PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  benefit_category_id INT NOT NULL REFERENCES benefit_categories(id),
  provider_id         INT NOT NULL REFERENCES providers(id),
  benefit_product_id  INT REFERENCES benefit_products(id),   -- nullable
  custom_name         TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, benefit_category_id, provider_id, benefit_product_id)
);
```

---

### `coupons`
> 사용자 개인 쿠폰 (MVP에서는 UI 미노출, 테이블만 준비).

```sql
CREATE TABLE coupons (
  id             SERIAL PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brand_id       INT REFERENCES brands(id),
  provider_id    INT REFERENCES providers(id),
  coupon_name    TEXT NOT NULL,
  coupon_code    TEXT,
  discount_value NUMERIC NOT NULL DEFAULT 0,
  discount_unit  TEXT NOT NULL
                 CHECK (discount_unit IN ('percent', 'won', 'special_price', 'free', 'unknown')),
  valid_from     DATE,
  valid_until    DATE,
  status         TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'used', 'expired')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `search_logs`
> 검색 이력. **user_id 저장 금지 (개인정보 보호)**.

```sql
CREATE TABLE search_logs (
  id                  BIGSERIAL PRIMARY KEY,
  keyword             TEXT NOT NULL,
  normalized_keyword  TEXT NOT NULL,
  matched_brand_id    INT REFERENCES brands(id),   -- NULL if unmatched
  gender_group        TEXT,
  age_group           TEXT,
  result_status       TEXT NOT NULL
                      CHECK (result_status IN ('matched', 'unmatched')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_logs_keyword ON search_logs(normalized_keyword);
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at);
```

---

### `brand_requests`
> 데이터 없는 상호 업데이트 요청.

```sql
CREATE TABLE brand_requests (
  id                 SERIAL PRIMARY KEY,
  keyword            TEXT NOT NULL,
  normalized_keyword TEXT NOT NULL UNIQUE,   -- 중복 요청 방지
  request_count      INT NOT NULL DEFAULT 1 CHECK (request_count <= 10),
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'processing', 'completed', 'ignored')),
  memo               TEXT,
  last_requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `result_click_logs`
> 할인 결과 클릭 로그. **user_id 저장 금지**.

```sql
CREATE TABLE result_click_logs (
  id           BIGSERIAL PRIMARY KEY,
  brand_id     INT NOT NULL REFERENCES brands(id),
  discount_id  INT NOT NULL REFERENCES discounts(id),
  action_type  TEXT NOT NULL
               CHECK (action_type IN ('view_detail', 'use_discount')),
  gender_group TEXT,
  age_group    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `admin_audit_logs`
> 어드민 계정의 모든 변경 이력.

```sql
CREATE TABLE admin_audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES profiles(id),
  action        TEXT NOT NULL,        -- 'create', 'update', 'delete', 'status_change'
  target_table  TEXT NOT NULL,
  target_id     TEXT NOT NULL,
  before_data   JSONB,
  after_data    JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. 통계 테이블

### `daily_search_stats`
```sql
CREATE TABLE daily_search_stats (
  date                    DATE PRIMARY KEY,
  total_search_count      INT NOT NULL DEFAULT 0,
  matched_search_count    INT NOT NULL DEFAULT 0,
  unmatched_search_count  INT NOT NULL DEFAULT 0
);
```

### `brand_daily_stats`
```sql
CREATE TABLE brand_daily_stats (
  date                DATE NOT NULL,
  brand_id            INT NOT NULL REFERENCES brands(id),
  search_count        INT NOT NULL DEFAULT 0,
  detail_view_count   INT NOT NULL DEFAULT 0,
  discount_click_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (date, brand_id)
);
```

### `brand_request_daily_stats`
```sql
CREATE TABLE brand_request_daily_stats (
  date               DATE NOT NULL,
  normalized_keyword TEXT NOT NULL,
  request_count      INT NOT NULL DEFAULT 0,
  PRIMARY KEY (date, normalized_keyword)
);
```

### `daily_user_stats`
```sql
CREATE TABLE daily_user_stats (
  date              DATE PRIMARY KEY,
  signup_count      INT NOT NULL DEFAULT 0,
  active_user_count INT NOT NULL DEFAULT 0
);
```

### `segment_search_stats`
```sql
CREATE TABLE segment_search_stats (
  date         DATE NOT NULL,
  gender_group TEXT,
  age_group    TEXT,
  brand_id     INT REFERENCES brands(id),
  search_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (date, gender_group, age_group, brand_id)
);
```

---

## 4. Row Level Security (RLS) 정책

```sql
-- profiles: 본인만 조회/수정 가능
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- user_benefits: 본인만 CRUD
ALTER TABLE user_benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own benefits"
  ON user_benefits FOR ALL USING (auth.uid() = user_id);

-- brands, discounts: 인증된 사용자 조회만 허용
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users can read brands"
  ON brands FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users can read active discounts"
  ON discounts FOR SELECT USING (auth.role() = 'authenticated' AND status = 'active');
```

---

## 5. 데이터 정규화 함수

```sql
-- 검색어 정규화 함수
CREATE OR REPLACE FUNCTION normalize_keyword(keyword TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(REGEXP_REPLACE(TRIM(keyword), '[^가-힣a-zA-Z0-9]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## 6. 초기 Seed 데이터 (benefit_categories)

```sql
INSERT INTO benefit_categories (code, name, sort_order) VALUES
  ('telecom',    '통신사',   1),
  ('card',       '카드',     2),
  ('coupon',     '쿠폰',     3),
  ('membership', '멤버십',   4);
```
