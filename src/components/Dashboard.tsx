import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Box, Button, Grid, Heading, Image, Stack, Text, VStack } from "@chakra-ui/react";
import ReactSelect from "react-select";
import songsData from "../assets/songs.json";
import { cardApi } from "../services/api/cardApi";
import { youtubeApi } from "../services/api/youtubeApi";

interface SongMetrics {
  song: string;
  youtubeViews: number;
  youtubeLikes: number;
  youtubeId: string;
}

interface Song {
  name: string;
  youtubeId: string;
  thumbnailUrl?: string;
}

const fallbackSongs = songsData as Song[];
const chunkSize = 20;
const requestDelayMs = 250;
const rateLimitDelayMs = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const selectStyles = {
  control: (base: Record<string, unknown>) => ({
    ...base,
    background: "#2C2440",
    borderRadius: "12px",
  }),
  singleValue: (base: Record<string, unknown>) => ({ ...base, color: "#fff" }),
  input: (base: Record<string, unknown>) => ({ ...base, color: "#fff" }),
  placeholder: (base: Record<string, unknown>) => ({ ...base, color: "#fff" }),
  menu: (base: Record<string, unknown>) => ({ ...base, background: "#2C2440" }),
  option: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    background: state.isFocused ? "#40365E" : "#2C2440",
    color: "#fff",
  }),
};

const Dashboard: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>(fallbackSongs);
  const [metrics, setMetrics] = useState<SongMetrics[]>([]);
  const [songA, setSongA] = useState("");
  const [songB, setSongB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTrendChunks = useCallback(async (videoIdChunks: string[][]) => {
    const results: Awaited<ReturnType<typeof youtubeApi.getTrends>>[] = [];
    let hadRateLimit = false;

    for (const chunk of videoIdChunks) {
      try {
        results.push(await youtubeApi.getTrends(chunk));
      } catch (requestError: unknown) {
        const status = (requestError as { response?: { status?: number } })?.response?.status;
        if (status !== 429) {
          throw requestError;
        }

        hadRateLimit = true;
        results.push([]);
        await delay(rateLimitDelayMs);
        continue;
      }

      await delay(requestDelayMs);
    }

    return { results, hadRateLimit };
  }, []);

  const buildMetrics = useCallback(
    (
      selectedSongs: Song[],
      responses: Awaited<ReturnType<typeof youtubeApi.getTrends>>[],
    ): SongMetrics[] => {
      const trendsByVideoId = new Map(
        responses
          .flat()
          .map((item) => [item.Song ?? item.song, item] as const)
          .filter(([videoId]) => Boolean(videoId)),
      );

      return selectedSongs.map((song) => {
        const trend = trendsByVideoId.get(song.youtubeId);

        return {
          song: song.name,
          youtubeViews: Number(trend?.Views ?? trend?.views ?? 0),
          youtubeLikes: Number(trend?.Likes ?? trend?.likes ?? 0),
          youtubeId: song.youtubeId,
        };
      });
    },
    [],
  );

  const fetchInitialMetrics = useCallback(async () => {
    if (songs.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const videoIdChunks: string[][] = [];

      for (let i = 0; i < songs.length; i += chunkSize) {
        videoIdChunks.push(songs.slice(i, i + chunkSize).map((song) => song.youtubeId));
      }

      const { results, hadRateLimit } = await fetchTrendChunks(videoIdChunks);

      setMetrics(buildMetrics(songs, results));
      if (hadRateLimit) {
        setError("Some trend requests were rate-limited (429). Showing partial data.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch initial metrics.");
    } finally {
      setLoading(false);
    }
  }, [buildMetrics, fetchTrendChunks, songs]);

  useEffect(() => {
    let isMounted = true;

    const fetchCards = async () => {
      try {
        const cards = await cardApi.getAll();
        if (!isMounted) return;

        const nextSongs = cards
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((card) => ({
            name: card.name,
            youtubeId: card.youtubeId,
            thumbnailUrl: card.thumbnailUrl,
          }));

        if (nextSongs.length > 0) {
          setSongs(nextSongs);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("Using local card catalog because the backend card API is unavailable.");
        }
      }
    };

    void fetchCards();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    void fetchInitialMetrics();
  }, [fetchInitialMetrics]);

  const fetchMetrics = async () => {
    const selectedSongNames = [songA, songB].filter(Boolean);
    if (selectedSongNames.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const selectedSongs = selectedSongNames
        .map((songName) => songs.find((song) => song.name === songName))
        .filter((song): song is Song => Boolean(song));

      const { results, hadRateLimit } = await fetchTrendChunks([
        selectedSongs.map((song) => song.youtubeId),
      ]);
      const updatedMetrics = buildMetrics(selectedSongs, results);

      setMetrics((prev) => {
        const otherMetrics = prev.filter((m) => !selectedSongNames.includes(m.song));
        return [...otherMetrics, ...updatedMetrics];
      });

      if (hadRateLimit) {
        setError("YouTube API rate-limited this refresh (429).");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch metrics.");
    } finally {
      setLoading(false);
    }
  };

  const thumbnailByVideoId = useMemo(
    () => new Map(songs.map((song) => [song.youtubeId, song.thumbnailUrl])),
    [songs],
  );

  const songOptions = useMemo(
    () => songs.map((song) => ({ value: song.name, label: song.name })),
    [songs],
  );

  const songsToShow = useMemo(
    () =>
      songA || songB
        ? metrics.filter((m) => [songA, songB].includes(m.song))
        : metrics.length > 0
          ? metrics
          : songs.map((song) => ({
              song: song.name,
              youtubeViews: 0,
              youtubeLikes: 0,
              youtubeId: song.youtubeId,
            })),
    [metrics, songA, songB, songs],
  );

  const comparisonData = useMemo(
    () =>
      songA && songB
        ? songsToShow.filter((m) => [songA, songB].includes(m.song))
        : [],
    [songA, songB, songsToShow],
  );

  const getThumbnail = (song: SongMetrics) =>
    thumbnailByVideoId.get(song.youtubeId)
    ?? `https://img.youtube.com/vi/${song.youtubeId}/hqdefault.jpg`;

  return (
    <Box
      bgGradient="radial(circle at top, #1A152A, #0A0812 80%)"
      color="white"
      minH="100vh"
      py={{ base: 10, md: 20 }}
      px={{ base: 4, md: 10 }}
    >
      <Box maxW="1200px" mx="auto" textAlign="center">
        <Heading
          as="h1"
          fontSize={{ base: "2xl", md: "4xl" }}
          fontWeight="700"
          mb={{ base: 10, md: 20 }}
          color="#E6E0F8"
        >
          IVE YouTube Metrics Dashboard
        </Heading>

        {error && (
          <Text color="red.400" mb={4}>
            {error}
          </Text>
        )}

        <Stack direction={{ base: "column", md: "row" }} spacing={4} justify="center" mb={8}>
          <Box maxW="300px">
            <ReactSelect
              options={songOptions}
              value={songOptions.find((opt) => opt.value === songA)}
              onChange={(selected) => setSongA(selected?.value || "")}
              placeholder="Type/Select Song A"
              isClearable
              styles={selectStyles}
            />
          </Box>

          <Box maxW="300px">
            <ReactSelect
              options={songOptions}
              value={songOptions.find((opt) => opt.value === songB)}
              onChange={(selected) => setSongB(selected?.value || "")}
              placeholder="Type/Select Song B"
              isClearable
              styles={selectStyles}
            />
          </Box>

          <Button
            onClick={fetchMetrics}
            isLoading={loading}
            loadingText="Loading..."
            bgGradient="linear(to-r, #A2D2FF, #FFAFCC)"
            color="#1A1625"
            fontWeight="600"
            borderRadius="12px"
          >
            Update Metrics
          </Button>
        </Stack>

        <Grid
          templateColumns={{
            base: "1fr",
            sm: "repeat(2,1fr)",
            md: "repeat(3,1fr)",
          }}
          gap={{ base: 6, md: 10 }}
          mb={12}
        >
          {songsToShow.map((song) => (
            <Box
              key={song.song}
              borderRadius="25px"
              overflow="hidden"
              bg="rgba(255,255,255,0.06)"
              boxShadow="0 8px 25px rgba(0,0,0,0.3)"
              backdropFilter="blur(8px)"
              transition="all 0.3s"
              _hover={{
                transform: "scale(1.05)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
              }}
            >
              <Image
                src={getThumbnail(song)}
                alt={song.song}
                w="100%"
                h="200px"
                objectFit="cover"
              />
              <VStack py={4}>
                <Heading fontSize="lg" color="#E6E0F8">
                  {song.song}
                </Heading>
                <Text fontSize="md" color="#CDB4DB">
                  {song.youtubeViews.toLocaleString()} views |{" "}
                  {song.youtubeLikes.toLocaleString()} likes
                </Text>
                <Button
                  as="a"
                  href={`https://www.youtube.com/watch?v=${song.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  bgGradient="linear(to-r, #A2D2FF, #FFAFCC)"
                  color="#1A1625"
                  fontWeight="600"
                  borderRadius="12px"
                  mt={2}
                >
                  Watch on YouTube
                </Button>
              </VStack>
            </Box>
          ))}
        </Grid>

        {comparisonData.length === 2 && (
          <Box bg="rgba(255,255,255,0.08)" borderRadius="20px" p={6} backdropFilter="blur(8px)">
            <Heading fontSize="xl" mb={6} color="#E6E0F8">
              Compare Two Songs
            </Heading>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="song" tick={{ fill: "#E6E0F8" }} />
                <YAxis tick={{ fill: "#E6E0F8" }} />
                <Tooltip
                  formatter={(value: unknown) =>
                    typeof value === "number" ? value.toLocaleString() : String(value)
                  }
                  contentStyle={{
                    backgroundColor: "rgba(40,40,60,0.9)",
                    borderRadius: 10,
                    border: "none",
                    color: "#fff",
                  }}
                />
                <Legend verticalAlign="top" wrapperStyle={{ color: "#E6E0F8" }} />
                <Bar dataKey="youtubeViews" fill="#B8C0FF" name="Views" radius={[10, 10, 0, 0]} />
                <Bar dataKey="youtubeLikes" fill="#FFAFCC" name="Likes" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
