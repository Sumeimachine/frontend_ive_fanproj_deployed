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

export interface YoutubeTrend {
  Song?: string;
  Views?: number | string;
  Likes?: number | string;
  song?: string;
  views?: number | string;
  likes?: number | string;
}
