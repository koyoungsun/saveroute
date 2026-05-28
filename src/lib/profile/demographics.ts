export const PROFILE_GENDER_VALUES = [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
] as const;

export type ProfileGender = (typeof PROFILE_GENDER_VALUES)[number];

export const PROFILE_GENDER_OPTIONS: ReadonlyArray<{
  value: ProfileGender;
  label: string;
}> = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "other", label: "기타" },
  { value: "prefer_not_to_say", label: "선택 안 함" },
];

export const PROFILE_AGE_GROUP_VALUES = [
  "10s",
  "20s",
  "30s",
  "40s",
  "50s",
  "60plus",
] as const;

export type ProfileAgeGroup = (typeof PROFILE_AGE_GROUP_VALUES)[number];

export const PROFILE_AGE_GROUP_OPTIONS: ReadonlyArray<{
  value: ProfileAgeGroup;
  label: string;
}> = [
  { value: "10s", label: "10대" },
  { value: "20s", label: "20대" },
  { value: "30s", label: "30대" },
  { value: "40s", label: "40대" },
  { value: "50s", label: "50대" },
  { value: "60plus", label: "60대 이상" },
];

export function isProfileGender(value: string): value is ProfileGender {
  return (PROFILE_GENDER_VALUES as readonly string[]).includes(value);
}

export function isProfileAgeGroup(value: string): value is ProfileAgeGroup {
  return (PROFILE_AGE_GROUP_VALUES as readonly string[]).includes(value);
}

/** 레거시 gender_group / 60s+ 값을 정규화 */
export function normalizeProfileGender(
  gender: string | null | undefined,
  genderGroup: string | null | undefined,
): ProfileGender | null {
  const raw = gender?.trim() || genderGroup?.trim();
  if (!raw) {
    return null;
  }
  if (isProfileGender(raw)) {
    return raw;
  }
  return null;
}

export function normalizeProfileAgeGroup(
  ageGroup: string | null | undefined,
): ProfileAgeGroup | null {
  const raw = ageGroup?.trim();
  if (!raw) {
    return null;
  }
  if (raw === "60s+") {
    return "60plus";
  }
  if (isProfileAgeGroup(raw)) {
    return raw;
  }
  return null;
}
