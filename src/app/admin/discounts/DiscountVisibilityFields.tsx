import { DiscountFormField } from "./DiscountFormField";
import { DiscountFormOptionGroup } from "./DiscountFormOptionGroup";
import { DISCOUNT_STATUS_OPTIONS } from "@/lib/ui/format-status-label";

export function DiscountVisibilityFields({
  mode,
  defaultStatus = "active",
  statusError,
}: {
  mode: "create" | "edit";
  defaultStatus?: string;
  statusError?: string;
}) {
  if (mode === "create") {
    return (
      <DiscountFormOptionGroup group="visibility" label="노출 상태" defaultOpen>
        <div className="col-12">
          <DiscountFormField label="활성 상태" htmlFor="is_active">
            <div className="form-check form-switch mb-0">
              <input
                id="is_active"
                name="is_active"
                className="form-check-input"
                type="checkbox"
                defaultChecked
              />
              <label className="form-check-label" htmlFor="is_active">
                활성 상태로 등록
              </label>
            </div>
          </DiscountFormField>
        </div>
      </DiscountFormOptionGroup>
    );
  }

  return (
    <DiscountFormOptionGroup group="visibility" label="노출 상태" defaultOpen>
      <div className="col-md-6">
        <DiscountFormField label="상태" htmlFor="status" required error={statusError}>
          <select
            id="status"
            name="status"
            className="form-select"
            defaultValue={defaultStatus}
            required
          >
            {DISCOUNT_STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </DiscountFormField>
      </div>
    </DiscountFormOptionGroup>
  );
}
