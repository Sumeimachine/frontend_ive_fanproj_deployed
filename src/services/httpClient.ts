import axios from "axios";

const defaultApiBaseUrl = "/backend-api";

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default httpClient;
