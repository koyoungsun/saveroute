const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parsePromoSlotId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (UUID_RE.test(trimmed)) {
    return trimmed;
  }

  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function isPromoSlotId(value: unknown): value is string {
  return parsePromoSlotId(value) !== null;
}
