import httpClient from "../httpClient";
import type { MemberProfile } from "../../types/member";

export const memberApi = {
  getAll: async () => {
    const { data } = await httpClient.get<MemberProfile[]>("/Members");
    return data;
  },

  getById: async (id: string) => {
    const { data } = await httpClient.get<MemberProfile>(`/Members/${id}`);
    return data;
  },

  update: async (id: string, payload: MemberProfile) => {
    const { data } = await httpClient.put<MemberProfile>(`/Members/${id}`, {
      name: payload.name,
      photoUrl: payload.photoUrl,
      tagline: payload.tagline,
      bio: payload.bio,
      accent: payload.accent,
    });
    return data;
  },
};
