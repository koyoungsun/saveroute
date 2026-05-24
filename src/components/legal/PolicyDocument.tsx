import Link from "next/link";

import {
  buildSaverouteContactMailto,
  SAVEROUTE_CONTACT_EMAIL,
} from "@/lib/user/brand-slogan";

export type PolicySection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  defaultOpen?: boolean;
  collapsible?: boolean;
};

type PolicyDocumentProps = {
  title: string;
  effectiveDate: string;
  intro: string;
  sections: PolicySection[];
  contactSubject: string;
};

function PolicySectionBody({
  paragraphs,
  bullets,
}: Pick<PolicySection, "paragraphs" | "bullets">) {
  return (
    <>
      {paragraphs?.map((paragraph, index) => (
        <p key={`${paragraph}-${index}`} className="sr-user-content-page__prose">
          {paragraph}
        </p>
      ))}
      {bullets?.length ? (
        <ul className="sr-user-content-page__list">
          {bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

export function PolicyDocument({
  title,
  effectiveDate,
  intro,
  sections,
  contactSubject,
}: PolicyDocumentProps) {
  const contactMailto = buildSaverouteContactMailto(contactSubject);

  return (
    <>
      <header className="sr-user-account-page__intro">
        <h1 className="sr-user-account-page__title">{title}</h1>
        <p className="sr-user-content-page__lead">시행일: {effectiveDate}</p>
      </header>

      <article className="sr-user-content-card">
        <p className="sr-user-content-page__notice">{intro}</p>

        <div className="sr-user-content-page__sections">
          {sections.map((section) => {
            const body = (
              <PolicySectionBody
                paragraphs={section.paragraphs}
                bullets={section.bullets}
              />
            );

            if (section.collapsible) {
              return (
                <details
                  key={section.title}
                  className="sr-user-content-page__details"
                  open={section.defaultOpen}
                >
                  <summary className="sr-user-content-page__section-title">
                    {section.title}
                  </summary>
                  <div className="sr-user-content-page__details-body">{body}</div>
                </details>
              );
            }

            return (
              <section key={section.title}>
                <h2 className="sr-user-content-page__section-title">{section.title}</h2>
                {body}
              </section>
            );
          })}

          <section>
            <h2 className="sr-user-content-page__section-title">문의</h2>
            <p className="sr-user-content-page__prose">
              {title} 관련 문의는 아래 이메일로 연락해 주세요.
            </p>
            <p className="sr-user-content-page__prose">
              <Link href={contactMailto} className="sr-user-content-page__inline-link">
                {SAVEROUTE_CONTACT_EMAIL}
              </Link>
            </p>
          </section>
        </div>
      </article>
    </>
  );
}
