export type MyPageProfilePayload = {
  email: string;
  nickname: string | null;
  createdAt: string;
  genderGroup: string | null;
  ageGroup: string | null;
  allowSearchStats: boolean;
  allowPersonalizedRecommendations: boolean;
  allowMarketingNotifications: boolean;
  registeredBenefitCount: number;
  registeredCardCount: number;
  registeredTelecomCount: number;
  registeredMembershipCount: number;
  registeredOtherCount: number;
  recentSearchCount: number;
  brandRequestParticipationCount: number;
};
