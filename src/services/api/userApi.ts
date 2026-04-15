import httpClient from "../httpClient";
import type { UserProfile, UserRoleSummary } from "../../types/api";

export const userApi = {
  getProfile: async () => {
    const { data } = await httpClient.get<UserProfile>("/User/profile");
    return data;
  },

  listUsersForRoleManagement: async () => {
    const { data } = await httpClient.get<UserRoleSummary[]>("/super-admin/users");
    return data;
  },

  setUserRole: async (userId: number, role: "User" | "Admin") => {
    const { data } = await httpClient.patch<UserRoleSummary>(`/super-admin/users/${userId}/role`, { role });
    return data;
  },
};
