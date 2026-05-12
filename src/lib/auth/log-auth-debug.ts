export type AuthDebugPayload = {
  userId: string;
  email: string | undefined;
  activeUserBenefitsCount: number;
};

/** 개발 환경에서만 세션 요약을 출력합니다 (프로덕션 노출 없음). */
export function logAuthDebug(context: string, payload: AuthDebugPayload): void {
  if (process.env.NODE_ENV !== "development") return;
  console.info(`[SaveRoute auth] ${context}`, payload);
}
