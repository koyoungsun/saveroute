export type CardBenefitKind = "credit" | "debit" | "prepaid" | "all";

const KINDS: readonly CardBenefitKind[] = ["credit", "debit", "prepaid", "all"];

function asKind(value: string | null | undefined): CardBenefitKind | null {
  if (!value) return null;
  const v = String(value).toLowerCase().trim();
  return (KINDS as readonly string[]).includes(v) ? (v as CardBenefitKind) : null;
}

export type CardKindSource = {
  benefit_type: string | null;
  card_type: string | null;
  is_all_product?: boolean;
};

/**
 * benefit_products.card_type / benefit_type 기준으로 사용자가 고를 수 있는 카드 결제 유형.
 * is_all_product 또는 benefit_type=all 이면 'all' 만 허용.
 */
export function allowedCardBenefitKinds(row: CardKindSource): readonly CardBenefitKind[] {
  if (row.is_all_product || asKind(row.benefit_type) === "all") {
    return ["all"];
  }

  const bt = asKind(row.benefit_type);
  const ct = asKind(row.card_type);
  if (bt && ct && bt !== ct) {
    return [bt];
  }
  if (bt) return [bt];
  if (ct) return [ct];
  return ["credit", "debit", "prepaid"];
}

export function isCardBenefitKind(value: string): value is CardBenefitKind {
  return (KINDS as readonly string[]).includes(value);
}

/** 등록 UI에 노출하지 않을 placeholder·데모용 행(시드 unknown/unknown, 예시 코드 등) */
export function isCardCatalogPlaceholderForPicker(row: {
  name: string;
  code: string | null;
  card_type: string | null;
  benefit_type: string | null;
  is_all_product?: boolean;
}): boolean {
  if (row.is_all_product || asKind(row.benefit_type) === "all") {
    return false;
  }

  const name = row.name ?? "";
  if (name.startsWith("예시_")) {
    return true;
  }
  const code = (row.code ?? "").toLowerCase();
  if (code.includes("example")) {
    return true;
  }
  const bt = (row.benefit_type ?? "").toLowerCase();
  const ct = (row.card_type ?? "").toLowerCase();
  if (bt === "unknown" && ct === "unknown") {
    return true;
  }
  if (ct === "unknown" && (bt === "" || bt === "unknown")) {
    return true;
  }
  return false;
}
