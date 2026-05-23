"use client";

import { Check, CreditCard, Plus, Smartphone, Star, TicketPercent, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { UserBottomDock } from "@/components/layout/UserBottomDock";
import {
  BenefitAccordionCard,
  BenefitFormStep,
  RegisteredBenefitsBlock,
} from "@/components/benefits/BenefitAccordionCard";
import {
  addCardBenefitAction,
  deactivateUserBenefitAction,
  registerMembershipBenefitAction,
  registerTelecomBenefitAction,
  requestBenefitProductAction,
  type BenefitActionState,
  type BenefitProductRequestKind,
} from "@/app/(user)/my-benefits/actions";
import {
  type CardBenefitKind,
  allowedCardBenefitKinds,
} from "@/lib/benefits/card-benefit-kinds";
import {
  dedupeTelecomMembershipOptions,
  sortTelecomMembershipOptions,
  type BenefitsRegistrationPayload,
  TELECOM_FIRST_CHOICES,
  type TelecomFirstChoiceId,
} from "@/lib/benefits/load-registration-data";
import { formatUserBenefitTypeLabel } from "@/lib/benefits/format-product-label";
import { formatExternalMembershipOptionLabel } from "@/lib/benefits/format-external-membership-label";
import {
  filterFeaturedMvnoBrandOptions,
  getFeaturedMvnoDisplayName,
} from "@/lib/benefits/mvno-display-policy";

const CARD_KIND_LABEL: Record<CardBenefitKind, string> = {
  credit: "신용카드",
  debit: "체크카드",
  prepaid: "선불카드",
  all: "카드사 전체",
};

const REQUEST_KIND_UI: readonly {
  id: BenefitProductRequestKind;
  label: string;
}[] = [
  { id: "credit", label: "신용카드" },
  { id: "debit", label: "체크카드" },
];

function compactSearchKey(raw: string) {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}
type BenefitsPickerProps = {
  mode?: "my-benefits" | "onboarding";
  payload: BenefitsRegistrationPayload;
};

function relationOne<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

const PROVIDER_BY_FIRST: Record<Exclude<TelecomFirstChoiceId, "mvno">, string> = {
  skt: "skt",
  kt: "kt",
  lguplus: "lguplus",
};

export function BenefitsPicker({ mode = "my-benefits", payload }: BenefitsPickerProps) {
  const router = useRouter();
  const [telecomFirst, setTelecomFirst] = useState<TelecomFirstChoiceId | null>(null);
  const [telecomMembershipProductId, setTelecomMembershipProductId] = useState("");
  const [mvnoProviderId, setMvnoProviderId] = useState("");
  const [telecomOk, setTelecomOk] = useState<string | null>(null);
  const [telecomErr, setTelecomErr] = useState<string | null>(null);
  const [pendingTelecom, startTelecomTransition] = useTransition();
  const [externalMembershipProductId, setExternalMembershipProductId] = useState("");
  const [membershipOk, setMembershipOk] = useState<string | null>(null);
  const [membershipErr, setMembershipErr] = useState<string | null>(null);
  const [pendingMembership, startMembershipTransition] = useTransition();
  const [selectedCardProviderId, setSelectedCardProviderId] = useState("");
  const [selectedCardProductId, setSelectedCardProductId] = useState("");
  const [selectedCardType, setSelectedCardType] = useState<CardBenefitKind | "">("");
  const [cardSearchQuery, setCardSearchQuery] = useState("");
  const [cardMsg, setCardMsg] = useState<string | null>(null);
  const [pendingCard, startCardTransition] = useTransition();
  const [manualCatalogCardName, setManualCatalogCardName] = useState("");
  const [manualCatalogKind, setManualCatalogKind] =
    useState<BenefitProductRequestKind>("credit");
  const [manualCatalogMsg, setManualCatalogMsg] = useState<string | null>(null);
  const manualCatalogNameEditedRef = useRef(false);
  const [pendingCatalogRequest, startCatalogRequestTransition] = useTransition();
  const [showMvnoRequestForm, setShowMvnoRequestForm] = useState(false);
  const [mvnoRequestBrand, setMvnoRequestBrand] = useState("");
  const [mvnoRequestFeedback, setMvnoRequestFeedback] = useState<string | null>(null);
  const [mvnoRequestError, setMvnoRequestError] = useState<string | null>(null);
  const [mvnoRequestSubmitting, setMvnoRequestSubmitting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  function toggleBenefitSection(sectionId: string) {
    setExpandedSection((current) => (current === sectionId ? null : sectionId));
  }

  const featuredMvnoOptions = useMemo(
    () => filterFeaturedMvnoBrandOptions(payload.mvnoBrandOptions),
    [payload.mvnoBrandOptions],
  );

  const membershipOptionsForCarrier = useMemo(() => {
    if (!telecomFirst || telecomFirst === "mvno") {
      return [];
    }
    const pc = PROVIDER_BY_FIRST[telecomFirst];
    const filtered = payload.telecomMembershipProducts.filter((p) => p.providerCode === pc);
    const deduped = dedupeTelecomMembershipOptions(filtered);

    return sortTelecomMembershipOptions(deduped);
  }, [telecomFirst, payload.telecomMembershipProducts]);

  const resolvedTelecomProductId = useMemo(() => {
    if (telecomFirst === "mvno") {
      const id = Number(mvnoProviderId);
      if (!Number.isInteger(id) || id <= 0) {
        return null;
      }
      const opt = featuredMvnoOptions.find((o) => o.providerId === id);
      return opt?.defaultProductId ?? null;
    }
    if (!telecomFirst) {
      return null;
    }
    const pid = Number(telecomMembershipProductId);
    if (!Number.isInteger(pid) || pid <= 0) {
      return null;
    }
    return pid;
  }, [telecomFirst, telecomMembershipProductId, mvnoProviderId, featuredMvnoOptions]);

  const canRegisterTelecom =
    resolvedTelecomProductId !== null &&
    !pendingTelecom &&
    telecomFirst !== null &&
    (telecomFirst === "mvno" ? mvnoProviderId !== "" : telecomMembershipProductId !== "");

  const registeredExternalMembershipIds = useMemo(
    () => new Set(payload.externalMembershipProducts.map((product) => product.id)),
    [payload.externalMembershipProducts],
  );

  const externalMembershipBenefits = useMemo(() => {
    if (payload.membershipCategoryId === null) {
      return [];
    }

    return payload.userBenefits.filter(
      (benefit) =>
        benefit.benefit_category_id === payload.membershipCategoryId &&
        benefit.benefit_product_id != null &&
        registeredExternalMembershipIds.has(benefit.benefit_product_id),
    );
  }, [
    payload.userBenefits,
    payload.membershipCategoryId,
    registeredExternalMembershipIds,
  ]);

  const canRegisterExternalMembership =
    externalMembershipProductId !== "" &&
    !pendingMembership &&
    payload.externalMembershipProducts.length > 0;

  const telecomAndMvnoBenefits = useMemo(() => {
    const membershipIds = new Set(payload.telecomMembershipProducts.map((p) => p.id));
    const mvnoDefaultIds = new Set(payload.mvnoBrandOptions.map((o) => o.defaultProductId));
    return payload.userBenefits.filter((b) => {
      if (b.benefit_category_id === payload.cardCategoryId) {
        return false;
      }
      if (
        payload.membershipCategoryId !== null &&
        b.benefit_category_id === payload.membershipCategoryId
      ) {
        return false;
      }
      if (payload.mvnoCategoryId !== null) {
        return (
          b.benefit_category_id === payload.telecomCategoryId ||
          b.benefit_category_id === payload.mvnoCategoryId
        );
      }
      if (b.benefit_category_id !== payload.telecomCategoryId) {
        return false;
      }
      const bid = b.benefit_product_id;
      if (bid == null) {
        return false;
      }
      return membershipIds.has(bid) || mvnoDefaultIds.has(bid);
    });
  }, [
    payload.userBenefits,
    payload.telecomCategoryId,
    payload.mvnoCategoryId,
    payload.cardCategoryId,
    payload.membershipCategoryId,
    payload.telecomMembershipProducts,
    payload.mvnoBrandOptions,
  ]);

  function selectTelecomFirst(next: TelecomFirstChoiceId) {
    setTelecomFirst(next);
    setTelecomMembershipProductId("");
    setMvnoProviderId("");
    setTelecomErr(null);
    setTelecomOk(null);
    setShowMvnoRequestForm(false);
    setMvnoRequestBrand("");
    setMvnoRequestFeedback(null);
    setMvnoRequestError(null);
  }

  function handleRegisterTelecom() {
    const pid = resolvedTelecomProductId;
    if (!pid || !canRegisterTelecom) {
      setTelecomErr("통신사 또는 알뜰폰을 선택해 주세요.");
      return;
    }

    setTelecomErr(null);
    setTelecomOk(null);
    startTelecomTransition(() => {
      void registerTelecomBenefitAction(pid).then((r: BenefitActionState) => {
        if (r.error) {
          setTelecomErr(r.error);
          setTelecomOk(null);
        } else {
          setTelecomErr(null);
          setTelecomOk(r.message ?? "통신 혜택을 등록했습니다.");
          setTelecomMembershipProductId("");
          setMvnoProviderId("");
          setTelecomFirst(null);
        }
        router.refresh();
      });
    });
  }

  async function handleSubmitMvnoBrandRequest() {
    const brandName = mvnoRequestBrand.trim();
    if (!brandName || mvnoRequestSubmitting) {
      return;
    }

    setMvnoRequestSubmitting(true);
    setMvnoRequestFeedback(null);
    setMvnoRequestError(null);

    try {
      const res = await fetch("/api/brand-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          keyword: brandName,
          requestType: "mvno_request",
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        status?: string;
        error?: string;
      };

      if (!res.ok) {
        setMvnoRequestError(data.error ?? "요청 중 오류가 발생했습니다.");
        return;
      }

      if (data.status === "max_reached") {
        setMvnoRequestFeedback("이미 많은 요청이 접수된 브랜드입니다.");
        return;
      }

      setMvnoRequestBrand("");
      setShowMvnoRequestForm(false);
      setMvnoRequestFeedback("요청이 접수되었습니다. 검토 후 추가될 수 있습니다.");
    } catch {
      setMvnoRequestError("요청 중 오류가 발생했습니다.");
    } finally {
      setMvnoRequestSubmitting(false);
    }
  }

  function handleRegisterExternalMembership() {
    const productId = Number(externalMembershipProductId);
    if (!Number.isInteger(productId) || productId <= 0 || !canRegisterExternalMembership) {
      setMembershipErr("멤버십 또는 포인트를 선택해 주세요.");
      return;
    }

    setMembershipErr(null);
    setMembershipOk(null);
    startMembershipTransition(() => {
      void registerMembershipBenefitAction(productId).then((r: BenefitActionState) => {
        if (r.error) {
          setMembershipErr(r.error);
          setMembershipOk(null);
        } else {
          setMembershipErr(null);
          setMembershipOk(r.message ?? "멤버십/포인트를 등록했습니다.");
          setExternalMembershipProductId("");
        }
        router.refresh();
      });
    });
  }

  const cardBenefits = useMemo(
    () =>
      payload.userBenefits.filter((b) => b.benefit_category_id === payload.cardCategoryId),
    [payload.userBenefits, payload.cardCategoryId],
  );

  const registeredCardProductIds = useMemo(
    () =>
      new Set(
        cardBenefits.map((b) => b.benefit_product_id).filter((id): id is number => typeof id === "number"),
      ),
    [cardBenefits],
  );

  const cardProductsForProvider = useMemo(() => {
    const providerId = Number(selectedCardProviderId);
    if (!Number.isInteger(providerId) || providerId <= 0) {
      return [];
    }

    return payload.cardProducts.filter((p) => {
      if (registeredCardProductIds.has(p.id)) return false;
      return p.provider_id === providerId;
    }).sort((a, b) => {
      if (a.isAllProduct !== b.isAllProduct) {
        return a.isAllProduct ? -1 : 1;
      }
      return a.name.localeCompare(b.name, "ko");
    });
  }, [payload.cardProducts, registeredCardProductIds, selectedCardProviderId]);

  const filteredCardProducts = useMemo(() => {
    const q = compactSearchKey(cardSearchQuery);
    if (!q) {
      return cardProductsForProvider;
    }
    return cardProductsForProvider.filter((p) => compactSearchKey(p.name).includes(q));
  }, [cardProductsForProvider, cardSearchQuery]);

  const selectedCardProduct = useMemo(() => {
    const id = Number(selectedCardProductId);
    if (!Number.isInteger(id) || id <= 0) {
      return null;
    }
    return cardProductsForProvider.find((product) => product.id === id) ?? null;
  }, [cardProductsForProvider, selectedCardProductId]);

  useEffect(() => {
    if (!selectedCardProductId) {
      setSelectedCardType("");
      return;
    }
    const id = Number(selectedCardProductId);
    if (!filteredCardProducts.some((p) => p.id === id)) {
      setSelectedCardProductId("");
      setSelectedCardType("");
    }
  }, [filteredCardProducts, selectedCardProductId]);

  useEffect(() => {
    if (!selectedCardProduct) {
      setSelectedCardType("");
      return;
    }
    const kinds = allowedCardBenefitKinds({
      benefit_type: selectedCardProduct.benefitType,
      card_type: selectedCardProduct.cardType,
      is_all_product: selectedCardProduct.isAllProduct,
    });
    if (kinds.length === 1) {
      setSelectedCardType(kinds[0]);
      return;
    }
    setSelectedCardType((prev) => (prev && kinds.includes(prev) ? prev : ""));
  }, [selectedCardProduct]);

  const selectedCardProvider = useMemo(
    () => payload.cardProviders.find((p) => String(p.id) === selectedCardProviderId) ?? null,
    [payload.cardProviders, selectedCardProviderId],
  );

  const showManualCatalogRequest =
    Boolean(selectedCardProviderId) &&
    (cardProductsForProvider.length === 0 || filteredCardProducts.length === 0);

  useEffect(() => {
    if (!selectedCardProviderId) {
      manualCatalogNameEditedRef.current = false;
      setManualCatalogCardName("");
      setManualCatalogKind("credit");
      setManualCatalogMsg(null);
    }
  }, [selectedCardProviderId]);

  useEffect(() => {
    if (!showManualCatalogRequest) {
      return;
    }
    if (!manualCatalogNameEditedRef.current) {
      setManualCatalogCardName(cardSearchQuery.trim());
    }
  }, [cardSearchQuery, showManualCatalogRequest]);

  useEffect(() => {
    if (!showManualCatalogRequest) {
      manualCatalogNameEditedRef.current = false;
    }
  }, [showManualCatalogRequest]);

  useEffect(() => {
    if (telecomFirst !== "mvno" || !mvnoProviderId) {
      return;
    }

    const id = Number(mvnoProviderId);
    if (!featuredMvnoOptions.some((option) => option.providerId === id)) {
      setMvnoProviderId("");
    }
  }, [telecomFirst, mvnoProviderId, featuredMvnoOptions]);

  const registeredCount = payload.userBenefits.length;
  const showBenefitsEmptyCta = mode === "my-benefits" && registeredCount === 0;
  const selectableKinds = selectedCardProduct
    ? [...allowedCardBenefitKinds({
        benefit_type: selectedCardProduct.benefitType,
        card_type: selectedCardProduct.cardType,
        is_all_product: selectedCardProduct.isAllProduct,
      })]
    : [];

  const canAddCard =
    selectedCardProviderId !== "" &&
    selectedCardProductId !== "" &&
    selectedCardType !== "" &&
    selectableKinds.includes(selectedCardType) &&
    !pendingCard;

  function handleAddCard() {
    const productId = Number(selectedCardProductId);
    if (!Number.isInteger(productId) || productId <= 0 || !selectedCardType) {
      setCardMsg("카드사, 카드, 카드 유형을 모두 선택해 주세요.");
      return;
    }

    setCardMsg(null);
    startCardTransition(() => {
      void addCardBenefitAction(productId, selectedCardType as CardBenefitKind).then((r) => {
        if (r.error) {
          setCardMsg(r.error);
        } else {
          setSelectedCardProviderId("");
          setSelectedCardProductId("");
          setSelectedCardType("");
          setCardMsg(r.message ?? "보유카드에 추가되었습니다.");
        }
        router.refresh();
      });
    });
  }

  function handleSubmitCatalogRequest() {
    const pid = Number(selectedCardProviderId);
    const nameTrim = manualCatalogCardName.trim();
    if (!Number.isInteger(pid) || pid <= 0 || nameTrim.length === 0) {
      setManualCatalogMsg("카드명을 입력해 주세요.");
      return;
    }
    setManualCatalogMsg(null);
    startCatalogRequestTransition(() => {
      void requestBenefitProductAction(pid, nameTrim, manualCatalogKind).then(
        (r: BenefitActionState) => {
          if (r.error) {
            setManualCatalogMsg(r.error);
            return;
          }
          manualCatalogNameEditedRef.current = false;
          setManualCatalogMsg(r.message ?? "요청이 접수되었습니다.");
          setManualCatalogKind("credit");
          setManualCatalogCardName("");
          setCardSearchQuery("");
          router.refresh();
        },
      );
    });
  }

  const canSubmitManualCatalog =
    showManualCatalogRequest &&
    manualCatalogCardName.trim().length > 0 &&
    !pendingCatalogRequest;

  return (
    <div
      className="sr-user-benefits-hub sr-user-stack sr-user-stack--tight"
      id="benefits-hub"
    >
      {telecomErr ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {telecomErr}
        </p>
      ) : null}
      {telecomOk ? (
        <p className="sr-user-callout sr-user-callout--success">
          {telecomOk}
        </p>
      ) : null}
      {membershipErr ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {membershipErr}
        </p>
      ) : null}
      {membershipOk ? (
        <p className="sr-user-callout sr-user-callout--success">
          {membershipOk}
        </p>
      ) : null}

      {showBenefitsEmptyCta ? (
        <div className="sr-user-callout sr-user-callout--empty px-4 py-6 text-center">
          <p className="text-sm font-semibold text-gray-900">아직 등록된 혜택이 없어요.</p>
          <div className="mt-5 flex flex-col gap-2.5">
            <a
              href="#benefits-hub"
              className="sr-user-btn-primary inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-bold text-white"
            >
              내 혜택 등록하기
            </a>
            <Link
              href="/"
              className="sr-user-btn-secondary inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-bold"
            >
              검색하러 가기
            </Link>
          </div>
        </div>
      ) : null}

      <BenefitAccordionCard
        icon={Smartphone}
        title="통신사 혜택"
        description="통신사 할인 및 제휴 혜택"
        count={telecomAndMvnoBenefits.length}
        expanded={expandedSection === "telecom"}
        onToggle={() => toggleBenefitSection("telecom")}
      >
        <BenefitFormStep step={1} label="보유 통신사 선택">
          <div className="grid grid-cols-2 gap-2">
            {TELECOM_FIRST_CHOICES.map((choice) => {
              const active = telecomFirst === choice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => selectTelecomFirst(choice.id)}
                  className={`sr-user-choice ${active ? "sr-user-choice--active" : ""}`}
                >
                  {active ? (
                    <Check className="sr-user-accent-text absolute right-2 top-2 size-5" aria-hidden />
                  ) : null}
                  <span className="text-sm font-bold text-gray-900">{choice.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs leading-relaxed text-gray-500">
            알뜰폰은 브랜드 단위로 먼저 등록할 수 있어요.
          </p>
        </BenefitFormStep>

        {telecomFirst && telecomFirst !== "mvno" ? (
          <BenefitFormStep step={2} label="멤버십 등급 선택">
            <p className="text-xs leading-relaxed text-gray-600">
              통신사 멤버십 등급은 실제 할인 매칭에 사용됩니다.
            </p>
            <select
              id="telecom-membership-grade"
              value={telecomMembershipProductId}
              onChange={(event) => {
                setTelecomMembershipProductId(event.target.value);
                setTelecomErr(null);
                setTelecomOk(null);
              }}
              className="sr-user-input px-3 py-3 text-sm font-semibold"
            >
              <option value="">등급을 선택해 주세요</option>
              {membershipOptionsForCarrier.map((opt) => (
                <option key={opt.id} value={String(opt.id)}>
                  {opt.isAllProduct || opt.benefit_type === "all"
                    ? `전체 — ${opt.name} (등급 무관)`
                    : opt.grade
                      ? `${opt.grade} — ${opt.name}`
                      : opt.name}
                </option>
              ))}
            </select>
            {membershipOptionsForCarrier.length === 0 ? (
              <p className="text-xs text-amber-700">이 통신사의 멤버십 상품 데이터를 불러오지 못했습니다.</p>
            ) : null}
          </BenefitFormStep>
        ) : null}

        {telecomFirst === "mvno" ? (
          <BenefitFormStep step={2} label="알뜰폰 브랜드 선택">
            <select
              id="telecom-mvno-brand"
              value={mvnoProviderId}
              onChange={(event) => {
                setMvnoProviderId(event.target.value);
                setTelecomErr(null);
                setTelecomOk(null);
              }}
              className="sr-user-input px-3 py-3 text-sm font-semibold"
            >
              <option value="">브랜드를 선택해 주세요</option>
              {featuredMvnoOptions.map((opt) => (
                <option key={opt.providerId} value={String(opt.providerId)}>
                  {getFeaturedMvnoDisplayName(opt)}
                </option>
              ))}
            </select>
            {featuredMvnoOptions.length === 0 ? (
              <p className="text-xs text-gray-500">등록 가능한 알뜰폰 브랜드가 없습니다.</p>
            ) : null}

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-600">찾는 알뜰폰 브랜드가 없나요?</p>
              {showMvnoRequestForm ? (
                <div className="mt-3 space-y-2">
                  <label htmlFor="mvno-brand-request" className="text-xs font-bold text-gray-700">
                    알뜰폰 브랜드명
                  </label>
                  <input
                    id="mvno-brand-request"
                    type="text"
                    value={mvnoRequestBrand}
                    onChange={(event) => {
                      setMvnoRequestBrand(event.target.value);
                      setMvnoRequestFeedback(null);
                      setMvnoRequestError(null);
                    }}
                    maxLength={80}
                    placeholder="예: 토스모바일"
                    className="sr-user-input px-3 py-3 text-sm"
                  />
                  <div className="flex flex-col gap-2 min-[431px]:flex-row">
                    <button
                      type="button"
                      disabled={mvnoRequestSubmitting || !mvnoRequestBrand.trim()}
                      onClick={() => void handleSubmitMvnoBrandRequest()}
                      className="sr-user-btn-primary flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold"
                    >
                      {mvnoRequestSubmitting ? "요청 중..." : "요청 보내기"}
                    </button>
                    <button
                      type="button"
                      disabled={mvnoRequestSubmitting}
                      onClick={() => {
                        setShowMvnoRequestForm(false);
                        setMvnoRequestBrand("");
                        setMvnoRequestError(null);
                      }}
                      className="sr-user-btn-secondary flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowMvnoRequestForm(true);
                    setMvnoRequestFeedback(null);
                    setMvnoRequestError(null);
                  }}
                  className="sr-user-btn-secondary mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold"
                >
                  알뜰폰 브랜드 추가 요청
                </button>
              )}
              {mvnoRequestFeedback ? (
                <p className="mt-2 text-xs font-medium text-green-700" role="status" aria-live="polite">
                  {mvnoRequestFeedback}
                </p>
              ) : null}
              {mvnoRequestError ? (
                <p className="mt-2 text-xs font-medium text-red-600" role="alert">
                  {mvnoRequestError}
                </p>
              ) : null}
            </div>
          </BenefitFormStep>
        ) : null}

        <div className="sr-user-benefit-form-action">
          <button
            type="button"
            disabled={!canRegisterTelecom}
            onClick={handleRegisterTelecom}
            className="sr-user-benefit-register-btn flex h-12 w-full items-center justify-center gap-2 text-sm font-extrabold"
          >
            <Plus className="size-4" aria-hidden />
            {pendingTelecom ? "등록 중..." : "통신 혜택 등록"}
          </button>
        </div>

        {telecomAndMvnoBenefits.length > 0 ? (
          <RegisteredBenefitsBlock>
            {telecomAndMvnoBenefits.map((b) => {
              const productName = relationOne(b.benefit_product)?.name ?? "회선";
              const providerName = relationOne(b.provider)?.name ?? "";
              return (
                <div key={b.id} className="sr-user-chip">
                  <span className="min-w-0 truncate">
                    {providerName ? `${providerName} · ` : ""}
                    {productName}
                  </span>
                  <form action={deactivateUserBenefitAction}>
                    <input type="hidden" name="user_benefit_id" value={b.id} />
                    <button
                      type="submit"
                      aria-label={`${productName} 삭제`}
                      className="flex size-7 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </form>
                </div>
              );
            })}
          </RegisteredBenefitsBlock>
        ) : null}
      </BenefitAccordionCard>

      <BenefitAccordionCard
        icon={CreditCard}
        title="카드 혜택"
        description="보유 카드 할인 및 제휴 혜택"
        count={cardBenefits.length}
        expanded={expandedSection === "card"}
        onToggle={() => toggleBenefitSection("card")}
      >
        <p className="sr-user-callout text-xs leading-relaxed">
          아직 혜택 정보가 없는 카드도 보유카드로 등록할 수 있어요.
          세이브루트가 확인한 할인 혜택과 자동으로 연결됩니다.
        </p>

        <BenefitFormStep step={1} label="카드사 선택">
          <select
            id="card-provider"
            value={selectedCardProviderId}
            onChange={(event) => {
              setSelectedCardProviderId(event.target.value);
              setSelectedCardProductId("");
              setCardSearchQuery("");
              setCardMsg(null);
            }}
            className="sr-user-input px-3 py-3 text-sm font-semibold"
          >
            <option value="">카드사를 선택해 주세요</option>
            {payload.cardProviders.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
          {!selectedCardProviderId ? (
            <p className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2.5 text-sm font-medium text-amber-900">
              카드사를 먼저 선택하세요.
            </p>
          ) : null}
        </BenefitFormStep>

        {selectedCardProviderId ? (
          <>
            <BenefitFormStep step={2} label="카드명 검색">
              <input
                id="card-search"
                type="search"
                value={cardSearchQuery}
                onChange={(event) => setCardSearchQuery(event.target.value)}
                placeholder="예: 트래블, The Pink, 전체"
                autoComplete="off"
                className="sr-user-input px-3 py-3 text-sm font-semibold placeholder:font-normal"
              />
            </BenefitFormStep>

            <BenefitFormStep step={3} label="카드 선택">
              <select
                id="card-product"
                value={selectedCardProductId}
                onChange={(event) => {
                  setSelectedCardProductId(event.target.value);
                  setCardMsg(null);
                }}
                className="sr-user-input px-3 py-3 text-sm font-semibold"
              >
                <option value="">목록에서 카드를 선택해 주세요</option>
                {filteredCardProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>

              {showManualCatalogRequest ? (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                  <p className="sr-user-accent-text text-xs font-bold">직접 카드명 입력하기</p>
                  <p className="mt-1 text-xs font-medium text-gray-700">
                    {cardProductsForProvider.length === 0
                      ? "등록 가능한 카드가 없습니다. 카드명을 직접 입력해 요청할 수 있어요."
                      : "검색 결과가 없습니다. 보유 중인 카드명을 직접 입력해 요청할 수 있어요."}
                  </p>
                  <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                    <div>
                      <p className="text-xs font-bold text-gray-700">카드사</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {selectedCardProvider?.name ?? "—"}
                      </p>
                    </div>
                    <div>
                      <label htmlFor="manual-catalog-card-name" className="text-xs font-bold text-gray-700">
                        카드명 (검색어가 기본으로 채워집니다)
                      </label>
                      <input
                        id="manual-catalog-card-name"
                        type="text"
                        value={manualCatalogCardName}
                        onChange={(e) => {
                          manualCatalogNameEditedRef.current = true;
                          setManualCatalogCardName(e.target.value);
                          setManualCatalogMsg(null);
                        }}
                        maxLength={200}
                        autoComplete="off"
                        className="sr-user-input mt-1 px-3 py-2.5 text-sm font-semibold"
                        placeholder="예: 나만의 체크카드"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700">카드 유형</p>
                      <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1">
                        {REQUEST_KIND_UI.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setManualCatalogKind(item.id);
                              setManualCatalogMsg(null);
                            }}
                            className={`h-9 rounded-xl text-xs font-extrabold transition min-[431px]:text-sm ${
                              manualCatalogKind === item.id
                                ? "bg-white sr-user-accent-text shadow-sm"
                                : "text-gray-500"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      요청 후 내 혜택에 «검토중»으로 등록됩니다. 승인 전까지 할인 매칭이
                      제한될 수 있어요.
                    </p>
                    <button
                      type="button"
                      disabled={!canSubmitManualCatalog}
                      onClick={handleSubmitCatalogRequest}
                      className="sr-user-btn-primary flex h-11 w-full items-center justify-center rounded-xl text-sm font-extrabold"
                    >
                      {pendingCatalogRequest ? "등록 중..." : "카드 요청 등록"}
                    </button>
                    {manualCatalogMsg ? (
                      <p className="text-xs font-medium text-gray-600">{manualCatalogMsg}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </BenefitFormStep>

            {selectedCardProduct && selectableKinds.length > 0 && selectableKinds[0] !== "all" ? (
              <BenefitFormStep step={4} label="카드 유형">
                <div
                  className={`grid gap-1 rounded-2xl bg-gray-100 p-1 ${
                    selectableKinds.length <= 2 ? "grid-cols-2" : "grid-cols-3"
                  }`}
                >
                  {selectableKinds.map((kind) => {
                    const active = selectedCardType === kind;
                    return (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => {
                          setSelectedCardType(kind);
                          setCardMsg(null);
                        }}
                        className={`h-10 rounded-xl text-sm font-extrabold transition ${
                          active ? "bg-white sr-user-accent-text shadow-sm" : "text-gray-500"
                        }`}
                      >
                        {CARD_KIND_LABEL[kind]}
                      </button>
                    );
                  })}
                </div>
                {selectableKinds.length === 1 ? (
                  <p className="text-xs text-gray-500">
                    이 카드는 마스터 데이터 기준 {CARD_KIND_LABEL[selectableKinds[0]]}예요.
                  </p>
                ) : selectableKinds.length > 1 ? (
                  <p className="text-xs text-gray-500">보유하신 결제 방식을 선택해 주세요.</p>
                ) : null}
              </BenefitFormStep>
            ) : selectedCardProduct?.isAllProduct ? (
              <p className="text-xs text-gray-500">이 상품은 해당 카드사 전체 할인에 매칭됩니다.</p>
            ) : selectedCardProviderId &&
              cardProductsForProvider.length > 0 &&
              filteredCardProducts.length > 0 ? (
              <p className="text-xs text-gray-400">카드를 선택하면 카드 유형을 고를 수 있어요.</p>
            ) : null}

            <div className="sr-user-benefit-form-action">
              <button
                type="button"
                disabled={!canAddCard}
                onClick={handleAddCard}
                className="sr-user-benefit-register-btn flex h-12 w-full items-center justify-center gap-2 text-sm font-extrabold"
              >
                <Plus className="size-4" aria-hidden />
                {pendingCard ? "등록 중..." : "보유카드에 추가"}
              </button>
            </div>
          </>
        ) : null}

        {cardMsg ? <p className="text-xs font-medium text-gray-600">{cardMsg}</p> : null}

        {cardBenefits.length > 0 ? (
          <RegisteredBenefitsBlock>
            {cardBenefits.map((b) => {
              const requestRow = relationOne(b.benefit_product_request);
              const productName =
                relationOne(b.benefit_product)?.name ??
                b.custom_name ??
                requestRow?.requested_name ??
                "카드";
              const providerName = relationOne(b.provider)?.name ?? "";
              const benefitTypeLabel = formatUserBenefitTypeLabel(b.benefit_type);
              const hasConnectedDiscounts = b.connectedDiscountCount > 0;
              const approvalStatus = b.approval_status ?? requestRow?.status ?? null;
              const isPending = approvalStatus === "pending";
              const isRejected = approvalStatus === "rejected";
              const rejectMemo = isRejected ? requestRow?.admin_memo?.trim() : "";

              let statusLabel = hasConnectedDiscounts
                ? `연결된 할인 ${b.connectedDiscountCount}개`
                : "혜택 확인중";
              let statusClass = hasConnectedDiscounts
                ? "sr-user-badge sr-user-badge--match px-2 py-0.5"
                : "sr-user-badge px-2 py-0.5 text-gray-500";

              if (isPending) {
                statusLabel = "검토중";
                statusClass = "bg-amber-50 text-amber-800";
              } else if (isRejected) {
                statusLabel = "승인 반려";
                statusClass = "bg-red-50 text-red-700";
              }

              return (
                <div
                  key={b.id}
                  className={`inline-flex max-w-full items-center gap-1 rounded-2xl border py-1.5 pl-3 pr-1 text-xs font-semibold text-gray-900 ${
                    isRejected
                      ? "border-red-200 bg-red-50/60"
                      : isPending
                        ? "border-amber-200 bg-amber-50/60"
                        : "sr-user-chip border-[color:var(--sr-border-card)]"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">
                      {providerName ? `${providerName} · ` : ""}
                      {productName}
                      {benefitTypeLabel ? ` · ${benefitTypeLabel}` : ""}
                    </span>
                    <span
                      className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                    {isPending ? (
                      <span className="mt-1 block text-[11px] font-normal leading-snug text-amber-800/90">
                        승인 전까지 할인 매칭이 제한될 수 있습니다.
                      </span>
                    ) : null}
                    {rejectMemo ? (
                      <span className="mt-1 block text-[11px] font-normal leading-snug text-red-700">
                        사유: {rejectMemo}
                      </span>
                    ) : null}
                  </span>
                  <form action={deactivateUserBenefitAction}>
                    <input type="hidden" name="user_benefit_id" value={b.id} />
                    <button
                      type="submit"
                      aria-label={`${productName} 삭제`}
                      className="flex size-7 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </form>
                </div>
              );
            })}
          </RegisteredBenefitsBlock>
        ) : null}
      </BenefitAccordionCard>

      {payload.externalMembershipProducts.length > 0 ? (
        <BenefitAccordionCard
          icon={Star}
          title="멤버십/포인트 혜택"
          description="제휴 멤버십 및 포인트 할인"
          count={externalMembershipBenefits.length}
          expanded={expandedSection === "membership"}
          onToggle={() => toggleBenefitSection("membership")}
        >
          <BenefitFormStep step={1} label="멤버십/포인트 선택" withDivider={false}>
            <select
              id="external-membership-product"
              value={externalMembershipProductId}
              onChange={(event) => {
                setExternalMembershipProductId(event.target.value);
                setMembershipErr(null);
                setMembershipOk(null);
              }}
              className="sr-user-input px-3 py-3 text-sm font-semibold"
            >
              <option value="">멤버십 또는 포인트를 선택해 주세요.</option>
              {payload.externalMembershipProducts.map((product) => (
                <option key={product.id} value={String(product.id)}>
                  {formatExternalMembershipOptionLabel({
                    providerName: product.providerName,
                    name: product.name,
                  })}
                </option>
              ))}
            </select>
          </BenefitFormStep>

          <div className="sr-user-benefit-form-action">
            <button
              type="button"
              disabled={!canRegisterExternalMembership}
              onClick={handleRegisterExternalMembership}
              className="sr-user-benefit-register-btn flex h-12 w-full items-center justify-center gap-2 text-sm font-extrabold"
            >
              <Plus className="size-4" aria-hidden />
              {pendingMembership ? "등록 중..." : "멤버십/포인트 등록"}
            </button>
          </div>

          {externalMembershipBenefits.length > 0 ? (
            <RegisteredBenefitsBlock>
              {externalMembershipBenefits.map((benefit) => {
                const productName = relationOne(benefit.benefit_product)?.name ?? "멤버십/포인트";
                const providerName = relationOne(benefit.provider)?.name ?? "";
                const displayLabel = formatExternalMembershipOptionLabel({
                  providerName,
                  name: productName,
                });
                return (
                  <div key={benefit.id} className="sr-user-chip">
                    <span className="min-w-0 truncate">{displayLabel}</span>
                    <form action={deactivateUserBenefitAction}>
                      <input type="hidden" name="user_benefit_id" value={benefit.id} />
                      <button
                        type="submit"
                        aria-label={`${displayLabel} 삭제`}
                        className="flex size-7 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </form>
                  </div>
                );
              })}
            </RegisteredBenefitsBlock>
          ) : null}
        </BenefitAccordionCard>
      ) : null}

      <BenefitAccordionCard
        icon={TicketPercent}
        title="쿠폰/기타 혜택"
        description="쿠폰 및 기타 할인 혜택"
        count={0}
        countLabel="준비 중"
        expanded={expandedSection === "coupon"}
        onToggle={() => toggleBenefitSection("coupon")}
      >
        <p className="sr-user-benefit-accordion-card__placeholder">
          쿠폰과 기타 혜택 등록 기능을 준비 중이에요. 곧 이곳에서 관리할 수 있습니다.
        </p>
      </BenefitAccordionCard>

      {mode === "onboarding" ? (
        <UserBottomDock>
          <Link
            href="/"
            aria-disabled={registeredCount < 1}
            tabIndex={registeredCount < 1 ? -1 : 0}
            className={`flex h-12 w-full items-center justify-center rounded-2xl text-base font-bold text-white transition ${
              registeredCount < 1 ? "cursor-not-allowed opacity-45" : "sr-user-btn-primary"
            }`}
            onClick={(e) => {
              if (registeredCount < 1) e.preventDefault();
            }}
          >
            완료하고 시작하기
          </Link>
          {registeredCount < 1 ? (
            <p className="mt-2 text-center text-xs text-gray-500">
              통신사 또는 카드를 최소 1개 등록해 주세요.
            </p>
          ) : null}
        </UserBottomDock>
      ) : null}
    </div>
  );
}
