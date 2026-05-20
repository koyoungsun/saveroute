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
  products: DiscountBenefitProductOption[];
  providerId: number | null;
  cardCategoryId: number;
  providerName?: string;
  selectedIds: number[];
  onChangeSelectedIds: (ids: number[]) => void;
  onProductUpsert: (product: DiscountBenefitProductOption) => void;
  disabled?: boolean;
  emptyHint?: string;
  fieldError?: string;
};

export function CardBenefitProductCombobox({
  products,
  providerId,
  cardCategoryId,
  providerName,
  selectedIds,
  onChangeSelectedIds,
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

  const addToSelection = (
    product: DiscountBenefitProductOption,
    message?: string,
  ) => {
    onProductUpsert(product);
    if (!selectedIds.includes(product.id)) {
      onChangeSelectedIds([...selectedIds, product.id]);
    }
    setSearchQuery("");
    setIsOpen(false);
    closeAddPanel();

    if (message) {
      showTransientFeedback(message, "info");
    } else {
      setFeedback(null);
    }
  };

  const removeFromSelection = (productId: number) => {
    onChangeSelectedIds(selectedIds.filter((id) => id !== productId));
  };

  const selectedProducts = useMemo(
    () =>
      selectedIds
        .map((id) => products.find((product) => product.id === id))
        .filter((product): product is DiscountBenefitProductOption => product != null),
    [products, selectedIds],
  );

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const { allProducts, specificProducts } = useMemo(
    () => partitionCardDiscountProducts(products),
    [products],
  );

  const visibleProducts = useMemo(
    () => filterCardProductsForSearch(products, searchQuery),
    [products, searchQuery],
  );

  const visibleSpecificProducts = useMemo(
    () =>
      visibleProducts.filter(
        (product) => !allProducts.some((allProduct) => allProduct.id === product.id),
      ),
    [allProducts, visibleProducts],
  );

  const normalizedQuery = compactCardSearchKey(searchQuery);
  const canSearchSpecific = normalizedQuery.length >= CARD_PRODUCT_SEARCH_MIN_LENGTH;
  const shouldShowAddPanel = showAddPanel && !disabled;

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

  const applyInlineCreateResult = (result: CreateCardBenefitProductInlineResult) => {
    if (result.ok) {
      addToSelection(result.product, result.message ?? "카드 추가 완료");
      return;
    }

    if (result.duplicateProduct) {
      addToSelection(result.duplicateProduct, result.message);
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
    setAddName(searchQuery.trim());
    setIsOpen(false);
    setFeedback(null);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  };

  const renderProductOption = (product: DiscountBenefitProductOption) => {
    const isSelected = selectedIdSet.has(product.id);
    return (
      <button
        key={product.id}
        type="button"
        className={`list-group-item list-group-item-action py-2 ${
          isSelected ? "active" : ""
        }`}
        onClick={() => {
          if (isSelected) {
            removeFromSelection(product.id);
          } else {
            addToSelection(product);
          }
        }}
      >
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div>{formatBenefitProductOptionLabel(product)}</div>
            {product.code ? (
              <div className="small text-muted font-monospace">{product.code}</div>
            ) : null}
          </div>
          {isSelected ? (
            <span className="badge text-bg-success">선택됨</span>
          ) : (
            <span className="badge text-bg-light border">추가</span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div ref={rootRef} className="sr-discounts-card-select-area">
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="benefit_product_ids" value={id} />
      ))}

      {selectedProducts.length > 0 ? (
        <div className="sr-admin-discounts-chips">
          {selectedProducts.map((product) => (
            <span
              key={product.id}
              className="badge rounded-pill text-bg-light border d-inline-flex align-items-center gap-1 py-2 px-3"
            >
              {formatBenefitProductOptionLabel(product)}
              <button
                type="button"
                className="btn-close btn-close-sm ms-1"
                aria-label={`${product.name} 선택 해제`}
                onClick={() => removeFromSelection(product.id)}
                disabled={disabled}
              />
            </span>
          ))}
        </div>
      ) : (
        <div className="sr-discounts-field__hint form-text mb-2">
          {disabled
            ? "제공사 선택 후 카드 상품을 검색할 수 있습니다."
            : emptyHint ?? "브랜드 직접 할인 / 상품 없음"}
        </div>
      )}

      <div className="position-relative">
        <div className="input-group">
          <input
            type="search"
            className="form-control"
            placeholder={
              disabled
                ? "제공사 선택 후 검색"
                : "카드명·코드 검색 후 선택 목록에 추가"
            }
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
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
            className="btn btn-dark sr-discounts-action-btn"
            onClick={() => {
              onChangeSelectedIds([]);
              setSearchQuery("");
              closeAddPanel();
              setIsOpen(false);
              setFeedback(null);
            }}
            disabled={disabled || selectedIds.length === 0}
          >
            전체 해제
          </button>
        </div>

        {isOpen && !disabled ? (
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
                {allProducts.map((product) => renderProductOption(product))}
              </>
            ) : null}

            {canSearchSpecific ? (
              visibleSpecificProducts.length > 0 ? (
                <>
                  <div className="list-group-item list-group-item-light py-1 small fw-semibold">
                    검색 결과 ({visibleSpecificProducts.length}건)
                  </div>
                  {visibleSpecificProducts.map((product) => renderProductOption(product))}
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
            className="btn btn-outline-primary sr-discounts-action-btn"
            onClick={() => (showAddPanel ? closeAddPanel() : openAddPanel())}
            disabled={pending}
          >
            {showAddPanel ? "신규 카드 추가 닫기" : "신규 카드 추가"}
          </button>
          {providerName ? (
            <span className="small text-muted">카드사: {providerName}</span>
          ) : null}
          {selectedIds.length > 0 ? (
            <span className="small text-muted">{selectedIds.length}개 선택</span>
          ) : null}
        </div>
      ) : null}

      {shouldShowAddPanel ? (
        <div className="sr-discounts-card-add-panel">
          <h4 className="sr-discounts-card-add-panel__title">신규 카드 추가</h4>
          <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label mb-1" htmlFor="card-add-name">
                카드명 <span className="text-danger">*</span>
              </label>
              <input
                id="card-add-name"
                className="form-control"
                value={addName}
                onChange={(event) => setAddName(event.target.value)}
                placeholder="예: 삼성카드 taptap O"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label mb-1" htmlFor="card-add-type">
                카드 유형 <span className="text-danger">*</span>
              </label>
              <select
                id="card-add-type"
                className="form-select"
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
                  id="card-add-active"
                  className="form-check-input"
                  type="checkbox"
                  checked={addIsActive}
                  onChange={(event) => setAddIsActive(event.target.checked)}
                />
                <label className="form-check-label" htmlFor="card-add-active">
                  활성 상태로 등록
                </label>
              </div>
              <div className="sr-discounts-field__hint form-text mb-0">
                저장 후 선택 목록에 자동 추가됩니다. 같은 카드사·카드명·카드 유형이
                이미 있으면 기존 상품을 선택합니다.
              </div>
            </div>
            <div className="col-12 d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary sr-discounts-action-btn"
                onClick={closeAddPanel}
                disabled={pending}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn-primary sr-discounts-action-btn"
                onClick={handleCreateCard}
                disabled={pending}
              >
                {pending ? "저장 중..." : "카드 저장 후 선택 목록 추가"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <div
          className="sr-discounts-field__hint form-text mb-0"
          role="status"
        >
          {feedback}
        </div>
      ) : null}

      {fieldError ? (
        <div className="sr-discounts-field__error mb-0">{fieldError}</div>
      ) : (
        <div className="sr-discounts-field__hint form-text mb-0">
          카드사 전체와 특정 카드를 함께 선택할 수 있습니다. 검색 결과를 눌러 선택
          목록에 추가하세요.
        </div>
      )}
    </div>
  );
}
