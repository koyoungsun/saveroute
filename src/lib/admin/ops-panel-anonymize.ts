const GENDER_LABELS: Record<string, string> = {
  male: "남성",
  female: "여성",
  other: "기타",
};

const AGE_LABELS: Record<string, string> = {
  "10s": "10대",
  "20s": "20대",
  "30s": "30대",
  "40s": "40대",
  "50s": "50대",
  "60s+": "60대+",
};

function shortHash(value: string): string {
  return value.replace(/-/g, "").slice(-4).toUpperCase();
}

export function buildAnonymizedVisitorLabel(input: {
  userId: string | null;
  sessionId: string | null;
}): string {
  if (input.userId) {
    return `로그인 사용자 #${shortHash(input.userId)}`;
  }

  if (input.sessionId) {
    return `비로그인 사용자 #${shortHash(input.sessionId)}`;
  }

  return "비로그인 사용자";
}

export function formatProfileGenderLabel(value: string | null | undefined): string {
  if (!value) {
    return "정보 없음";
  }

  return GENDER_LABELS[value] ?? "정보 없음";
}

export function formatProfileAgeLabel(value: string | null | undefined): string {
  if (!value) {
    return "정보 없음";
  }

  return AGE_LABELS[value] ?? "정보 없음";
}

export function formatOpsPanelTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
