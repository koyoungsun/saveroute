"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";

import type { DiscountBenefitProductOption } from "@/lib/benefits/discount-product-options";
import type { InlineProviderCategoryCode } from "@/lib/admin/create-inline-provider";

import {
  createProviderInlineAction,
  type CreateProviderInlineResult,
} from "./card-provider-inline-actions";

export type InlineProviderOption = {
  id: number;
  name: string;
  benefit_category_id: number;
};

/** @deprecated Use InlineProviderOption */
export type InlineCardProviderOption = InlineProviderOption;

const COPY: Record<
  InlineProviderCategoryCode,
  {
    button: string;
    buttonClose: string;
    title: string;
    nameLabel: string;
    namePlaceholder: string;
    emptyNameError: string;
    saveButton: string;
    savingButton: string;
    successFallback: string;
    helper: string;
  }
> = {
  card: {
    button: "+ 신규 카드사 추가",
    buttonClose: "신규 카드사 추가 닫기",
    title: "신규 카드사 추가",
    nameLabel: "카드사명",
    namePlaceholder: "예: KB국민카드",
    emptyNameError: "카드사명을 입력해 주세요.",
    saveButton: "카드사 저장",
    savingButton: "저장 중...",
    successFallback: "카드사 추가 완료",
    helper:
      "code는 카드사명 기준으로 자동 생성됩니다. 저장 후 제공사 목록에 반영되며 방금 추가한 카드사가 자동 선택됩니다.",
  },
  membership: {
    button: "+ 신규 제공사 추가",
    buttonClose: "신규 제공사 추가 닫기",
    title: "신규 제공사 추가",
    nameLabel: "제공사명",
    namePlaceholder: "예: CJ ONE",
    emptyNameError: "제공사명을 입력해 주세요.",
    saveButton: "제공사 저장",
    savingButton: "저장 중...",
    successFallback: "제공사 추가 완료",
    helper:
      "code는 제공사명 기준으로 자동 생성됩니다. 저장 후 제공사 목록에 반영되며 방금 추가한 제공사가 자동 선택됩니다.",
  },
};

type InlineProviderAddPanelProps = {
  categoryCode: InlineProviderCategoryCode;
  benefitCategoryId: number;
  visible: boolean;
  disabled?: boolean;
  panelClassName?: string;
  onProviderCreated: (
    provider: InlineProviderOption,
    allProduct?: DiscountBenefitProductOption,
  ) => void;
  onSelectProvider: (providerId: string) => void;
};

export function InlineProviderAddPanel({
  categoryCode,
  benefitCategoryId,
  visible,
  disabled,
  panelClassName,
  onProviderCreated,
  onSelectProvider,
}: InlineProviderAddPanelProps) {
  const inputId = useId();
  const copy = COPY[categoryCode];
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [providerName, setProviderName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"info" | "danger">("info");
  const [pending, startTransition] = useTransition();
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetForm = () => {
    setProviderName("");
  };

  const closeAddPanel = () => {
    setShowAddPanel(false);
    resetForm();
    setFeedback(null);
  };

  const showTransientFeedback = (message: string, tone: "info" | "danger" = "info") => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }

    setFeedback(message);
    setFeedbackTone(tone);

    if (tone === "info") {
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback(null);
        feedbackTimerRef.current = null;
      }, 2500);
    }
  };

  const applyResult = (result: CreateProviderInlineResult) => {
    if (result.ok) {
      onProviderCreated(result.provider, result.allProduct);
      onSelectProvider(String(result.provider.id));
      closeAddPanel();
      showTransientFeedback(result.message ?? copy.successFallback, "info");
      return;
    }

    if (result.duplicateProvider) {
      onProviderCreated(result.duplicateProvider);
      onSelectProvider(String(result.duplicateProvider.id));
      closeAddPanel();
      showTransientFeedback(result.message, "info");
      return;
    }

    showTransientFeedback(result.message, "danger");
  };

  const handleSave = () => {
    const trimmedName = providerName.trim();
    if (!trimmedName) {
      setFeedback(copy.emptyNameError);
      setFeedbackTone("danger");
      return;
    }

    startTransition(async () => {
      const result = await createProviderInlineAction({
        benefitCategoryId,
        name: trimmedName,
        isActive: true,
      });
      applyResult(result);
    });
  };

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    closeAddPanel();
  }, [benefitCategoryId, categoryCode, visible]);

  if (!visible) {
    return null;
  }

  const shouldShowAddPanel = showAddPanel && !disabled;
  const panelClasses = panelClassName ?? "border rounded p-3 mt-2 bg-light";

  return (
    <div className="mt-2">
      {!disabled ? (
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => (showAddPanel ? closeAddPanel() : setShowAddPanel(true))}
          disabled={pending}
        >
          {showAddPanel ? copy.buttonClose : copy.button}
        </button>
      ) : null}

      {shouldShowAddPanel ? (
        <div className={panelClasses}>
          <h6 className="fw-semibold mb-3">{copy.title}</h6>
          <div className="row g-2">
            <div className="col-12">
              <label className="form-label mb-1" htmlFor={inputId}>
                {copy.nameLabel} <span className="text-danger">*</span>
              </label>
              <input
                id={inputId}
                className="form-control"
                value={providerName}
                onChange={(event) => setProviderName(event.target.value)}
                placeholder={copy.namePlaceholder}
                autoComplete="off"
              />
              <div className="form-text mb-0">{copy.helper}</div>
            </div>
            <div className="col-12 d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={closeAddPanel}
                disabled={pending}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={pending}
              >
                {pending ? copy.savingButton : copy.saveButton}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <div
          className={`form-text mb-0 mt-2 ${feedbackTone === "danger" ? "text-danger" : ""}`}
          role="status"
        >
          {feedback}
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated Use InlineProviderAddPanel */
export function InlineCardProviderAddPanel({
  cardCategoryId,
  visible,
  disabled,
  panelClassName,
  onProviderCreated,
  onSelectProvider,
}: {
  cardCategoryId: number;
  visible: boolean;
  disabled?: boolean;
  panelClassName?: string;
  onProviderCreated: (
    provider: InlineProviderOption,
    allProduct?: DiscountBenefitProductOption,
  ) => void;
  onSelectProvider: (providerId: string) => void;
}) {
  return (
    <InlineProviderAddPanel
      categoryCode="card"
      benefitCategoryId={cardCategoryId}
      visible={visible}
      disabled={disabled}
      panelClassName={panelClassName}
      onProviderCreated={onProviderCreated}
      onSelectProvider={onSelectProvider}
    />
  );
}
