export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  username?: string;
  role?: string;
  currencyBalance?: number;
  dailyRewardClaimedToday?: boolean;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface UserProfile {
  username?: string;
  role?: string;
  currencyBalance?: number;
  dailyRewardClaimedToday?: boolean;
}

export interface UserRoleSummary {
  id: number;
  username: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
}

export interface EventReward {
  id: number;
  title: string;
  message: string;
  points: number;
  isActive?: boolean;
  startAtUtc: string;
  endAtUtc: string;
  claimsCount?: number;
}

export interface YoutubeTrend {
  Song?: string;
  Views?: number | string;
  Likes?: number | string;
  song?: string;
  views?: number | string;
  likes?: number | string;
}
