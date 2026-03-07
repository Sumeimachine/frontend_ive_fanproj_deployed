// src/hooks/useYoutubeStats.ts
import { useEffect, useState } from "react";
import axios from "axios";

export interface YoutubeStat {
  name: string;
  views: number;
  likes: number;
  comments: number;
  videoId: string;
}

export const useYoutubeStats = (apiKey: string) => {
  const [stats, setStats] = useState<YoutubeStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const songs = (await import("../assets/songs.json")).default;
        
        const results = await Promise.all(
          songs.map(async (song: { name: string; youtubeId: string }) => {
            const res = await axios.get(
              "https://www.googleapis.com/youtube/v3/videos",
              {
                params: {
                  part: "statistics,snippet",
                  id: song.youtubeId,
                  key: apiKey,
                },
              }
            );

            const data = res.data.items[0].statistics;
            return {
              name: song.name,
              videoId: song.youtubeId,
              views: Number(data.viewCount || 0),
              likes: Number(data.likeCount || 0),
              comments: Number(data.commentCount || 0),
            };
          })
        );

        setStats(results);
      } catch (err) {
        console.error("Error fetching YouTube stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [apiKey]);

  return { stats, loading };
};
