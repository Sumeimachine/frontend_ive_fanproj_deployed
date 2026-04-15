import httpClient from "../httpClient";
import type { EventReward } from "../../types/api";

export const eventApi = {
  getActiveEventReward: async () => {
    const { data } = await httpClient.get<EventReward | { message: string }>("/event-rewards/active");
    return data;
  },

  claimEventReward: async (eventRewardId: number) => {
    const { data } = await httpClient.post<{ id: number; title: string; points: number; currencyBalance: number }>(`/event-rewards/${eventRewardId}/claim`);
    return data;
  },

  superAdminList: async () => {
    const { data } = await httpClient.get<EventReward[]>("/event-rewards");
    return data;
  },

  superAdminCreate: async (payload: {
    title: string;
    message: string;
    points: number;
    isActive: boolean;
    startAtUtc: string;
    endAtUtc: string;
  }) => {
    const { data } = await httpClient.post<EventReward>("/event-rewards", payload);
    return data;
  },

  superAdminUpdate: async (
    eventRewardId: number,
    payload: {
      title: string;
      message: string;
      points: number;
      isActive: boolean;
      startAtUtc: string;
      endAtUtc: string;
    },
  ) => {
    const { data } = await httpClient.put<EventReward>(`/event-rewards/${eventRewardId}`, payload);
    return data;
  },

  superAdminDelete: async (eventRewardId: number) => {
    const { data } = await httpClient.delete<string>(`/event-rewards/${eventRewardId}`);
    return data;
  },
};
