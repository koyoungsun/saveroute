"use client";

import { useEffect, useState } from "react";

import styles from "./debug-build.module.css";

type DebugBuildClientProps = {
  buildId: string;
  commitSha: string;
  deploymentId: string;
  vercelUrl: string;
  vercelEnv: string;
  nodeEnv: string;
  hideBuildStampEnv: string;
  showBuildStamp: boolean;
  stampHiddenReasons: string[];
  serverTimeIso: string;
};

type ClientInfo = {
  origin: string;
  userAgent: string;
  clientTimeIso: string;
};

export function DebugBuildClient({
  buildId,
  commitSha,
  deploymentId,
  vercelUrl,
  vercelEnv,
  nodeEnv,
  hideBuildStampEnv,
  showBuildStamp,
  stampHiddenReasons,
  serverTimeIso,
}: DebugBuildClientProps) {
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);

  useEffect(() => {
    setClientInfo({
      origin: window.location.origin,
      userAgent: window.navigator.userAgent,
      clientTimeIso: new Date().toISOString(),
    });
  }, []);

  const rows = [
    { label: "NEXT_PUBLIC_APP_BUILD_ID", value: buildId },
    { label: "NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA", value: commitSha },
    { label: "origin", value: clientInfo?.origin ?? "(loading…)" },
    { label: "server time", value: serverTimeIso },
    { label: "client time", value: clientInfo?.clientTimeIso ?? "(loading…)" },
    { label: "userAgent", value: clientInfo?.userAgent ?? "(loading…)" },
  ];

  return (
    <main className={styles.root}>
      <div className={styles.panel}>
        <p className={styles.kicker}>SaveRoute / debug-build</p>
        <h1 className={styles.title}>배포 확인</h1>
        <p className={styles.lead}>모바일에서 현재 접속 중인 빌드 정보입니다.</p>

        <dl className={styles.list}>
          {rows.map((row) => (
            <div key={row.label} className={styles.row}>
              <dt className={styles.label}>{row.label}</dt>
              <dd className={styles.value}>{row.value}</dd>
            </div>
          ))}
        </dl>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>추가 배포 메타</h2>
          <dl className={styles.list}>
            <div className={styles.row}>
              <dt className={styles.label}>VERCEL_ENV</dt>
              <dd className={styles.value}>{vercelEnv}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.label}>VERCEL_DEPLOYMENT_ID</dt>
              <dd className={styles.value}>{deploymentId}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.label}>VERCEL_URL</dt>
              <dd className={styles.value}>{vercelUrl}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>하단 build stamp 진단</h2>
          <dl className={styles.list}>
            <div className={styles.row}>
              <dt className={styles.label}>NODE_ENV</dt>
              <dd className={styles.value}>{nodeEnv}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.label}>NEXT_PUBLIC_HIDE_BUILD_STAMP</dt>
              <dd className={styles.value}>{hideBuildStampEnv}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.label}>showBuildStamp</dt>
              <dd className={styles.value}>{showBuildStamp ? "true" : "false"}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.label}>stamp z-index</dt>
              <dd className={styles.value}>10050 (portal → body)</dd>
            </div>
          </dl>

          {showBuildStamp ? (
            <p className={styles.noteOk}>
              stamp 조건은 충족됩니다. 홈에서 안 보이면 글자 크기/브라우저 UI 가림 또는 PWA 캐시를
              확인하세요.
            </p>
          ) : (
            <div className={styles.noteWarn}>
              <p>stamp가 숨겨지는 이유:</p>
              <ul>
                {stampHiddenReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <a href="/" className={styles.homeLink}>
          홈으로
        </a>
      </div>
    </main>
  );
}
