import { formatDiscountValueDisplay } from "@/lib/discounts/format-discount-value";

export type DiscountAmountUnit =
  | "percent"
  | "point_percent"
  | "won"
  | "special_price"
  | "free"
  | "unknown";

export function shouldFormatDiscountValueWithComma(unit: string): boolean {
  return unit === "won" || unit === "special_price";
}

export function stripNumericSeparators(value: string): string {
  return value.replace(/,/g, "").trim();
}

export function parseNumericInput(value: string): number | null {
  const normalized = stripNumericSeparators(value);
  if (!normalized) {
    return null;
  }

  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
}

export function formatIntegerWithCommas(value: string | number): string {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatMoneyInputDisplay(value: string | number | null | undefined): string {
  if (value == null || value === "") {
    return "";
  }

  const raw = stripNumericSeparators(String(value));
  if (!raw) {
    return "";
  }

  const [integerPart, decimalPart] = raw.split(".");
  const formattedInteger = formatIntegerWithCommas(integerPart);
  if (decimalPart === undefined) {
    return formattedInteger;
  }

  return `${formattedInteger}.${decimalPart.replace(/\D/g, "")}`;
}

export function sanitizeMoneyInput(raw: string, allowDecimal = false): string {
  if (allowDecimal) {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const [head, ...rest] = cleaned.split(".");
    if (rest.length === 0) {
      return head;
    }
    return `${head}.${rest.join("").replace(/\./g, "")}`;
  }

  return raw.replace(/\D/g, "");
}

export function sanitizePercentInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [head, ...rest] = cleaned.split(".");
  if (rest.length === 0) {
    return head;
  }
  return `${head}.${rest.join("").replace(/\./g, "")}`;
}

export function formatAdminDiscountListValue(
  value: number | string,
  unit: string,
  valueMax?: number | string | null,
): string {
  return formatDiscountValueDisplay({
    value,
    valueMax,
    unit,
    style: "admin-list",
  });
}
