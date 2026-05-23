import Link from "next/link";

import {
  SAVEROUTE_SLOGAN,
  buildSaverouteContactMailto,
} from "@/lib/user/brand-slogan";

const CONTACT_INQUIRY_MAILTO = buildSaverouteContactMailto("SaveRoute 문의");

export function UserFooter() {
  return (
    <footer className="sr-user-footer">
      <div className="sr-user-app-footer__inner sr-user-footer__inner">
        <nav
          className="sr-user-footer__links sr-user-footer__links--mobile-only"
          aria-label="푸터 링크"
        >
          <Link href="/notices" className="sr-user-link">
            공지사항
          </Link>
          <span className="sr-user-footer__sep" aria-hidden>
            ·
          </span>
          <Link href="/terms" className="sr-user-link">
            이용약관
          </Link>
          <span className="sr-user-footer__sep" aria-hidden>
            ·
          </span>
          <Link href="/privacy" className="sr-user-link">
            개인정보처리방침
          </Link>
          <span className="sr-user-footer__sep" aria-hidden>
            ·
          </span>
          <a
            href={CONTACT_INQUIRY_MAILTO}
            className="sr-user-link sr-user-footer__contact-link"
            aria-label="문의 메일 보내기"
          >
            문의
          </a>
        </nav>

        <div className="sr-user-footer__desktop-only">
          <div className="sr-user-footer__row">
            <div className="sr-user-footer__brand-block">
              <p className="sr-user-footer__brand">
                Save<span className="sr-user-footer__brand-accent">Route</span>
              </p>
              <p className="sr-user-footer__tagline">{SAVEROUTE_SLOGAN}</p>
            </div>

            <nav className="sr-user-footer__links" aria-label="푸터 링크">
              <Link href="/guide" className="sr-user-link">
                사용방법
              </Link>
              <span className="sr-user-footer__sep" aria-hidden>
                ·
              </span>
              <Link href="/notices" className="sr-user-link">
                공지사항
              </Link>
              <span className="sr-user-footer__sep" aria-hidden>
                ·
              </span>
              <Link href="/terms" className="sr-user-link">
                이용약관
              </Link>
              <span className="sr-user-footer__sep" aria-hidden>
                ·
              </span>
              <Link href="/privacy" className="sr-user-link">
                개인정보처리방침
              </Link>
              <span className="sr-user-footer__sep" aria-hidden>
                ·
              </span>
              <a
                href={CONTACT_INQUIRY_MAILTO}
                className="sr-user-link sr-user-footer__contact-link"
                aria-label="문의 메일 보내기"
              >
                문의
              </a>
            </nav>
          </div>

          <p className="sr-user-footer__copyright">
            Copyright © 2026 SaveRoute. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
