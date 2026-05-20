"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";

import {
  CARD_PRODUCT_SEARCH_MIN_LENGTH,
  compactCardSearchKey,
  filterCardProductsForSearch,
  partitionCardDiscountProducts,
} from "@/lib/benefits/card-product-search";
import type { DiscountBenefitProductOption } from "@/lib/benefits/discount-product-options";
import { formatBenefitProductOptionLabel } from "@/lib/benefits/format-product-label";

import {
  createCardBenefitProductInlineAction,
  type CreateCardBenefitProductInlineResult,
} from "./card-product-actions";

type CardBenefitProductComboboxProps = {
  id?: string;
  name?: string;
  products: DiscountBenefitProductOption[];
  providerId: number | null;
  cardCategoryId: number;
  providerName?: string;
  value: string;
  onChange: (productId: string) => void;
  onProductUpsert: (product: DiscountBenefitProductOption) => void;
  disabled?: boolean;
  emptyHint?: string;
  fieldError?: string;
};

export function CardBenefitProductCombobox({
  id = "benefit_product_id",
  name = "benefit_product_id",
  products,
  providerId,
  cardCategoryId,
  providerName,
  value,
  onChange,
  onProductUpsert,
  disabled,
  emptyHint,
  fieldError,
}: CardBenefitProductComboboxProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addName, setAddName] = useState("");
  const [addBenefitType, setAddBenefitType] = useState<"credit" | "debit">("credit");
  const [addIsActive, setAddIsActive] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"info" | "danger">("info");
  const [pending, startTransition] = useTransition();
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAddForm = () => {
    setAddName("");
    setAddBenefitType("credit");
    setAddIsActive(true);
  };

  const closeAddPanel = () => {
    setShowAddPanel(false);
    resetAddForm();
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

  const finalizeCardSelection = (
    product: DiscountBenefitProductOption,
    message?: string,
  ) => {
    onProductUpsert(product);
    onChange(String(product.id));
    setSearchQuery(product.name);
    setIsOpen(false);
    closeAddPanel();

    if (message) {
      showTransientFeedback(message, "info");
    } else {
      setFeedback(null);
    }
  };

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === value) ?? null,
    [products, value],
  );

  const { allProducts, specificProducts } = useMemo(
    () => partitionCardDiscountProducts(products),
    [products],
  );

  const visibleProducts = useMemo(
    () => filterCardProductsForSearch(products, searchQuery),
    [products, searchQuery],
  );

  const visibleSpecificProducts = useMemo(
    () => visibleProducts.filter((product) => !allProducts.some((all) => all.id === product.id)),
    [allProducts, visibleProducts],
  );

  const normalizedQuery = compactCardSearchKey(searchQuery);
  const canSearchSpecific = normalizedQuery.length >= CARD_PRODUCT_SEARCH_MIN_LENGTH;

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    setSearchQuery("");
    closeAddPanel();
    setFeedback(null);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, [providerId]);

  useEffect(() => {
    if (!value || showAddPanel) {
      return;
    }

    const product = products.find((row) => String(row.id) === value);
    if (product) {
      setSearchQuery(product.name);
    }
  }, [value, products, showAddPanel]);

  const handleSelect = (productId: string) => {
    const product = products.find((row) => String(row.id) === productId);
    if (product) {
      finalizeCardSelection(product);
      return;
    }

    onChange(productId);
    setIsOpen(false);
    closeAddPanel();
    setFeedback(null);
  };

  const handleClear = () => {
    onChange("");
    setSearchQuery("");
    closeAddPanel();
    setIsOpen(false);
    setFeedback(null);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  };

  const applyInlineCreateResult = (result: CreateCardBenefitProductInlineResult) => {
    if (result.ok) {
      finalizeCardSelection(
        result.product,
        result.message ?? "카드 추가 완료",
      );
      return;
    }

    if (result.duplicateProduct) {
      finalizeCardSelection(result.duplicateProduct, result.message);
      return;
    }

    showTransientFeedback(result.message, "danger");
  };

  const handleCreateCard = () => {
    if (!providerId) {
      setFeedback("카드사를 먼저 선택해 주세요.");
      setFeedbackTone("danger");
      return;
    }

    const trimmedName = addName.trim();
    if (!trimmedName) {
      setFeedback("카드명을 입력해 주세요.");
      setFeedbackTone("danger");
      return;
    }

    startTransition(async () => {
      const result = await createCardBenefitProductInlineAction({
        benefitCategoryId: cardCategoryId,
        providerId,
        name: trimmedName,
        benefitType: addBenefitType,
        isActive: addIsActive,
      });
      applyInlineCreateResult(result);
    });
  };

  const openAddPanel = () => {
    setShowAddPanel(true);
    setAddName(searchQuery.trim() || selectedProduct?.name || "");
    setIsOpen(false);
    setFeedback(null);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  };

  const shouldShowAddPanel = showAddPanel && !disabled;

  return (
    <div ref={rootRef}>
      <input type="hidden" id={id} name={name} value={value} readOnly />

      <div className="position-relative">
        <div className="input-group">
          <input
            type="search"
            className="form-control"
            placeholder={
              disabled
                ? "제공사 선택 후 검색"
                : "카드명·코드 검색 (1글자 이상)"
            }
            value={searchQuery}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setSearchQuery(nextQuery);
              if (selectedProduct && nextQuery !== selectedProduct.name) {
                onChange("");
              }
              setIsOpen(true);
              setFeedback(null);
              if (feedbackTimerRef.current) {
                clearTimeout(feedbackTimerRef.current);
                feedbackTimerRef.current = null;
              }
            }}
            onFocus={() => {
              if (!disabled) {
                setIsOpen(true);
              }
            }}
            disabled={disabled}
            autoComplete="off"
            aria-controls={listboxId}
            aria-expanded={isOpen}
            aria-autocomplete="list"
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleClear}
            disabled={disabled || !value}
          >
            선택 해제
          </button>
        </div>

        {selectedProduct ? (
          <div className="form-text text-success">
            선택됨: {formatBenefitProductOptionLabel(selectedProduct)}
          </div>
        ) : (
          <div className="form-text">
            {disabled
              ? "제공사 선택 후 카드 상품을 검색할 수 있습니다."
              : emptyHint ?? "브랜드 직접 할인 / 상품 없음"}
          </div>
        )}

        {isOpen && !disabled && (!selectedProduct || searchQuery !== selectedProduct.name) ? (
          <div
            id={listboxId}
            className="list-group position-absolute top-100 start-0 end-0 mt-1 shadow-sm"
            style={{ zIndex: 20, maxHeight: "18rem", overflowY: "auto" }}
            role="listbox"
          >
            {allProducts.length > 0 ? (
              <>
                <div className="list-group-item list-group-item-light py-1 small fw-semibold">
                  카드사 전체
                </div>
                {allProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className={`list-group-item list-group-item-action py-2 ${
                      String(product.id) === value ? "active" : ""
                    }`}
                    onClick={() => handleSelect(String(product.id))}
                  >
                    {formatBenefitProductOptionLabel(product)}
                  </button>
                ))}
              </>
            ) : null}

            {canSearchSpecific ? (
              visibleSpecificProducts.length > 0 ? (
                <>
                  <div className="list-group-item list-group-item-light py-1 small fw-semibold">
                    검색 결과 ({visibleSpecificProducts.length}건)
                  </div>
                  {visibleSpecificProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className={`list-group-item list-group-item-action py-2 ${
                        String(product.id) === value ? "active" : ""
                      }`}
                      onClick={() => handleSelect(String(product.id))}
                    >
                      <div>{formatBenefitProductOptionLabel(product)}</div>
                      {product.code ? (
                        <div className="small text-muted font-monospace">
                          {product.code}
                        </div>
                      ) : null}
                    </button>
                  ))}
                </>
              ) : (
                <div className="list-group-item py-2 small text-muted">
                  &quot;{searchQuery}&quot;에 맞는 카드가 없습니다.
                </div>
              )
            ) : (
              <div className="list-group-item py-2 small text-muted">
                특정 카드는 1글자 이상 검색하면 표시됩니다. (전체{" "}
                {specificProducts.length.toLocaleString("ko-KR")}건)
              </div>
            )}
          </div>
        ) : null}
      </div>

      {!disabled ? (
        <div className="mt-2 d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => (showAddPanel ? closeAddPanel() : openAddPanel())}
            disabled={pending}
          >
            {showAddPanel ? "신규 카드 추가 닫기" : "신규 카드 추가"}
          </button>
          {providerName ? (
            <span className="small text-muted">카드사: {providerName}</span>
          ) : null}
        </div>
      ) : null}

      {shouldShowAddPanel ? (
        <div className="border rounded p-3 mt-2 bg-light">
          <p className="small fw-semibold mb-2">신규 카드 상품 추가</p>
          <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label small mb-1" htmlFor={`${id}-add-name`}>
                카드명 <span className="text-danger">*</span>
              </label>
              <input
                id={`${id}-add-name`}
                className="form-control form-control-sm"
                value={addName}
                onChange={(event) => setAddName(event.target.value)}
                placeholder="예: 삼성카드 taptap O"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small mb-1" htmlFor={`${id}-add-type`}>
                카드 유형 <span className="text-danger">*</span>
              </label>
              <select
                id={`${id}-add-type`}
                className="form-select form-select-sm"
                value={addBenefitType}
                onChange={(event) =>
                  setAddBenefitType(event.target.value as "credit" | "debit")
                }
              >
                <option value="credit">신용카드</option>
                <option value="debit">체크카드</option>
              </select>
            </div>
            <div className="col-12">
              <div className="form-check">
                <input
                  id={`${id}-add-active`}
                  className="form-check-input"
                  type="checkbox"
                  checked={addIsActive}
                  onChange={(event) => setAddIsActive(event.target.checked)}
                />
                <label className="form-check-label small" htmlFor={`${id}-add-active`}>
                  활성 상태로 등록
                </label>
              </div>
              <div className="form-text small">
                코드는 저장 시 자동 생성됩니다. 같은 카드사·카드명·카드 유형이 이미 있으면
                새로 만들지 않고 기존 상품을 선택합니다.
              </div>
            </div>
            <div className="col-12 d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={closeAddPanel}
                disabled={pending}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleCreateCard}
                disabled={pending}
              >
                {pending ? "저장 중..." : "카드 저장 후 선택"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <div
          className={`form-text ${feedbackTone === "danger" ? "text-danger" : "text-primary"}`}
          role="status"
        >
          {feedback}
        </div>
      ) : null}

      {fieldError ? <div className="form-text text-danger">{fieldError}</div> : null}
    </div>
  );
}
