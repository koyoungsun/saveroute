import { PolicyDocument } from "@/components/legal/PolicyDocument";
import { ContentPageShell } from "@/components/layout/ContentPageShell";
import { UserShell } from "@/components/layout/UserShell";
import {
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
} from "@/content/privacy-sections";

export default function PrivacyPage() {
  return (
    <UserShell>
      <ContentPageShell>
        <PolicyDocument
          title="개인정보처리방침"
          effectiveDate={PRIVACY_EFFECTIVE_DATE}
          intro={PRIVACY_INTRO}
          sections={PRIVACY_SECTIONS}
          contactSubject="SaveRoute 개인정보처리방침 문의"
        />
      </ContentPageShell>
    </UserShell>
  );
}
