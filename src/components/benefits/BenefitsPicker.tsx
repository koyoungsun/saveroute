"use client";

import { Check, CreditCard, Plus, Smartphone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  addCardBenefitAction,
  deactivateUserBenefitAction,
  registerTelecomBenefitAction,
  requestBenefitCardCatalogAction,
  type BenefitActionState,
  type BenefitCardCatalogRequestKind,
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

const CARD_KIND_LABEL: Record<CardBenefitKind, string> = {
  credit: "신용카드",
  debit: "체크카드",
  prepaid: "선불카드",
  all: "카드사 전체",
};

const REQUEST_KIND_UI: readonly {
  id: BenefitCardCatalogRequestKind;
  label: string;
}[] = [
  { id: "unknown", label: "모름 · 미확정" },
  { id: "credit", label: "신용카드" },
  { id: "debit", label: "체크카드" },
  { id: "prepaid", label: "선불카드" },
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
  const [membershipProductId, setMembershipProductId] = useState("");
  const [mvnoProviderId, setMvnoProviderId] = useState("");
  const [telecomOk, setTelecomOk] = useState<string | null>(null);
  const [telecomErr, setTelecomErr] = useState<string | null>(null);
  const [pendingTelecom, startTelecomTransition] = useTransition();
  const [selectedCardProviderId, setSelectedCardProviderId] = useState("");
  const [selectedCardProductId, setSelectedCardProductId] = useState("");
  const [selectedCardType, setSelectedCardType] = useState<CardBenefitKind | "">("");
  const [cardSearchQuery, setCardSearchQuery] = useState("");
  const [cardMsg, setCardMsg] = useState<string | null>(null);
  const [pendingCard, startCardTransition] = useTransition();
  const [manualCatalogCardName, setManualCatalogCardName] = useState("");
  const [manualCatalogKind, setManualCatalogKind] =
    useState<BenefitCardCatalogRequestKind>("unknown");
  const [manualCatalogMsg, setManualCatalogMsg] = useState<string | null>(null);
  const manualCatalogNameEditedRef = useRef(false);
  const [pendingCatalogRequest, startCatalogRequestTransition] = useTransition();

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
      const opt = payload.mvnoBrandOptions.find((o) => o.providerId === id);
      return opt?.defaultProductId ?? null;
    }
    if (!telecomFirst) {
      return null;
    }
    const pid = Number(membershipProductId);
    if (!Number.isInteger(pid) || pid <= 0) {
      return null;
    }
    return pid;
  }, [telecomFirst, membershipProductId, mvnoProviderId, payload.mvnoBrandOptions]);

  const canRegisterTelecom =
    resolvedTelecomProductId !== null &&
    !pendingTelecom &&
    telecomFirst !== null &&
    (telecomFirst === "mvno" ? mvnoProviderId !== "" : membershipProductId !== "");

  const telecomAndMvnoBenefits = useMemo(() => {
    const membershipIds = new Set(payload.telecomMembershipProducts.map((p) => p.id));
    const mvnoDefaultIds = new Set(payload.mvnoBrandOptions.map((o) => o.defaultProductId));
    return payload.userBenefits.filter((b) => {
      if (b.benefit_category_id === payload.cardCategoryId) {
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
    payload.telecomMembershipProducts,
    payload.mvnoBrandOptions,
  ]);

  function selectTelecomFirst(next: TelecomFirstChoiceId) {
    setTelecomFirst(next);
    setMembershipProductId("");
    setMvnoProviderId("");
    setTelecomErr(null);
    setTelecomOk(null);
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
          setMembershipProductId("");
          setMvnoProviderId("");
          setTelecomFirst(null);
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
      setManualCatalogKind("unknown");
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

  const registeredCount = payload.userBenefits.length;
  const accent = "#409A53";
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
      void requestBenefitCardCatalogAction(pid, nameTrim, manualCatalogKind).then(
        (r: BenefitActionState) => {
          if (r.error) {
            setManualCatalogMsg(r.error);
            return;
          }
          manualCatalogNameEditedRef.current = false;
          setManualCatalogMsg(r.message ?? "요청이 접수되었습니다.");
          setManualCatalogKind("unknown");
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
    <div className="space-y-8 pb-28 md:pb-10">
      {telecomErr ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {telecomErr}
        </p>
      ) : null}
      {telecomOk ? (
        <p
          className="rounded-2xl border px-4 py-3 text-sm font-medium"
          style={{ borderColor: `${accent}55`, backgroundColor: `${accent}14`, color: accent }}
        >
          {telecomOk}
        </p>
      ) : null}

      {showBenefitsEmptyCta ? (
        <div className="rounded-2xl border border-[#409A53]/25 bg-[#409A53]/08 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-gray-900">아직 등록된 혜택이 없어요.</p>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center sm:gap-3">
            <a
              href="#benefits-register"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-sr-primary px-5 text-sm font-bold text-white hover:bg-sr-primary-hover"
            >
              내 혜택 등록하기
            </a>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-800 hover:bg-gray-50"
            >
              검색하러 가기
            </Link>
          </div>
        </div>
      ) : null}

      <section
        id="benefits-register"
        className="scroll-mt-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>
              통신사
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-gray-950">통신 혜택 등록</h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              통신사 또는 알뜰폰을 선택해 주세요.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              알뜰폰은 브랜드 단위로 먼저 등록할 수 있어요.
            </p>
          </div>
          <Smartphone className="size-9 shrink-0 text-gray-300" aria-hidden />
        </div>

        <p className="mt-3 text-xs font-medium text-gray-700">1단계: 통신사 또는 알뜰폰</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TELECOM_FIRST_CHOICES.map((choice) => {
            const active = telecomFirst === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => selectTelecomFirst(choice.id)}
                className={`relative flex min-h-[72px] w-full flex-col items-start rounded-2xl border-2 px-3 py-3 text-left transition ${
                  active
                    ? "border-[#409A53] bg-[#409A53]/08 shadow-[0_1px_0_rgba(64,154,83,0.12)]"
                    : "border-gray-100 bg-gray-50/80 hover:border-gray-200"
                }`}
              >
                {active ? (
                  <Check className="absolute right-2 top-2 size-5 text-[#409A53]" aria-hidden />
                ) : null}
                <span className="text-sm font-bold text-gray-900">{choice.label}</span>
              </button>
            );
          })}
        </div>

        {telecomFirst && telecomFirst !== "mvno" ? (
          <div className="mt-5 space-y-2">
            <p className="text-xs leading-relaxed text-gray-600">
              통신사 멤버십 등급은 실제 할인 매칭에 사용됩니다.
            </p>
            <label htmlFor="telecom-membership-grade" className="text-xs font-bold text-gray-700">
              2단계: 멤버십 등급
            </label>
            <select
              id="telecom-membership-grade"
              value={membershipProductId}
              onChange={(event) => {
                setMembershipProductId(event.target.value);
                setTelecomErr(null);
                setTelecomOk(null);
              }}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-900 outline-none ring-[#409A53]/25 focus:border-[#409A53]/45 focus:ring-2"
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
          </div>
        ) : null}

        {telecomFirst === "mvno" ? (
          <div className="mt-5 space-y-2">
            <label htmlFor="telecom-mvno-brand" className="text-xs font-bold text-gray-700">
              2단계: 알뜰폰 브랜드
            </label>
            <select
              id="telecom-mvno-brand"
              value={mvnoProviderId}
              onChange={(event) => {
                setMvnoProviderId(event.target.value);
                setTelecomErr(null);
                setTelecomOk(null);
              }}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-900 outline-none ring-[#409A53]/25 focus:border-[#409A53]/45 focus:ring-2"
            >
              <option value="">브랜드를 선택해 주세요</option>
              {payload.mvnoBrandOptions.map((opt) => (
                <option key={opt.providerId} value={String(opt.providerId)}>
                  {opt.name}
                </option>
              ))}
            </select>
            {payload.mvnoBrandOptions.length === 0 ? (
              <p className="text-xs text-gray-500">등록 가능한 알뜰폰 브랜드가 없습니다.</p>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          disabled={!canRegisterTelecom}
          onClick={handleRegisterTelecom}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#409A53] text-sm font-extrabold text-white hover:bg-[#357945] disabled:bg-gray-300"
        >
          <Plus className="size-4" aria-hidden />
          {pendingTelecom ? "등록 중..." : "통신 혜택 등록"}
        </button>

        {telecomAndMvnoBenefits.length > 0 ? (
          <div className="mt-5">
            <p className="text-xs font-bold text-gray-700">등록한 통신·알뜰폰</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {telecomAndMvnoBenefits.map((b) => {
                const productName = relationOne(b.benefit_product)?.name ?? "회선";
                const providerName = relationOne(b.provider)?.name ?? "";
                return (
                  <div
                    key={b.id}
                    className="inline-flex max-w-full items-center gap-1 rounded-2xl border border-[#409A53]/35 bg-[#409A53]/10 py-1.5 pl-3 pr-1 text-xs font-semibold text-gray-900"
                  >
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
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>
          카드
        </p>
        <h2 className="mt-1 text-lg font-extrabold text-gray-950">보유 카드</h2>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          카드사와 카드를 차례로 선택해서 빠르게 등록할 수 있어요.
        </p>
        <p className="mt-3 rounded-2xl bg-[#409A53]/[0.06] px-3 py-2.5 text-xs leading-relaxed text-gray-600">
          아직 혜택 정보가 없는 카드도 보유카드로 등록할 수 있어요.
          세이브루트가 확인한 할인 혜택과 자동으로 연결됩니다.
        </p>

        <div className="mt-4 rounded-2xl border border-[#409A53]/15 bg-[#409A53]/[0.03] p-3">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-[#409A53]" aria-hidden />
            <p className="text-sm font-extrabold text-gray-950">
              빠르게 내 카드 등록
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="card-provider" className="text-xs font-bold text-gray-700">
                1. 카드사
              </label>
              <select
                id="card-provider"
                value={selectedCardProviderId}
                onChange={(event) => {
                  setSelectedCardProviderId(event.target.value);
                  setSelectedCardProductId("");
                  setCardSearchQuery("");
                  setCardMsg(null);
                }}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-900 outline-none ring-[#409A53]/25 focus:border-[#409A53]/45 focus:ring-2"
              >
                <option value="">카드사를 선택해 주세요</option>
                {payload.cardProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            {!selectedCardProviderId ? (
              <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2.5 text-sm font-medium text-amber-900">
                카드사를 먼저 선택하세요.
              </p>
            ) : null}

            {selectedCardProviderId ? (
              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="card-search" className="text-xs font-bold text-gray-700">
                    2. 카드명 검색
                  </label>
                  <input
                    id="card-search"
                    type="search"
                    value={cardSearchQuery}
                    onChange={(event) => setCardSearchQuery(event.target.value)}
                    placeholder="예: 트래블, The Pink, 전체"
                    autoComplete="off"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-900 outline-none ring-[#409A53]/25 placeholder:font-normal placeholder:text-gray-400 focus:border-[#409A53]/45 focus:ring-2"
                  />
                </div>

                <div>
                  <label htmlFor="card-product" className="text-xs font-bold text-gray-700">
                    3. 카드 선택
                  </label>
                  <select
                    id="card-product"
                    value={selectedCardProductId}
                    onChange={(event) => {
                      setSelectedCardProductId(event.target.value);
                      setCardMsg(null);
                    }}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-900 outline-none ring-[#409A53]/25 focus:border-[#409A53]/45 focus:ring-2"
                  >
                    <option value="">목록에서 카드를 선택해 주세요</option>
                    {filteredCardProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>

                  {showManualCatalogRequest ? (
                    <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                      <p className="text-xs font-medium text-gray-700">
                        {cardProductsForProvider.length === 0
                          ? "표시할 카드 상품이 없습니다. DB 마스터에 해당 카드사 상품이 아직 없을 수 있어요."
                          : "검색 결과가 없습니다. 보유 중인 카드명을 직접 입력해 마스터 추가를 요청할 수 있어요."}
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
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none ring-[#409A53]/25 focus:border-[#409A53]/45 focus:ring-2"
                            placeholder="예: 나만의 체크카드"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-700">카드 유형</p>
                          <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1 sm:grid-cols-4">
                            {REQUEST_KIND_UI.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setManualCatalogKind(item.id);
                                  setManualCatalogMsg(null);
                                }}
                                className={`h-9 rounded-xl text-xs font-extrabold transition sm:text-sm ${
                                  manualCatalogKind === item.id
                                    ? "bg-white text-[#409A53] shadow-sm"
                                    : "text-gray-500"
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          요청이 접수되면 검토 후 카드 목록에 반영됩니다.
                        </p>
                        <button
                          type="button"
                          disabled={!canSubmitManualCatalog}
                          onClick={handleSubmitCatalogRequest}
                          className="flex h-11 w-full items-center justify-center rounded-xl bg-[#409A53] text-sm font-extrabold text-white hover:bg-[#357945] disabled:bg-gray-300"
                        >
                          {pendingCatalogRequest ? "접수 중..." : "카드 마스터 추가 요청"}
                        </button>
                        {manualCatalogMsg ? (
                          <p className="text-xs font-medium text-gray-600">{manualCatalogMsg}</p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                {selectedCardProduct && selectableKinds.length > 0 && selectableKinds[0] !== "all" ? (
                  <div>
                    <p className="text-xs font-bold text-gray-700">4. 카드 유형</p>
                    <div
                      className={`mt-1.5 grid gap-1 rounded-2xl bg-gray-100 p-1 ${
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
                              active ? "bg-white text-[#409A53] shadow-sm" : "text-gray-500"
                            }`}
                          >
                            {CARD_KIND_LABEL[kind]}
                          </button>
                        );
                      })}
                    </div>
                    {selectableKinds.length === 1 ? (
                      <p className="mt-1.5 text-xs text-gray-500">
                        이 카드는 마스터 데이터 기준 {CARD_KIND_LABEL[selectableKinds[0]]}예요.
                      </p>
                    ) : selectableKinds.length > 1 ? (
                      <p className="mt-1.5 text-xs text-gray-500">
                        보유하신 결제 방식을 선택해 주세요.
                      </p>
                    ) : null}
                  </div>
                ) : selectedCardProduct?.isAllProduct ? (
                  <p className="text-xs text-gray-500">
                    이 상품은 해당 카드사 전체 할인에 매칭됩니다.
                  </p>
                ) : selectedCardProviderId &&
                  cardProductsForProvider.length > 0 &&
                  filteredCardProducts.length > 0 ? (
                  <p className="text-xs text-gray-400">카드를 선택하면 카드 유형을 고를 수 있어요.</p>
                ) : null}

                <button
                  type="button"
                  disabled={!canAddCard}
                  onClick={handleAddCard}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#409A53] text-sm font-extrabold text-white hover:bg-[#357945] disabled:bg-gray-300"
                >
                  <Plus className="size-4" aria-hidden />
                  {pendingCard ? "등록 중..." : "보유카드에 추가"}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {cardMsg ? (
          <p className="mt-3 text-xs font-medium text-gray-600">{cardMsg}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {cardBenefits.map((b) => {
            const productName = relationOne(b.benefit_product)?.name ?? "카드";
            const providerName = relationOne(b.provider)?.name ?? "";
            const benefitTypeLabel = formatUserBenefitTypeLabel(b.benefit_type);
            const hasConnectedDiscounts = b.connectedDiscountCount > 0;
            return (
              <div
                key={b.id}
                className="inline-flex max-w-full items-center gap-1 rounded-2xl border border-[#409A53]/35 bg-[#409A53]/10 py-1.5 pl-3 pr-1 text-xs font-semibold text-gray-900"
              >
                <span className="min-w-0">
                  <span className="block truncate">
                    {providerName ? `${providerName} · ` : ""}
                    {productName}
                    {benefitTypeLabel ? ` · ${benefitTypeLabel}` : ""}
                  </span>
                  <span
                    className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                      hasConnectedDiscounts
                        ? "bg-white text-[#409A53]"
                        : "bg-white text-gray-500"
                    }`}
                  >
                    {hasConnectedDiscounts
                      ? `연결된 할인 ${b.connectedDiscountCount}개`
                      : "혜택 확인중"}
                  </span>
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
          {cardBenefits.length === 0 ? (
            <p className="text-xs text-gray-500">등록된 카드가 없습니다.</p>
          ) : null}
        </div>

      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-900">등록 요약</h3>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
            총 {registeredCount}개
          </span>
        </div>
        <ul className="mt-3 space-y-2 text-xs text-gray-600">
          {payload.userBenefits.map((b) => (
            <li key={b.id} className="flex justify-between gap-2 border-b border-gray-50 pb-2 last:border-0">
              <span className="truncate">
                {relationOne(b.benefit_category)?.name ?? ""} ·{" "}
                {relationOne(b.benefit_product)?.name ?? relationOne(b.provider)?.name ?? "-"}
              </span>
            </li>
          ))}
          {payload.userBenefits.length === 0 ? (
            <li className="text-gray-500">아직 등록된 혜택이 없어요.</li>
          ) : null}
        </ul>
      </section>

      {mode === "onboarding" ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-100 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:z-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <Link
            href="/"
            aria-disabled={registeredCount < 1}
            tabIndex={registeredCount < 1 ? -1 : 0}
            className={`flex h-12 w-full items-center justify-center rounded-2xl text-base font-bold text-white transition ${
              registeredCount < 1 ? "cursor-not-allowed bg-gray-300" : "bg-sr-primary hover:bg-sr-primary-hover"
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
        </div>
      ) : null}
    </div>
  );
}
