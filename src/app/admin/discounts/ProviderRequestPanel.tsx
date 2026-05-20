"use client";

import { useActionState, useState } from "react";

import {
  createProviderRequestAction,
  type ProviderRequestFormState,
} from "./provider-request-actions";

const initialState: ProviderRequestFormState = {};

export function ProviderRequestPanel({
  categoryCode,
  disabled,
}: {
  categoryCode: string | null;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createProviderRequestAction, initialState);

  if (categoryCode !== "card") {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        className="btn btn-sm btn-outline-primary"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
      >
        {open ? "카드사 요청 닫기" : "카드사 요청"}
      </button>

      {open ? (
        <div className="border rounded-3 p-3 mt-2 bg-light">
          <p className="small text-muted mb-2">
            카드사(provider)는 승인 후 등록됩니다. 요청 후{" "}
            <strong>/admin/provider-requests</strong>에서 승인해 주세요.
          </p>
          <form action={formAction} className="d-flex flex-column gap-2">
            <input type="hidden" name="category" value="card" />
            <input
              name="provider_name"
              className="form-control form-control-sm"
              placeholder="예: 우리카드"
              required
              maxLength={120}
            />
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-sm btn-primary">
                요청 등록
              </button>
            </div>
            {state.message ? (
              <div
                className={`small ${state.ok ? "text-success" : "text-danger"}`}
                role="status"
              >
                {state.message}
              </div>
            ) : null}
          </form>
        </div>
      ) : null}
    </div>
  );
}
