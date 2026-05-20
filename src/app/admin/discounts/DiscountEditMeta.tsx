import { formatAdminDiscountTimestamp } from "@/lib/admin/discount-list-query";
import { formatDiscountElapsedBadge } from "@/lib/admin/discount-edit-meta";

export function DiscountEditMeta({
  createdAt,
  updatedAt,
}: {
  createdAt: string;
  updatedAt: string;
}) {
  return (
    <div className="card sr-block sr-admin-discounts-meta mb-3">
      <div className="card-body py-2 px-3">
        <div className="sr-admin-discounts-meta-bar">
          <div className="sr-admin-discounts-meta-dates">
            <span>
              작성일{" "}
              <strong className="sr-admin-discounts-meta-date">
                {formatAdminDiscountTimestamp(createdAt)}
              </strong>
            </span>
            <span className="sr-admin-discounts-meta-sep" aria-hidden="true">
              |
            </span>
            <span>
              최종수정일{" "}
              <strong className="sr-admin-discounts-meta-date">
                {formatAdminDiscountTimestamp(updatedAt)}
              </strong>
            </span>
          </div>
          <div className="sr-admin-discounts-meta-badges">
            <span className="sr-admin-discounts-elapsed-badge">
              {formatDiscountElapsedBadge("작성 후", createdAt)}
            </span>
            <span className="sr-admin-discounts-elapsed-badge">
              {formatDiscountElapsedBadge("수정 후", updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
