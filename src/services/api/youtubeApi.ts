import httpClient from "../httpClient";
import type { YoutubeTrend } from "../../types/api";

export const youtubeApi = {
  getTrends: async (videoIds: string[]) => {
    const params = new URLSearchParams();

    videoIds.forEach((videoId) => {
      params.append("videoIds", videoId);
    });

    const { data } = await httpClient.get<YoutubeTrend[]>("/Youtube/trends", {
      params,
    });

    return data;
  },
};
