type DiscountBenefitProductsCellProps = {
  names: string[];
};

export function DiscountBenefitProductsCell({
  names,
}: DiscountBenefitProductsCellProps) {
  const cleaned = names.filter((name) => name.trim().length > 0);

  if (cleaned.length === 0) {
    return <>-</>;
  }

  if (cleaned.length === 1) {
    return (
      <span className="sr-admin-discounts-clip-1" title={cleaned[0]}>
        {cleaned[0]}
      </span>
    );
  }

  if (cleaned.length <= 3) {
    return (
      <div className="d-flex flex-wrap gap-1 sr-admin-discounts-clip-2">
        {cleaned.map((name) => (
          <span key={name} className="badge text-bg-light border fw-normal">
            {name}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="d-flex flex-wrap gap-1 align-items-center sr-admin-discounts-clip-1">
      <span className="badge text-bg-light border fw-normal">{cleaned[0]}</span>
      <span className="badge text-bg-secondary fw-normal">
        외 {cleaned.length - 1}개
      </span>
    </div>
  );
}
