import { DISCOUNT_UNIT_OPTIONS } from "@/lib/discounts/discount-units";

type AdminDiscountUnitSelectProps = {
  id: string;
  name: string;
  value: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  required?: boolean;
  className?: string;
};

export function AdminDiscountUnitSelect({
  id,
  name,
  value,
  onChange,
  defaultValue,
  required,
  className = "form-select",
}: AdminDiscountUnitSelectProps) {
  const isControlled = onChange != null;

  return (
    <select
      id={id}
      name={name}
      className={className}
      value={isControlled ? value : undefined}
      defaultValue={isControlled ? undefined : defaultValue}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      required={required}
    >
      {DISCOUNT_UNIT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
