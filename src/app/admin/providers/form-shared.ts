export type ProviderType =
  | "telecom_major"
  | "telecom_mvno"
  | "card_company"
  | "coupon_platform"
  | "membership_company";

export type ProviderFieldName =
  | "name"
  | "code"
  | "benefit_category_id"
  | "provider_type"
  | "official_url"
  | "logo_url"
  | "display_order"
  | "memo";

export type ProviderFormState = {
  message?: string;
  fieldErrors?: Partial<Record<ProviderFieldName, string>>;
};

export type ValidatedProviderInput = {
  name: string;
  code: string;
  benefitCategoryId: number;
  providerType: ProviderType;
  officialUrl: string | null;
  logoUrl: string | null;
  displayOrder: number;
  memo: string | null;
  isActive: boolean;
};

const PROVIDER_TYPES: ProviderType[] = [
  "telecom_major",
  "telecom_mvno",
  "card_company",
  "coupon_platform",
  "membership_company",
];

function isProviderType(value: string): value is ProviderType {
  return (PROVIDER_TYPES as string[]).includes(value);
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readPositiveInteger(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readDisplayOrder(value: string) {
  if (!value) return 500;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function normalizeCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeOptionalUrl(value: string) {
  if (!value) return { url: null as string | null, invalid: false };

  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    return { url: new URL(normalized).toString(), invalid: false };
  } catch {
    return { url: null, invalid: true };
  }
}

export function validateProviderForm(
  formData: FormData,
): { ok: true; data: ValidatedProviderInput } | { ok: false; state: ProviderFormState } {
  const name = readString(formData, "name");
  const codeRaw = readString(formData, "code");
  const benefitCategoryIdValue = readString(formData, "benefit_category_id");
  const providerTypeRaw = readString(formData, "provider_type");
  const officialUrlValue = readString(formData, "official_url");
  const logoUrlValue = readString(formData, "logo_url");
  const displayOrderValue = readString(formData, "display_order");
  const memo = readString(formData, "memo");
  const isActive = formData.get("is_active") === "on";

  const fieldErrors: ProviderFormState["fieldErrors"] = {};
  const code = normalizeCode(codeRaw);

  if (!name) {
    fieldErrors.name = "제공사명을 입력해 주세요.";
  }

  if (!code) {
    fieldErrors.code = "code(고유 식별자)를 입력해 주세요.";
  } else if (!/^[a-z0-9_]+$/.test(code)) {
    fieldErrors.code = "code는 영문 소문자, 숫자, 밑줄(_)만 사용할 수 있습니다.";
  }

  const benefitCategoryId = readPositiveInteger(benefitCategoryIdValue);
  if (!benefitCategoryId) {
    fieldErrors.benefit_category_id = "혜택 카테고리를 선택해 주세요.";
  }

  if (!isProviderType(providerTypeRaw)) {
    fieldErrors.provider_type = "provider_type을 선택해 주세요.";
  }

  const displayOrder = readDisplayOrder(displayOrderValue);
  if (displayOrder === null) {
    fieldErrors.display_order = "display_order는 0 이상의 정수여야 합니다.";
  }

  const official = normalizeOptionalUrl(officialUrlValue);
  if (official.invalid) {
    fieldErrors.official_url = "올바른 official_url을 입력해 주세요.";
  }

  const logo = normalizeOptionalUrl(logoUrlValue);
  if (logo.invalid) {
    fieldErrors.logo_url = "올바른 logo_url을 입력해 주세요.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, state: { fieldErrors } };
  }

  return {
    ok: true,
    data: {
      name,
      code,
      benefitCategoryId: benefitCategoryId!,
      providerType: providerTypeRaw as ProviderType,
      officialUrl: official.url,
      logoUrl: logo.url,
      displayOrder: displayOrder!,
      memo: memo || null,
      isActive,
    },
  };
}

export function mapUniqueCodeError(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return {
      fieldErrors: {
        code: "이미 사용 중인 code입니다.",
      },
    } satisfies ProviderFormState;
  }
  return { message: error.message } satisfies ProviderFormState;
}
