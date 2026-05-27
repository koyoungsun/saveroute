export type DiscountBenefitProductCellItem = {
  id?: number;
  name: string;
  providerId?: number;
  benefitType?: string;
};

type DiscountBenefitProductsCellProps = {
  products: DiscountBenefitProductCellItem[];
};

function getBenefitProductItemKey(
  item: DiscountBenefitProductCellItem,
  index: number,
): string {
  if (item.id != null) {
    return String(item.id);
  }

  return `${item.providerId ?? "unknown"}-${item.name}-${item.benefitType ?? ""}-${index}`;
}

export function DiscountBenefitProductsCell({
  products,
}: DiscountBenefitProductsCellProps) {
  const cleaned = products.filter((item) => item.name.trim().length > 0);

  if (cleaned.length === 0) {
    return <>-</>;
  }

  if (cleaned.length === 1) {
    return (
      <span className="sr-admin-discounts-clip-1" title={cleaned[0].name}>
        {cleaned[0].name}
      </span>
    );
  }

  if (cleaned.length <= 3) {
    return (
      <div className="d-flex flex-wrap gap-1 sr-admin-discounts-clip-2">
        {cleaned.map((item, index) => (
          <span
            key={getBenefitProductItemKey(item, index)}
            className="badge text-bg-light border fw-normal"
          >
            {item.name}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="d-flex flex-wrap gap-1 align-items-center sr-admin-discounts-clip-1">
      <span className="badge text-bg-light border fw-normal">{cleaned[0].name}</span>
      <span className="badge text-bg-secondary fw-normal">
        외 {cleaned.length - 1}개
      </span>
    </div>
  );
}
