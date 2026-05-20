"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import type { AdminOpsPanelPayload } from "@/lib/admin/ops-panel-data";
import {
  getOpsPanelPollIntervalLabel,
  getOpsPanelWindowLabel,
  OPS_PANEL_ACTIVE_WINDOW_PRESET,
  OPS_PANEL_POLL_INTERVAL_MS,
} from "@/lib/admin/ops-panel-config";

const windowLabel = getOpsPanelWindowLabel(OPS_PANEL_ACTIVE_WINDOW_PRESET);
const pollIntervalLabel = getOpsPanelPollIntervalLabel(OPS_PANEL_POLL_INTERVAL_MS);

function OpsPanelSection({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <section className="sr-admin-ops-section">
      <div className="sr-admin-ops-section-head">
        <h3 className="sr-admin-ops-section-title">
          <i className={`bi ${icon} sr-admin-frame-icon sr-admin-ops-section-icon`} aria-hidden="true" />
          <span>{title}</span>
        </h3>
        {subtitle ? (
          <p className="sr-admin-ops-section-subtitle mb-0">{subtitle}</p>
        ) : null}
      </div>
      <div className="sr-admin-ops-section-body">{children}</div>
    </section>
  );
}

function ScrollList({
  items,
  emptyText,
  renderItem,
}: {
  items: unknown[];
  emptyText: string;
  renderItem: (item: unknown, index: number) => ReactNode;
}) {
  if (items.length === 0) {
    return <p className="sr-admin-ops-empty mb-0">{emptyText}</p>;
  }

  return (
    <ul className="list-unstyled mb-0 sr-admin-ops-scroll">
      {items.map((item, index) => (
        <li key={index} className="sr-admin-ops-scroll-item">
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}

export function AdminOpsPanel() {
  const [data, setData] = useState<AdminOpsPanelPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPanelData = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/ops-panel", {
        cache: "no-store",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `HTTP ${response.status}`);
      }

      const payload = (await response.json()) as AdminOpsPanelPayload;
      setData(payload);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "운영 패널을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPanelData();
    const timer = window.setInterval(() => {
      void fetchPanelData();
    }, OPS_PANEL_POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [fetchPanelData]);

  return (
    <aside className="sr-admin-ops-panel" aria-label="실시간 운영 패널">
      <div className="sr-admin-ops-panel-inner">
        <header className="sr-admin-ops-panel-header">
          <div>
            <h2 className="sr-admin-ops-panel-title mb-0">
              <i className="bi bi-broadcast sr-admin-frame-icon sr-admin-ops-panel-title-icon" aria-hidden="true" />
              <span>실시간 운영</span>
            </h2>
            <p className="sr-admin-ops-panel-desc mb-0">
              {data?.windowLabel ?? windowLabel} 활동 기준
            </p>
          </div>
          <span className="sr-admin-ops-poll-badge">
            <i className="bi bi-arrow-repeat sr-admin-frame-icon me-1" aria-hidden="true" />
            {pollIntervalLabel}
          </span>
        </header>

        <div className="sr-admin-ops-panel-body">
          {loading && !data ? (
            <p className="sr-admin-ops-empty mb-0">불러오는 중...</p>
          ) : null}

          {error ? (
            <div className="sr-admin-ops-alert" role="alert">
              {error}
            </div>
          ) : null}

          {data ? (
            <>
              <OpsPanelSection title="현재 접속자" icon="bi-activity">
                <div className="sr-admin-ops-stat">
                  {data.activeUserCount.toLocaleString("ko-KR")}
                </div>
              </OpsPanelSection>

              <OpsPanelSection title="최근 검색어" icon="bi-search">
                <ScrollList
                  items={data.recentKeywords}
                  emptyText="최근 검색어가 없습니다."
                  renderItem={(item) => {
                    const row = item as AdminOpsPanelPayload["recentKeywords"][number];
                    return (
                      <div className="sr-admin-ops-row">
                        <span className="sr-admin-ops-row-main text-truncate">{row.keyword}</span>
                        <span className="sr-admin-ops-row-meta">{row.createdAt}</span>
                      </div>
                    );
                  }}
                />
              </OpsPanelSection>

              <OpsPanelSection title="인기 검색어 TOP 10" subtitle={data.windowLabel} icon="bi-graph-up-arrow">
                <ScrollList
                  items={data.popularKeywords}
                  emptyText="인기 검색어가 없습니다."
                  renderItem={(item) => {
                    const row = item as AdminOpsPanelPayload["popularKeywords"][number];
                    return (
                      <div className="sr-admin-ops-row">
                        <span className="sr-admin-ops-row-main text-truncate">{row.keyword}</span>
                        <span className="sr-admin-ops-count">{row.count}</span>
                      </div>
                    );
                  }}
                />
              </OpsPanelSection>

              <OpsPanelSection title="접속자 요약" icon="bi-people">
                <ScrollList
                  items={data.recentVisitors}
                  emptyText="최근 접속자가 없습니다."
                  renderItem={(item) => {
                    const row = item as AdminOpsPanelPayload["recentVisitors"][number];
                    return (
                      <div className="sr-admin-ops-visitor">
                        <div className="sr-admin-ops-visitor-label">{row.label}</div>
                        <div className="sr-admin-ops-visitor-meta">
                          {row.genderLabel} · {row.ageLabel}
                        </div>
                        <div className="sr-admin-ops-visitor-meta">{row.eventLabel}</div>
                        <div className="sr-admin-ops-visitor-meta">{row.lastSeenAt}</div>
                      </div>
                    );
                  }}
                />
              </OpsPanelSection>

              <p className="sr-admin-ops-fetched mb-0">갱신: {data.fetchedAt}</p>
            </>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
