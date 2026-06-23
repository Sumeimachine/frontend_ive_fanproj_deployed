import httpClient from "../httpClient";
import type { FanEvent } from "../../types/api";

export type FanEventPayload = Omit<FanEvent, "id">;

export const fanEventApi = {
  listPublished: async () => {
    const { data } = await httpClient.get<FanEvent[]>("/fan-events");
    return data;
  },

  superAdminList: async () => {
    const { data } = await httpClient.get<FanEvent[]>("/fan-events/admin");
    return data;
  },

  superAdminCreate: async (payload: FanEventPayload) => {
    const { data } = await httpClient.post<FanEvent>("/fan-events/admin", payload);
    return data;
  },

  superAdminUpdate: async (eventId: number, payload: FanEventPayload) => {
    const { data } = await httpClient.put<FanEvent>(`/fan-events/admin/${eventId}`, payload);
    return data;
  },

  superAdminDelete: async (eventId: number) => {
    const { data } = await httpClient.delete<{ message: string }>(`/fan-events/admin/${eventId}`);
    return data;
  },
};
