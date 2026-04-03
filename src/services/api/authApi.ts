import httpClient from "../httpClient";
import type { LoginDto, LoginResponse, RegisterDto } from "../../types/api";

export const authApi = {
  register: async (dto: RegisterDto) => {
    const { data } = await httpClient.post<string>("/Auth/register", dto);
    return data;
  },

  login: async (dto: LoginDto) => {
    const { data } = await httpClient.post<LoginResponse>("/Auth/login", dto);
    return data;
  },

  verifyEmail: async (token: string) => {
    const { data } = await httpClient.get<string>("/Auth/verify-email", {
      params: { token },
    });
    return data;
  },

  forgotPassword: async (email: string) => {
    const { data } = await httpClient.post<string>("/Auth/forgot-password", {
      email,
    });
    return data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const { data } = await httpClient.post<string>("/Auth/reset-password", {
      token,
      newPassword,
    });
    return data;
  },

  refreshToken: async (refreshToken: string) => {
    const { data } = await httpClient.post<LoginResponse>("/Auth/refresh-token", {
      refreshToken,
    });
    return data;
  },

  logout: async (refreshToken?: string) => {
    const { data } = await httpClient.post<string>("/Auth/logout", {
      refreshToken,
    });
    return data;
  },
};
