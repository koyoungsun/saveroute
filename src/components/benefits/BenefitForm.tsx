"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

type CardType = "credit" | "debit" | "prepaid" | "unknown";
type BenefitCategory = "telecom" | "card";

type ProviderRow = {
  id: string;
  name: string;
  category?: string | null;
  provider_type?: string | null;
  active?: boolean | null;
  is_active?: boolean | null;
};

type BenefitProductRow = {
  id: string;
  provider_id: string;
  name: string;
  card_type?: CardType | null;
  active?: boolean | null;
  is_active?: boolean | null;
};

type UserBenefitRow = {
  id?: string;
  category: BenefitCategory;
  provider_id: string;
  benefit_product_id: string | null;
};

interface TelecomProvider {
  id: string;
  name: string;
  isMvno: boolean;
  isNone?: boolean;
}

interface TelecomProduct {
  id: string;
  providerId: string;
  name: string;
  isMvno: boolean;
}

interface CardCompany {
  id: string;
  name: string;
  isNone?: boolean;
}

interface CardProduct {
  id: string;
  companyId: string;
  name: string;
  cardType: CardType;
}

interface RegisteredBenefit {
  id: string; // stable UI key
  category: BenefitCategory;
  providerId: string;
  providerName: string;
  benefitProductId: string | null;
  productName: string;
  badge?: string;
}

const cardTypeLabels: Record<CardType, string> = {
  credit: "신용카드",
  debit: "체크카드",
  prepaid: "선불카드",
  unknown: "기타",
};

type BenefitFormProps = {
  providers: ProviderRow[];
  benefitProducts: BenefitProductRow[];
  initialUserBenefits: UserBenefitRow[];
};

function isTelecomProvider(provider: ProviderRow) {
  const category = provider.category ?? "";
  const type = provider.provider_type ?? "";
  return category === "telecom" || type.startsWith("telecom");
}

function isCardProvider(provider: ProviderRow) {
  const category = provider.category ?? "";
  const type = provider.provider_type ?? "";
  return category === "card" || type.startsWith("card");
}

function isMvnoProvider(provider: ProviderRow) {
  const type = provider.provider_type ?? "";
  return type.includes("mvno");
}

export function BenefitForm({
  providers,
  benefitProducts,
  initialUserBenefits,
}: BenefitFormProps) {
  const telecomProviderIds = useMemo(() => {
    return new Set(providers.filter(isTelecomProvider).map((provider) => provider.id));
  }, [providers]);

  const cardProviderIds = useMemo(() => {
    return new Set(providers.filter(isCardProvider).map((provider) => provider.id));
  }, [providers]);

  const telecomProviders: TelecomProvider[] = useMemo(() => {
    const rows = providers
      .filter(isTelecomProvider)
      .map((provider) => ({
        id: provider.id,
        name: provider.name,
        isMvno: isMvnoProvider(provider),
      }));

    return [
      { id: "none", name: "통신사 없음", isMvno: false, isNone: true },
      {
        id: "mvno-unknown",
        name: "알뜰요금제 사용 중이지만 혜택 확인 필요",
        isMvno: true,
      },
      ...rows,
    ];
  }, [providers]);

  const telecomProducts: TelecomProduct[] = useMemo(() => {
    const providerMap = new Map<string, ProviderRow>();
    providers.forEach((provider) => providerMap.set(provider.id, provider));

    const rows = benefitProducts
      .filter((product) => telecomProviderIds.has(product.provider_id))
      .map((product) => ({
        id: product.id,
        providerId: product.provider_id,
        name: product.name,
        isMvno: isMvnoProvider(providerMap.get(product.provider_id) ?? { id: "", name: "" }),
      }));

    return [
      {
        id: "mvno-unknown-plan",
        providerId: "mvno-unknown",
        name: "혜택 확인 필요",
        isMvno: true,
      },
      ...rows,
    ];
  }, [benefitProducts, providers, telecomProviderIds]);

  const cardCompanies: CardCompany[] = useMemo(() => {
    const rows = providers
      .filter(isCardProvider)
      .map((provider) => ({
        id: provider.id,
        name: provider.name,
      }));

    return [{ id: "none", name: "카드 없음", isNone: true }, ...rows];
  }, [providers]);

  const cardProducts: CardProduct[] = useMemo(
    () =>
      benefitProducts
        .filter((product) => cardProviderIds.has(product.provider_id))
        .map((product) => ({
        id: product.id,
        companyId: product.provider_id,
        name: product.name,
        cardType: (product.card_type ?? "unknown") as CardType,
      })),
    [benefitProducts, cardProviderIds],
  );

  const providerById = useMemo(() => {
    const map = new Map<string, ProviderRow>();
    providers.forEach((provider) => map.set(provider.id, provider));
    return map;
  }, [providers]);

  const benefitProductById = useMemo(() => {
    const map = new Map<string, BenefitProductRow>();
    benefitProducts.forEach((product) => map.set(product.id, product));
    return map;
  }, [benefitProducts]);

  const [registeredBenefits, setRegisteredBenefits] = useState<RegisteredBenefit[]>(
    () => {
      if (!initialUserBenefits?.length) {
        return [];
      }

      return initialUserBenefits.map((benefit) => {
        const provider = providerById.get(benefit.provider_id);
        const product = benefit.benefit_product_id
          ? benefitProductById.get(benefit.benefit_product_id)
          : null;

        const providerName = provider?.name ?? "알 수 없는 제공사";
        const productName =
          product?.name ??
          (benefit.category === "card" ? "카드상품 나중에 선택" : "혜택 선택");

        const badge =
          benefit.category === "card" && product?.card_type
            ? cardTypeLabels[(product.card_type ?? "unknown") as CardType]
            : undefined;

        return {
          id: `${benefit.category}-${benefit.provider_id}-${benefit.benefit_product_id ?? "provider"}`,
          category: benefit.category,
          providerId: benefit.provider_id,
          providerName,
          benefitProductId: benefit.benefit_product_id,
          productName,
          badge,
        };
      });
    },
  );

  const [selectedTelecomProviderId, setSelectedTelecomProviderId] =
    useState("none");
  const [selectedCardCompanyId, setSelectedCardCompanyId] = useState("none");
  const [selectedTelecomProductId, setSelectedTelecomProductId] = useState("");
  const [selectedCardProductId, setSelectedCardProductId] = useState("");
  const [saveStatus, setSaveStatus] = useState<
    { kind: "idle" } | { kind: "saving" } | { kind: "error"; message: string } | { kind: "success"; empty: boolean }
  >({ kind: "idle" });

  const filteredTelecomProducts = useMemo(
    () =>
      telecomProducts.filter(
        (product) => product.providerId === selectedTelecomProviderId,
      ),
    [selectedTelecomProviderId],
  );

  const filteredCardProducts = useMemo(
    () =>
      cardProducts.filter(
        (product) => product.companyId === selectedCardCompanyId,
      ),
    [selectedCardCompanyId],
  );

  const selectedTelecomProvider = telecomProviders.find(
    (provider) => provider.id === selectedTelecomProviderId,
  );
  const selectedTelecomProduct = telecomProducts.find(
    (product) => product.id === selectedTelecomProductId,
  );
  const selectedCardCompany = cardCompanies.find(
    (company) => company.id === selectedCardCompanyId,
  );
  const selectedCardProduct = cardProducts.find(
    (product) => product.id === selectedCardProductId,
  );
  const shouldShowMvnoNotice =
    selectedTelecomProvider?.isMvno || selectedTelecomProduct?.isMvno;
  const hasTelecomProviderSelected =
    Boolean(selectedTelecomProvider) && !selectedTelecomProvider?.isNone;
  const hasCardCompanySelected =
    Boolean(selectedCardCompany) && !selectedCardCompany?.isNone;
  const telecomBenefitCount = registeredBenefits.filter(
    (benefit) => benefit.category === "telecom",
  ).length;
  const cardBenefitCount = registeredBenefits.filter(
    (benefit) => benefit.category === "card",
  ).length;

  const handleTelecomProviderChange = (providerId: string) => {
    setSelectedTelecomProviderId(providerId);
    setSelectedTelecomProductId(
      telecomProducts.find((product) => product.providerId === providerId)
        ?.id ?? "",
    );
  };

  const handleCardCompanyChange = (companyId: string) => {
    setSelectedCardCompanyId(companyId);
    setSelectedCardProductId("");
  };

  const addTelecomBenefit = () => {
    if (
      telecomBenefitCount >= 2 ||
      !hasTelecomProviderSelected ||
      !selectedTelecomProvider ||
      !selectedTelecomProduct
    ) {
      return;
    }

    setRegisteredBenefits((current) => [
      ...current,
      {
        id: `telecom-${selectedTelecomProvider.id}-${selectedTelecomProduct.id}`,
        category: "telecom",
        providerId: selectedTelecomProvider.id,
        providerName: selectedTelecomProvider.name,
        benefitProductId: selectedTelecomProduct.id,
        productName: selectedTelecomProduct.name,
      },
    ]);
  };

  const addCardBenefit = () => {
    if (cardBenefitCount >= 3 || !hasCardCompanySelected || !selectedCardCompany) {
      return;
    }

    setRegisteredBenefits((current) => [
      ...current,
      {
        id: `card-${selectedCardCompany.id}-${selectedCardProduct?.id ?? "provider"}`,
        category: "card",
        providerId: selectedCardCompany.id,
        providerName: selectedCardCompany.name,
        benefitProductId: selectedCardProduct?.id ?? null,
        productName: selectedCardProduct?.name ?? "카드상품 나중에 선택",
        badge: selectedCardProduct
          ? cardTypeLabels[selectedCardProduct.cardType]
          : undefined,
      },
    ]);
  };

  const removeBenefit = (benefitId: string) => {
    setRegisteredBenefits((current) =>
      current.filter((benefit) => benefit.id !== benefitId),
    );
  };

  const handleSave = async () => {
    setSaveStatus({ kind: "saving" });

    try {
      const response = await fetch("/api/user-benefits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          benefits: registeredBenefits.map((benefit) => ({
            category: benefit.category,
            provider_id: benefit.providerId,
            benefit_product_id: benefit.benefitProductId,
          })),
        }),
      });

      const json = (await response.json()) as
        | { success: true; empty: boolean }
        | { error: string };

      if (!response.ok || "error" in json) {
        setSaveStatus({
          kind: "error",
          message: "error" in json ? json.error : "저장 실패",
        });
        return;
      }

      setSaveStatus({ kind: "success", empty: json.empty });
    } catch {
      setSaveStatus({ kind: "error", message: "저장 실패" });
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800">통신사</h2>
        <p className="mt-1 text-xs text-gray-400">
          통신사 혜택이 없다면 ‘통신사 없음’을 선택해도 됩니다.
        </p>

        <label
          htmlFor="telecom-provider"
          className="mt-4 block text-sm font-medium text-gray-700"
        >
          통신사
        </label>
        <select
          id="telecom-provider"
          value={selectedTelecomProviderId}
          onChange={(event) => handleTelecomProviderChange(event.target.value)}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
        >
          {telecomProviders.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>

        <label
          htmlFor="telecom-product"
          className="mt-4 block text-sm font-medium text-gray-700"
        >
          등급 / 요금제
        </label>
        <select
          id="telecom-product"
          value={selectedTelecomProductId}
          onChange={(event) => setSelectedTelecomProductId(event.target.value)}
          disabled={!hasTelecomProviderSelected}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          {!hasTelecomProviderSelected ? (
            <option value="">통신사를 먼저 선택해주세요</option>
          ) : null}
          {filteredTelecomProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>

        {shouldShowMvnoNotice ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            알뜰요금제 혜택은 통신사/요금제별로 다를 수 있어 실제 적용 여부
            확인이 필요합니다.
          </p>
        ) : null}

        <button
          type="button"
          onClick={addTelecomBenefit}
          disabled={telecomBenefitCount >= 2 || !hasTelecomProviderSelected}
          className="mt-4 text-sm font-medium text-blue-600 disabled:text-gray-400"
        >
          + 통신사 추가
        </button>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800">카드</h2>
        <p className="mt-1 text-xs text-gray-400">
          정확한 카드명을 모르면 카드사만 선택해도 됩니다.
        </p>

        <label
          htmlFor="card-company"
          className="mt-4 block text-sm font-medium text-gray-700"
        >
          카드사
        </label>
        <select
          id="card-company"
          value={selectedCardCompanyId}
          onChange={(event) => handleCardCompanyChange(event.target.value)}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
        >
          {cardCompanies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>

        <label
          htmlFor="card-product"
          className="mt-4 block text-sm font-medium text-gray-700"
        >
          카드 선택
        </label>
        <select
          id="card-product"
          value={selectedCardProductId}
          onChange={(event) => setSelectedCardProductId(event.target.value)}
          disabled={!hasCardCompanySelected}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">
            {hasCardCompanySelected
              ? "카드상품은 나중에 선택"
              : "카드사를 먼저 선택해주세요"}
          </option>
          {filteredCardProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>

        {selectedCardProduct ? (
          <span className="mt-3 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {cardTypeLabels[selectedCardProduct.cardType]}
          </span>
        ) : null}

        <button
          type="button"
          onClick={addCardBenefit}
          disabled={cardBenefitCount >= 3 || !hasCardCompanySelected}
          className="mt-4 block text-sm font-medium text-blue-600 disabled:text-gray-400"
        >
          + 카드 추가
        </button>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800">등록된 혜택</h2>

        {registeredBenefits.length > 0 ? (
          <ul className="mt-3 divide-y divide-gray-100">
            {registeredBenefits.map((benefit) => (
              <li
                key={benefit.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {benefit.productName}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {benefit.providerName}
                    {benefit.badge ? ` · ${benefit.badge}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeBenefit(benefit.id)}
                  aria-label={`${benefit.productName} 삭제`}
                  className="shrink-0 text-gray-400 hover:text-red-500"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 space-y-1">
            <p className="text-sm text-gray-500">등록된 혜택이 없습니다.</p>
            <p className="text-xs text-gray-400">
              통신사나 카드를 등록하면 검색 결과가 더 정확해져요.
            </p>
          </div>
        )}
      </section>

      {saveStatus.kind === "saving" ? (
        <p className="text-sm text-gray-500">저장 중...</p>
      ) : null}
      {saveStatus.kind === "error" ? (
        <p className="text-sm text-red-600">{saveStatus.message || "저장 실패"}</p>
      ) : null}
      {saveStatus.kind === "success" ? (
        <p className="text-sm text-blue-600">
          {saveStatus.empty ? "혜택 없이 저장되었습니다." : "혜택이 저장되었습니다."}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={saveStatus.kind === "saving"}
        className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white hover:bg-blue-700"
      >
        {saveStatus.kind === "saving" ? "저장 중..." : "저장하기"}
      </button>
    </div>
  );
}
