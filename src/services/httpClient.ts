import axios, { type InternalAxiosRequestConfig } from "axios";
import type { LoginResponse } from "../types/api";
import { clearAccessToken, getAccessToken, setAccessToken } from "./accessTokenStore";

const defaultApiBaseUrl = "/backend-api";
const apiBaseUrl = (import.meta.env.VITE_API_URL || defaultApiBaseUrl).replace(/\/$/, "");

const httpClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshRequest: Promise<string> | null = null;

const refreshAccessToken = async () => {
  if (!refreshRequest) {
    refreshRequest = axios
      .post<LoginResponse>(
        `${apiBaseUrl}/Auth/refresh-token`,
        {},
        { withCredentials: true },
      )
      .then(({ data }) => {
        setAccessToken(data.token);
        return data.token;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

httpClient.interceptors.response.use(
  (response) => response,
  async (error: { config?: RetryableRequest; response?: { status?: number } }) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes("/Auth/");

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const token = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return await httpClient(originalRequest);
    } catch (refreshError) {
      clearAccessToken();
      window.dispatchEvent(new Event("auth-session-expired"));
      return Promise.reject(refreshError);
    }
  },
);

export default httpClient;
