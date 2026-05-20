import {
  buildAnonymizedVisitorLabel,
  formatOpsPanelTimestamp,
  formatProfileAgeLabel,
  formatProfileGenderLabel,
} from "@/lib/admin/ops-panel-anonymize";
import {
  getOpsPanelWindowLabel,
  OPS_PANEL_ACTIVE_WINDOW_PRESET,
  resolveOpsPanelWindowSince,
} from "@/lib/admin/ops-panel-config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const SEARCH_LOG_SAMPLE_LIMIT = 500;
const ACTIVITY_LOG_SAMPLE_LIMIT = 500;

export type AdminOpsPanelPayload = {
  activeUserCount: number;
  recentKeywords: Array<{ keyword: string; createdAt: string }>;
  popularKeywords: Array<{ keyword: string; count: number }>;
  recentVisitors: Array<{
    label: string;
    genderLabel: string;
    ageLabel: string;
    lastSeenAt: string;
    eventLabel: string;
  }>;
  windowLabel: string;
  fetchedAt: string;
};

type SearchLogRow = {
  keyword: string;
  normalized_keyword: string;
  user_id: string | null;
  created_at: string;
};

type ActivityLogRow = {
  user_id: string | null;
  session_id: string | null;
  event_type: string;
  keyword: string | null;
  path: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  gender_group: string | null;
  age_group: string | null;
};

function eventTypeLabel(eventType: string): string {
  if (eventType === "search") {
    return "검색";
  }
  if (eventType === "page_view") {
    return "페이지";
  }
  return eventType;
}

function aggregatePopularKeywords(rows: SearchLogRow[]): Array<{ keyword: string; count: number }> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const keyword = (row.normalized_keyword || row.keyword || "").trim();
    if (!keyword) {
      continue;
    }
    counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((left, right) => right.count - left.count || left.keyword.localeCompare(right.keyword, "ko"))
    .slice(0, 10);
}

function buildRecentVisitorsFromActivity(
  rows: ActivityLogRow[],
  profilesByUserId: Map<string, ProfileRow>,
): AdminOpsPanelPayload["recentVisitors"] {
  const latestByActor = new Map<string, ActivityLogRow>();

  for (const row of rows) {
    const actorKey = row.user_id ?? `session:${row.session_id ?? "unknown"}`;
    const existing = latestByActor.get(actorKey);
    if (!existing || new Date(row.created_at).getTime() > new Date(existing.created_at).getTime()) {
      latestByActor.set(actorKey, row);
    }
  }

  return [...latestByActor.values()]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 10)
    .map((row) => {
      const profile = row.user_id ? profilesByUserId.get(row.user_id) : null;
      return {
        label: buildAnonymizedVisitorLabel({
          userId: row.user_id,
          sessionId: row.session_id,
        }),
        genderLabel: formatProfileGenderLabel(profile?.gender_group),
        ageLabel: formatProfileAgeLabel(profile?.age_group),
        lastSeenAt: formatOpsPanelTimestamp(row.created_at),
        eventLabel: row.keyword
          ? `${eventTypeLabel(row.event_type)} · ${row.keyword}`
          : eventTypeLabel(row.event_type),
      };
    });
}

function buildRecentVisitorsFromSearchLogs(rows: SearchLogRow[]): AdminOpsPanelPayload["recentVisitors"] {
  const latestByUser = new Map<string, SearchLogRow>();

  for (const row of rows) {
    const actorKey = row.user_id ?? `anonymous:${row.created_at}`;
    const existing = latestByUser.get(actorKey);
    if (!existing || new Date(row.created_at).getTime() > new Date(existing.created_at).getTime()) {
      latestByUser.set(actorKey, row);
    }
  }

  return [...latestByUser.values()]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 10)
    .map((row) => ({
      label: row.user_id
        ? buildAnonymizedVisitorLabel({ userId: row.user_id, sessionId: null })
        : "비로그인 사용자",
      genderLabel: "정보 없음",
      ageLabel: "정보 없음",
      lastSeenAt: formatOpsPanelTimestamp(row.created_at),
      eventLabel: `검색 · ${row.keyword}`,
    }));
}

function countActiveUsersFromActivity(rows: ActivityLogRow[]): number {
  const userIds = new Set<string>();
  const sessionIds = new Set<string>();

  for (const row of rows) {
    if (row.user_id) {
      userIds.add(row.user_id);
      continue;
    }
    if (row.session_id) {
      sessionIds.add(row.session_id);
    }
  }

  return userIds.size + sessionIds.size;
}

function countActiveUsersFromSearchLogs(rows: SearchLogRow[]): number {
  const userIds = new Set<string>();
  let anonymousCount = 0;

  for (const row of rows) {
    if (row.user_id) {
      userIds.add(row.user_id);
    } else {
      anonymousCount += 1;
    }
  }

  return userIds.size + anonymousCount;
}

export async function loadAdminOpsPanelData(): Promise<AdminOpsPanelPayload> {
  const supabase = createSupabaseAdminClient();
  const windowSince = resolveOpsPanelWindowSince(OPS_PANEL_ACTIVE_WINDOW_PRESET);
  const windowLabel = getOpsPanelWindowLabel(OPS_PANEL_ACTIVE_WINDOW_PRESET);
  const fetchedAt = new Date().toISOString();

  const [
    { data: windowSearchRows, error: windowSearchError },
    { data: activityRows, error: activityError },
  ] = await Promise.all([
    supabase
      .from("search_logs")
      .select("keyword,normalized_keyword,user_id,created_at")
      .gte("created_at", windowSince)
      .order("created_at", { ascending: false })
      .limit(SEARCH_LOG_SAMPLE_LIMIT),
    supabase
      .from("activity_logs")
      .select("user_id,session_id,event_type,keyword,path,created_at")
      .gte("created_at", windowSince)
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_LOG_SAMPLE_LIMIT),
  ]);

  if (windowSearchError) {
    throw new Error(`Failed to load search logs: ${windowSearchError.message}`);
  }

  const searchLogRows = (windowSearchRows ?? []) as SearchLogRow[];

  const recentKeywords = searchLogRows.slice(0, 10).map((row) => ({
    keyword: row.keyword,
    createdAt: formatOpsPanelTimestamp(row.created_at),
  }));

  const popularKeywords = aggregatePopularKeywords(searchLogRows);

  const activityAvailable = !activityError;
  const activeActivityRows = activityAvailable ? ((activityRows ?? []) as ActivityLogRow[]) : [];

  let activeUserCount = 0;
  let recentVisitors: AdminOpsPanelPayload["recentVisitors"] = [];

  if (activityAvailable && activeActivityRows.length > 0) {
    activeUserCount = countActiveUsersFromActivity(activeActivityRows);

    const userIds = [...new Set(activeActivityRows.map((row) => row.user_id).filter(Boolean))] as string[];
    const profilesByUserId = new Map<string, ProfileRow>();

    if (userIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id,gender_group,age_group")
        .in("id", userIds);

      if (profileError) {
        throw new Error(`Failed to load visitor profiles: ${profileError.message}`);
      }

      for (const profile of (profileRows ?? []) as ProfileRow[]) {
        profilesByUserId.set(profile.id, profile);
      }
    }

    recentVisitors = buildRecentVisitorsFromActivity(activeActivityRows, profilesByUserId);
  } else {
    activeUserCount = countActiveUsersFromSearchLogs(searchLogRows);
    recentVisitors = buildRecentVisitorsFromSearchLogs(searchLogRows);
  }

  return {
    activeUserCount,
    recentKeywords,
    popularKeywords,
    recentVisitors,
    windowLabel,
    fetchedAt: formatOpsPanelTimestamp(fetchedAt),
  };
}
