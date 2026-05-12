export type PromoSlotFormFields =
  | "title"
  | "description"
  | "badge"
  | "image_url"
  | "link_type"
  | "href"
  | "hashtags"
  | "priority"
  | "sponsor_name"
  | "starts_at"
  | "ends_at";

export type PromoSlotFormState = {
  message?: string;
  fieldErrors?: Partial<Record<PromoSlotFormFields, string>>;
};

export type PromoSlotPayload = {
  title: string;
  description: string;
  badge: string;
  image_url: string | null;
  link_type: "internal" | "external";
  href: string;
  hashtags: string[];
  priority: number;
  is_active: boolean;
  is_sponsored: boolean;
  sponsor_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeInternalHref(value: string) {
  if (!value) {
    return null;
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return null;
}

function normalizeExternalHref(value: string) {
  if (!value || !/^https?:\/\//i.test(value)) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function normalizeDateTime(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function parseHashtags(value: string) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(/[\s,]+/)
        .map((tag) => tag.trim().replace(/^#+/, ""))
        .filter(Boolean)
        .map((tag) => `#${tag}`),
    ),
  );
}

export function parsePromoSlotForm(formData: FormData) {
  const title = readString(formData, "title");
  const description = readString(formData, "description");
  const badge = readString(formData, "badge");
  const imageUrlValue = readString(formData, "image_url");
  const linkTypeValue = readString(formData, "link_type");
  const hrefValue = readString(formData, "href");
  const hashtagsValue = readString(formData, "hashtags");
  const priorityValue = readString(formData, "priority");
  const sponsorName = readString(formData, "sponsor_name");
  const startsAtValue = readString(formData, "starts_at");
  const endsAtValue = readString(formData, "ends_at");
  const isActive = formData.get("is_active") === "on";
  const isSponsored = formData.get("is_sponsored") === "on";
  const fieldErrors: PromoSlotFormState["fieldErrors"] = {};

  if (!title) {
    fieldErrors.title = "제목을 입력해 주세요.";
  }

  if (!description) {
    fieldErrors.description = "설명을 입력해 주세요.";
  }

  if (!badge) {
    fieldErrors.badge = "배지를 입력해 주세요.";
  }

  const imageUrl =
    normalizeInternalHref(imageUrlValue) ?? normalizeExternalHref(imageUrlValue);
  if (imageUrlValue && !imageUrl) {
    fieldErrors.image_url = "올바른 이미지 URL을 입력해 주세요.";
  }

  const linkType =
    linkTypeValue === "external" || linkTypeValue === "internal"
      ? linkTypeValue
      : null;
  if (!linkType) {
    fieldErrors.link_type = "링크 타입을 선택해 주세요.";
  }

  const href =
    linkType === "external"
      ? normalizeExternalHref(hrefValue)
      : normalizeInternalHref(hrefValue);
  if (!href) {
    fieldErrors.href =
      linkType === "external"
        ? "외부 링크는 http:// 또는 https://로 시작해야 합니다."
        : "내부 링크는 /로 시작해야 합니다.";
  }

  const hashtags = parseHashtags(hashtagsValue);

  const priority = priorityValue ? Number(priorityValue) : 0;
  if (!Number.isInteger(priority)) {
    fieldErrors.priority = "우선순위는 정수로 입력해 주세요.";
  }

  const startsAt = normalizeDateTime(startsAtValue);
  if (startsAtValue && !startsAt) {
    fieldErrors.starts_at = "시작일을 올바르게 입력해 주세요.";
  }

  const endsAt = normalizeDateTime(endsAtValue);
  if (endsAtValue && !endsAt) {
    fieldErrors.ends_at = "종료일을 올바르게 입력해 주세요.";
  }

  if (startsAt && endsAt && new Date(startsAt).getTime() > new Date(endsAt).getTime()) {
    fieldErrors.ends_at = "종료일은 시작일 이후여야 합니다.";
  }

  if (Object.keys(fieldErrors).length > 0 || !href || !linkType) {
    return { fieldErrors };
  }

  const payload: PromoSlotPayload = {
    title,
    description,
    badge,
    image_url: imageUrl,
    link_type: linkType,
    href,
    hashtags,
    priority,
    is_active: isActive,
    is_sponsored: isSponsored,
    sponsor_name: isSponsored ? sponsorName || null : null,
    starts_at: startsAt,
    ends_at: endsAt,
  };

  return { payload };
}

export function toDatetimeLocalValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
