import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import CardGameFeature from "../features/card-game";
import { useAuth } from "../context/AuthContext";
import {
  assertCardGameSyncSession,
  cardGameApi,
  type CardGameSyncSessionToken,
} from "../services/api/cardGameApi";
import {
  enqueueCardGameResult,
  getCardGameResultQueueKey,
  loadQueuedCardGameResults,
  removeQueuedCardGameResult,
  syncQueuedCardGameResults,
  type QueuedCardGameResult,
} from "../services/cardGameResultQueue";
import type { CardGameOutcome, CardGamePlayerStats } from "../types/cardGame";

interface MatchStartedEvent {
  matchId: string;
  playerCount: number;
}

interface MatchFinishedEvent extends MatchStartedEvent {
  outcome: CardGameOutcome;
}

type SyncState = {
  status: "idle" | "syncing" | "success" | "error";
  message: string;
};

type CompletionRequest = {
  outcome: CardGameOutcome;
  request: Promise<void>;
};

const formatMatchDate = (value?: string | null) => {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function CardGame() {
  const { username } = useAuth();
  const accountKey = getCardGameResultQueueKey(username) ?? "";
  const [stats, setStats] = useState<CardGamePlayerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [queuedResults, setQueuedResults] = useState<QueuedCardGameResult[]>(
    [],
  );
  const [syncState, setSyncState] = useState<SyncState>({
    status: "idle",
    message: "",
  });
  const statsRequestIdRef = useRef(0);
  const startRequestsRef = useRef(new Map<string, Promise<void>>());
  const completionRequestsRef = useRef(new Map<string, CompletionRequest>());
  const queuedResultsRef = useRef<QueuedCardGameResult[]>([]);
  const queueSyncChainRef = useRef<Promise<void>>(Promise.resolve());
  const syncGenerationRef = useRef(0);
  const syncSessionRef = useRef<CardGameSyncSessionToken | null>(null);
  const currentAccountKeyRef = useRef(accountKey);
  currentAccountKeyRef.current = accountKey;

  useLayoutEffect(() => {
    const generation = syncGenerationRef.current + 1;
    syncGenerationRef.current = generation;
    const controller = new AbortController();
    const session: CardGameSyncSessionToken = {
      accountKey,
      username,
      generation,
      signal: controller.signal,
    };
    syncSessionRef.current = session;
    statsRequestIdRef.current += 1;
    startRequestsRef.current.clear();
    completionRequestsRef.current.clear();
    queuedResultsRef.current = [];
    setStats(null);
    setStatsError(null);
    setStatsLoading(true);
    setQueuedResults([]);
    setSyncState({ status: "idle", message: "" });
    queueSyncChainRef.current = Promise.resolve();

    return () => {
      controller.abort();
      if (syncSessionRef.current === session) {
        syncSessionRef.current = null;
        syncGenerationRef.current += 1;
      }
      statsRequestIdRef.current += 1;
      startRequestsRef.current.clear();
      completionRequestsRef.current.clear();
      queueSyncChainRef.current = Promise.resolve();
    };
  }, [accountKey, username]);

  const assertCurrentSyncSession = useCallback(
    (session: CardGameSyncSessionToken) => {
      assertCardGameSyncSession(
        session,
        currentAccountKeyRef.current,
        syncGenerationRef.current,
      );
    },
    [],
  );

  const isCurrentSyncSession = useCallback(
    (session: CardGameSyncSessionToken) => {
      try {
        assertCurrentSyncSession(session);
        return true;
      } catch {
        return false;
      }
    },
    [assertCurrentSyncSession],
  );

  const updateQueuedResults = useCallback((results: QueuedCardGameResult[]) => {
    queuedResultsRef.current = results;
    setQueuedResults(results);
  }, []);

  const refreshStats = useCallback(
    async (showLoading = false, session?: CardGameSyncSessionToken | null) => {
      if (session) assertCurrentSyncSession(session);
      const requestId = ++statsRequestIdRef.current;
      if (showLoading) setStatsLoading(true);

      try {
        const nextStats = await cardGameApi.getMyStats(session?.signal);
        if (session) assertCurrentSyncSession(session);
        if (statsRequestIdRef.current === requestId) {
          setStats(nextStats);
          setStatsError(null);
        }
        return nextStats;
      } catch (error) {
        if (
          (!session || isCurrentSyncSession(session)) &&
          statsRequestIdRef.current === requestId
        ) {
          setStatsError(
            "Your card-game record could not be loaded. Please try again.",
          );
        }
        throw error;
      } finally {
        if (
          (!session || isCurrentSyncSession(session)) &&
          statsRequestIdRef.current === requestId
        ) {
          setStatsLoading(false);
        }
      }
    },
    [assertCurrentSyncSession, isCurrentSyncSession],
  );

  useEffect(() => {
    const session = syncSessionRef.current;
    void refreshStats(true, session).catch(() => {
      // The page-level alert offers an explicit retry.
    });
  }, [accountKey, refreshStats]);

  const ensureMatchStarted = useCallback(
    async (
      { matchId, playerCount }: MatchStartedEvent,
      session: CardGameSyncSessionToken,
    ) => {
      assertCurrentSyncSession(session);
      const existingRequest = startRequestsRef.current.get(matchId);
      if (existingRequest) {
        await existingRequest;
        assertCurrentSyncSession(session);
        return;
      }

      const request = cardGameApi.startMatch(
        {
          clientMatchId: matchId,
          playerCount,
        },
        session.signal,
      );
      startRequestsRef.current.set(matchId, request);

      void request.catch(() => {
        if (startRequestsRef.current.get(matchId) === request) {
          startRequestsRef.current.delete(matchId);
        }
      });

      await request;
      assertCurrentSyncSession(session);
    },
    [assertCurrentSyncSession],
  );

  const ensureMatchCompleted = useCallback(
    async (
      { matchId, outcome }: MatchFinishedEvent,
      session: CardGameSyncSessionToken,
    ) => {
      assertCurrentSyncSession(session);
      const existingCompletion = completionRequestsRef.current.get(matchId);

      if (existingCompletion) {
        if (existingCompletion.outcome !== outcome) {
          throw new Error(
            "A different result is already being saved for this match.",
          );
        }

        await existingCompletion.request;
        assertCurrentSyncSession(session);
        return;
      }

      const request = cardGameApi.completeMatch(
        matchId,
        outcome,
        session.signal,
      );
      completionRequestsRef.current.set(matchId, { outcome, request });

      void request.catch(() => {
        if (completionRequestsRef.current.get(matchId)?.request === request) {
          completionRequestsRef.current.delete(matchId);
        }
      });

      await request;
      assertCurrentSyncSession(session);
    },
    [assertCurrentSyncSession],
  );

  const processQueuedResults = useCallback(
    async (session: CardGameSyncSessionToken) => {
      assertCurrentSyncSession(session);
      const results = [...queuedResultsRef.current];
      if (results.length === 0) return;

      const summary = await syncQueuedCardGameResults({
        results,
        startMatch: async (result) => {
          assertCurrentSyncSession(session);
          await ensureMatchStarted(result, session);
          assertCurrentSyncSession(session);
        },
        completeMatch: async (result) => {
          assertCurrentSyncSession(session);
          await ensureMatchCompleted(result, session);
          assertCurrentSyncSession(session);
        },
        refreshStats: async () => {
          assertCurrentSyncSession(session);
          await refreshStats(false, session);
          assertCurrentSyncSession(session);
        },
        removeResult: (result) => {
          assertCurrentSyncSession(session);
          const remainingResults = removeQueuedCardGameResult(
            session.username,
            result.matchId,
          );
          assertCurrentSyncSession(session);
          updateQueuedResults(remainingResults);
          startRequestsRef.current.delete(result.matchId);
          completionRequestsRef.current.delete(result.matchId);
        },
        onProgress: (current, total) => {
          if (isCurrentSyncSession(session)) {
            setSyncState({
              status: "syncing",
              message: `Syncing saved result ${current} of ${total}...`,
            });
          }
        },
      });
      assertCurrentSyncSession(session);

      if (summary.failed.length > 0) {
        const resultsAlreadySaved = summary.failed.every(
          ({ stage }) => stage === "stats" || stage === "remove",
        );
        setSyncState({
          status: "error",
          message: resultsAlreadySaved
            ? `${summary.failed.length} saved result${summary.failed.length === 1 ? " is" : "s are"} waiting for a stats refresh before leaving the queue.`
            : `${summary.failed.length} result${summary.failed.length === 1 ? " has" : "s have"} not synced yet. Retry when your connection is stable; replayed match IDs cannot be counted twice.`,
        });
        return;
      }

      if (summary.succeeded.length > 0) {
        setSyncState({
          status: "success",
          message: `${summary.succeeded.length} match result${summary.succeeded.length === 1 ? "" : "s"} saved. Your record is up to date.`,
        });
      }
    },
    [
      assertCurrentSyncSession,
      ensureMatchCompleted,
      ensureMatchStarted,
      isCurrentSyncSession,
      refreshStats,
      updateQueuedResults,
    ],
  );

  const scheduleQueueSync = useCallback(() => {
    const session = syncSessionRef.current;
    if (!session) return Promise.resolve();
    const scheduledSync = queueSyncChainRef.current
      .catch(() => undefined)
      .then(() => processQueuedResults(session));
    queueSyncChainRef.current = scheduledSync;
    return scheduledSync;
  }, [processQueuedResults]);

  useEffect(() => {
    const queueKey = accountKey;
    if (!queueKey) {
      updateQueuedResults([]);
      return;
    }

    const loadAndSyncQueue = () => {
      try {
        const storedResults = loadQueuedCardGameResults(username);
        updateQueuedResults(storedResults);
        if (storedResults.length > 0) {
          setSyncState({
            status: "syncing",
            message: `Retrying ${storedResults.length} saved result${storedResults.length === 1 ? "" : "s"}...`,
          });
          void scheduleQueueSync().catch(() => undefined);
        }
      } catch {
        setSyncState({
          status: "error",
          message:
            "Saved match results could not be opened in this browser. Check that local storage is enabled before playing.",
        });
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === queueKey) loadAndSyncQueue();
    };

    loadAndSyncQueue();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [accountKey, scheduleQueueSync, updateQueuedResults, username]);

  const handleMatchStarted = useCallback(
    async (event: MatchStartedEvent) => {
      const session = syncSessionRef.current;
      if (!session) return;
      try {
        assertCurrentSyncSession(session);
        await ensureMatchStarted(event, session);
      } catch {
        if (isCurrentSyncSession(session)) {
          setSyncState({
            status: "error",
            message:
              "The match started locally, but it is not synced yet. Saving the result will retry the match setup.",
          });
        }
      }
    },
    [assertCurrentSyncSession, ensureMatchStarted, isCurrentSyncSession],
  );

  const handleMatchFinished = useCallback(
    async (event: MatchFinishedEvent) => {
      const session = syncSessionRef.current;
      if (!session) return;
      try {
        assertCurrentSyncSession(session);
        const storedResults = enqueueCardGameResult(username, event);
        assertCurrentSyncSession(session);
        updateQueuedResults(storedResults);
        setSyncState({
          status: "syncing",
          message: "Result saved locally. Syncing it to your account...",
        });
        await scheduleQueueSync();
      } catch {
        if (isCurrentSyncSession(session)) {
          setSyncState({
            status: "error",
            message:
              "This result could not be placed in the durable browser queue. Enable local storage before starting another match.",
          });
        }
      }
    },
    [
      assertCurrentSyncSession,
      isCurrentSyncSession,
      scheduleQueueSync,
      updateQueuedResults,
      username,
    ],
  );

  const refreshCurrentStats = useCallback(() => {
    const session = syncSessionRef.current;
    return session ? refreshStats(true, session) : Promise.resolve(null);
  }, [refreshStats]);

  const featureStats = useMemo(
    () =>
      stats
        ? {
            wins: stats.wins,
            losses: stats.losses,
            played: stats.gamesPlayed,
          }
        : null,
    [stats],
  );

  const winRate = stats?.winRate ?? 0;

  return (
    <Box
      as="main"
      minH="100vh"
      bg="linear-gradient(135deg, #080612, #151126 52%, #251333)"
      color="white"
      p={{ base: 4, md: 8 }}
    >
      <VStack align="stretch" spacing={6} maxW="1440px" mx="auto">
        <Box>
          <Text
            color="pink.200"
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="0.14em"
          >
            IVE fan card game
          </Text>
          <Heading as="h1" size={{ base: "xl", md: "2xl" }} mt={2}>
            Play, connect, and build your record
          </Heading>
          <Text color="whiteAlpha.800" mt={3} maxW="760px" lineHeight="1.7">
            Your wins and losses are saved to your signed-in fan account.
            Multiplayer rooms still connect peer to peer.
          </Text>
        </Box>

        <Box
          as="section"
          aria-labelledby="card-game-stats-heading"
          border="1px solid"
          borderColor="whiteAlpha.300"
          borderRadius="xl"
          bg="rgba(9, 8, 20, 0.76)"
          p={{ base: 4, md: 5 }}
        >
          <HStack
            justify="space-between"
            align="start"
            gap={4}
            mb={4}
            flexWrap="wrap"
          >
            <Box>
              <Text
                color="pink.200"
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="0.12em"
              >
                Personal record
              </Text>
              <Heading as="h2" id="card-game-stats-heading" size="md" mt={1}>
                {username || "DIVE"}
              </Heading>
            </Box>
            <Button
              size="sm"
              variant="outline"
              colorScheme="purple"
              isLoading={statsLoading}
              onClick={() => void refreshCurrentStats().catch(() => undefined)}
            >
              Refresh stats
            </Button>
          </HStack>

          {statsLoading && !stats ? (
            <HStack py={6} justify="center" role="status" aria-live="polite">
              <Spinner color="purple.300" />
              <Text color="whiteAlpha.800">Loading your record...</Text>
            </HStack>
          ) : (
            <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={3}>
              <StatBox
                label="Games"
                value={(stats?.gamesPlayed ?? 0).toString()}
              />
              <StatBox
                label="Wins"
                value={(stats?.wins ?? 0).toString()}
                tone="win"
              />
              <StatBox
                label="Losses"
                value={(stats?.losses ?? 0).toString()}
                tone="loss"
              />
              <StatBox label="Win rate" value={`${winRate.toFixed(1)}%`} />
            </SimpleGrid>
          )}

          {statsError && (
            <Alert
              status="warning"
              mt={4}
              borderRadius="md"
              bg="rgba(180, 83, 9, 0.28)"
              color="white"
            >
              <AlertIcon />
              <HStack justify="space-between" flex="1" gap={4} flexWrap="wrap">
                <Text>{statsError}</Text>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void refreshCurrentStats().catch(() => undefined)
                  }
                >
                  Try again
                </Button>
              </HStack>
            </Alert>
          )}

          {!!stats?.recentMatches.length && (
            <Box mt={5}>
              <Text
                color="whiteAlpha.700"
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="0.1em"
                mb={2}
              >
                Recent results
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                {stats.recentMatches.slice(0, 8).map((match) => (
                  <Badge
                    key={match.clientMatchId}
                    colorScheme={
                      match.outcome === "win"
                        ? "green"
                        : match.outcome === "loss"
                          ? "pink"
                          : "purple"
                    }
                    borderRadius="full"
                    px={3}
                    py={1.5}
                    title={formatMatchDate(
                      match.completedAtUtc ?? match.startedAtUtc,
                    )}
                  >
                    {match.outcome ?? "in progress"}
                  </Badge>
                ))}
              </HStack>
            </Box>
          )}
        </Box>

        {syncState.status !== "idle" && (
          <Alert
            status={
              syncState.status === "success"
                ? "success"
                : syncState.status === "error"
                  ? "error"
                  : "info"
            }
            borderRadius="md"
            role="status"
            aria-live="polite"
          >
            <AlertIcon />
            <HStack justify="space-between" flex="1" gap={4} flexWrap="wrap">
              <Text>{syncState.message}</Text>
              {syncState.status === "error" && queuedResults.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void scheduleQueueSync().catch(() => undefined)
                  }
                >
                  Retry{" "}
                  {queuedResults.length === 1
                    ? "result"
                    : `${queuedResults.length} results`}
                </Button>
              )}
            </HStack>
          </Alert>
        )}

        <Box
          as="section"
          aria-label="Card game table"
          borderRadius="xl"
          overflow="hidden"
          border="1px solid"
          borderColor="whiteAlpha.300"
          bg="#080612"
        >
          <CardGameFeature
            defaultPlayerName={username || "DIVE"}
            stats={featureStats}
            onMatchStarted={handleMatchStarted}
            onMatchFinished={handleMatchFinished}
          />
        </Box>
      </VStack>
    </Box>
  );
}

function StatBox({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "win" | "loss";
}) {
  const valueColor =
    tone === "win" ? "green.200" : tone === "loss" ? "pink.200" : "white";

  return (
    <Box
      border="1px solid"
      borderColor="whiteAlpha.200"
      bg="rgba(255,255,255,0.07)"
      borderRadius="md"
      p={3}
    >
      <Text
        color="whiteAlpha.700"
        fontSize="xs"
        textTransform="uppercase"
        letterSpacing="0.1em"
      >
        {label}
      </Text>
      <Text color={valueColor} fontSize="2xl" fontWeight="bold">
        {value}
      </Text>
    </Box>
  );
}
