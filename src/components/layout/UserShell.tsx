import "@/styles/user-app.css";
import "@/styles/user-theme.css";

import Script from "next/script";

import { ZOOM_STORAGE_KEY } from "@/lib/settings/zoom-level";

import { UserShellInner } from "@/components/layout/UserShellInner";

const ZOOM_BOOTSTRAP = `(function(){try{
  var k=${JSON.stringify(ZOOM_STORAGE_KEY)};
  var raw=localStorage.getItem(k);
  if(raw==null||raw==="")return;
  var n=parseFloat(raw);
  var allowed=[0.9,1,1.1,1.2];
  if(allowed.indexOf(n)===-1)return;
  document.documentElement.style.setProperty("--sr-zoom-scale",String(n));
}catch(e){}})();`;

interface UserShellProps {
  children: React.ReactNode;
}

export function UserShell({ children }: UserShellProps) {
  return (
    <>
      <Script id="saveroute-user-zoom-boot" strategy="beforeInteractive">
        {ZOOM_BOOTSTRAP}
      </Script>
      <UserShellInner>{children}</UserShellInner>
    </>
  );
}
