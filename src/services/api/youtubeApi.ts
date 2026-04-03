import httpClient from "../httpClient";
import type { YoutubeTrend } from "../../types/api";

export const youtubeApi = {
  getTrends: async (videoIds: string[]) => {
    const { data } = await httpClient.get<YoutubeTrend[]>("/Youtube/trends", {
      params: { videoIds },
    });

    return data;
  },
};
