import { PolicyDocument } from "@/components/legal/PolicyDocument";
import { ContentPageShell } from "@/components/layout/ContentPageShell";
import { UserShell } from "@/components/layout/UserShell";
import {
  TERMS_EFFECTIVE_DATE,
  TERMS_INTRO,
  TERMS_SECTIONS,
} from "@/content/terms-sections";

export default function TermsPage() {
  return (
    <UserShell>
      <ContentPageShell>
        <PolicyDocument
          title="이용약관"
          effectiveDate={TERMS_EFFECTIVE_DATE}
          intro={TERMS_INTRO}
          sections={TERMS_SECTIONS}
          contactSubject="SaveRoute 이용약관 문의"
        />
      </ContentPageShell>
    </UserShell>
  );
}
