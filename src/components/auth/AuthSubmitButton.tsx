import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

const AUTH_SUBMIT_PARTICLE_COUNT = 6;

type AuthSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function AuthSubmitButton({
  children,
  className,
  type = "submit",
  ...props
}: AuthSubmitButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "sr-user-search-form__submit sr-user-auth-form__submit sr-user-btn-primary sr-user-btn-primary--block sr-user-btn-primary--compact",
        className,
      )}
      {...props}
    >
      {Array.from({ length: AUTH_SUBMIT_PARTICLE_COUNT }, (_, index) => (
        <span
          key={index}
          className={`sr-user-search-form__particle sr-user-search-form__particle--${index + 1}`}
          aria-hidden="true"
        />
      ))}
      <span className="sr-user-search-form__submit-text">{children}</span>
    </button>
  );
}
