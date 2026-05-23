"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BenefitIconVariant = "telecom" | "card" | "membership" | "coupon";

type BenefitAccordionCardProps = {
  icon: LucideIcon;
  iconVariant: BenefitIconVariant;
  title: string;
  description: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  countLabel?: string;
};

export function BenefitAccordionCard({
  icon: Icon,
  iconVariant,
  title,
  description,
  count,
  expanded,
  onToggle,
  children,
  countLabel,
}: BenefitAccordionCardProps) {
  const resolvedCountLabel =
    countLabel ?? (count === 0 ? "미등록" : `${count}개 선택됨`);

  return (
    <section
      className={cn(
        "sr-user-benefit-accordion-card",
        `sr-user-benefit-accordion-card--${iconVariant}`,
        expanded && "sr-user-benefit-accordion-card--expanded",
      )}
    >
      <button
        type="button"
        className="sr-user-benefit-accordion-card__header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span
          className={cn(
            "sr-user-benefit-accordion-card__icon",
            `sr-user-benefit-accordion-card__icon--${iconVariant}`,
          )}
          aria-hidden="true"
        >
          <Icon strokeWidth={1.75} />
        </span>
        <span className="sr-user-benefit-accordion-card__copy">
          <span className="sr-user-benefit-accordion-card__title">{title}</span>
          <span className="sr-user-benefit-accordion-card__description">{description}</span>
        </span>
        <span className="sr-user-benefit-accordion-card__meta">
          <span className="sr-user-benefit-accordion-card__count">{resolvedCountLabel}</span>
          <ChevronDown
            className={cn(
              "sr-user-benefit-accordion-card__chevron",
              expanded && "sr-user-benefit-accordion-card__chevron--open",
            )}
            aria-hidden="true"
            strokeWidth={2.25}
          />
        </span>
      </button>

      <div
        className={cn(
          "sr-user-benefit-accordion-card__panel",
          expanded && "sr-user-benefit-accordion-card__panel--open",
        )}
      >
        <div className="sr-user-benefit-accordion-card__panel-inner">
          <div className="sr-user-benefit-accordion-card__inner-panel">{children}</div>
        </div>
      </div>
    </section>
  );
}

type RegisteredBenefitItemProps = {
  variant: BenefitIconVariant;
  tone?: "default" | "pending" | "rejected";
  children: ReactNode;
};

export function RegisteredBenefitItem({
  variant,
  tone = "default",
  children,
}: RegisteredBenefitItemProps) {
  return (
    <div
      className={cn(
        "sr-user-benefit-list-item",
        `sr-user-benefit-list-item--${variant}`,
        tone !== "default" && `sr-user-benefit-list-item--${tone}`,
      )}
    >
      {children}
    </div>
  );
}

type RegisteredBenefitsBlockProps = {
  title?: string;
  children: ReactNode;
};

export function RegisteredBenefitsBlock({
  title = "등록된 혜택",
  children,
}: RegisteredBenefitsBlockProps) {
  return (
    <div className="sr-user-benefit-registered">
      <p className="sr-user-benefit-registered__title">{title}</p>
      <div className="sr-user-benefit-registered__divider" aria-hidden="true" />
      <div className="sr-user-benefit-registered__list">{children}</div>
    </div>
  );
}

type BenefitFormStepProps = {
  label: string;
  step?: number;
  children: ReactNode;
  withDivider?: boolean;
};

export function BenefitFormStep({
  label,
  step,
  children,
  withDivider = true,
}: BenefitFormStepProps) {
  return (
    <div
      className={cn(
        "sr-user-benefit-form-step",
        withDivider && "sr-user-benefit-form-step--with-divider",
      )}
    >
      {step != null ? (
        <span className="sr-user-benefit-form-step__step">[{step}단계]</span>
      ) : null}
      <p className="sr-user-benefit-form-step__label">{label}</p>
      <div className="sr-user-benefit-form-step__body">{children}</div>
    </div>
  );
}
