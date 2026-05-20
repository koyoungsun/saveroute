export const VISITOR_SESSION_COOKIE = "sr_visitor_session";

export function createVisitorSessionId(): string {
  return crypto.randomUUID();
}
