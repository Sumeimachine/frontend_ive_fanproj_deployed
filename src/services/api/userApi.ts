import httpClient from "../httpClient";
import type { UserProfile } from "../../types/api";

export const userApi = {
  getProfile: async () => {
    const { data } = await httpClient.get<UserProfile>("/User/profile");
    return data;
  },
};
