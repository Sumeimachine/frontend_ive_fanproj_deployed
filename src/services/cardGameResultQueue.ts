import type { CardGameOutcome } from "../types/cardGame";

const queueStoragePrefix = "ive-card-game:pending-results:v1:";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface QueuedCardGameResult {
  matchId: string;
  playerCount: number;
  outcome: CardGameOutcome;
  queuedAt: number;
}

export interface CardGameQueueStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

interface StoredCardGameQueue {
  version: 1;
  results: Record<string, QueuedCardGameResult>;
}

interface QueueSyncOptions {
  results: QueuedCardGameResult[];
  startMatch: (result: QueuedCardGameResult) => Promise<void>;
  completeMatch: (result: QueuedCardGameResult) => Promise<void>;
  refreshStats: () => Promise<void>;
  removeResult: (result: QueuedCardGameResult) => Promise<void> | void;
  onProgress?: (current: number, total: number) => void;
}

export interface QueueSyncFailure {
  result: QueuedCardGameResult;
  stage: "start" | "complete" | "stats" | "remove";
}

export interface QueueSyncSummary {
  succeeded: QueuedCardGameResult[];
  failed: QueueSyncFailure[];
}

const resolveStorage = (storage?: CardGameQueueStorage) => {
  if (storage) return storage;
  if (typeof window === "undefined") {
    throw new Error("Card-game result storage is unavailable.");
  }

  return window.localStorage;
};

const normalizeUsername = (username: string) =>
  username.trim().normalize("NFKC").toLocaleLowerCase("en-US");

export const getCardGameResultQueueKey = (username: string) => {
  const normalizedUsername = normalizeUsername(username);
  return normalizedUsername
    ? `${queueStoragePrefix}${encodeURIComponent(normalizedUsername)}`
    : null;
};

const isQueuedResult = (value: unknown): value is QueuedCardGameResult => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const result = value as Record<string, unknown>;
  return (
    typeof result.matchId === "string" &&
    uuidPattern.test(result.matchId) &&
    typeof result.playerCount === "number" &&
    Number.isInteger(result.playerCount) &&
    result.playerCount >= 2 &&
    result.playerCount <= 6 &&
    (result.outcome === "win" || result.outcome === "loss") &&
    typeof result.queuedAt === "number" &&
    Number.isFinite(result.queuedAt) &&
    result.queuedAt >= 0
  );
};

const emptyQueue = (): StoredCardGameQueue => ({ version: 1, results: {} });

const readQueue = (
  username: string,
  storage?: CardGameQueueStorage,
): StoredCardGameQueue => {
  const key = getCardGameResultQueueKey(username);
  if (!key) return emptyQueue();

  const rawQueue = resolveStorage(storage).getItem(key);
  if (!rawQueue) return emptyQueue();

  try {
    const parsed = JSON.parse(rawQueue) as {
      version?: unknown;
      results?: unknown;
    };
    if (
      parsed.version !== 1 ||
      parsed.results === null ||
      typeof parsed.results !== "object" ||
      Array.isArray(parsed.results)
    ) {
      return emptyQueue();
    }

    const results = Object.entries(parsed.results).reduce<
      Record<string, QueuedCardGameResult>
    >((validResults, [matchId, value]) => {
      if (isQueuedResult(value) && value.matchId === matchId) {
        validResults[matchId] = value;
      }
      return validResults;
    }, {});

    return { version: 1, results };
  } catch {
    return emptyQueue();
  }
};

const writeQueue = (
  username: string,
  queue: StoredCardGameQueue,
  storage?: CardGameQueueStorage,
) => {
  const key = getCardGameResultQueueKey(username);
  if (!key) {
    throw new Error("A signed-in username is required to save game results.");
  }

  const resolvedStorage = resolveStorage(storage);
  if (Object.keys(queue.results).length === 0) {
    resolvedStorage.removeItem(key);
    return;
  }

  resolvedStorage.setItem(key, JSON.stringify(queue));
};

const sortQueuedResults = (results: QueuedCardGameResult[]) =>
  results.sort(
    (left, right) =>
      left.queuedAt - right.queuedAt ||
      left.matchId.localeCompare(right.matchId),
  );

export const loadQueuedCardGameResults = (
  username: string,
  storage?: CardGameQueueStorage,
) => sortQueuedResults(Object.values(readQueue(username, storage).results));

export const enqueueCardGameResult = (
  username: string,
  result: Omit<QueuedCardGameResult, "queuedAt">,
  storage?: CardGameQueueStorage,
  queuedAt = Date.now(),
) => {
  const queue = readQueue(username, storage);
  const existingResult = queue.results[result.matchId];
  const queuedResult = { ...result, queuedAt };

  if (!isQueuedResult(queuedResult)) {
    throw new Error("The card-game result is not valid for local storage.");
  }

  if (existingResult && existingResult.outcome !== result.outcome) {
    throw new Error("This match already has a different queued outcome.");
  }

  queue.results[result.matchId] = existingResult ?? queuedResult;
  writeQueue(username, queue, storage);
  return sortQueuedResults(Object.values(queue.results));
};

export const removeQueuedCardGameResult = (
  username: string,
  matchId: string,
  storage?: CardGameQueueStorage,
) => {
  const queue = readQueue(username, storage);
  delete queue.results[matchId];
  writeQueue(username, queue, storage);
  return sortQueuedResults(Object.values(queue.results));
};

export const syncQueuedCardGameResults = async ({
  results,
  startMatch,
  completeMatch,
  refreshStats,
  removeResult,
  onProgress,
}: QueueSyncOptions): Promise<QueueSyncSummary> => {
  const succeeded: QueuedCardGameResult[] = [];
  const failed: QueueSyncFailure[] = [];

  for (const [index, result] of results.entries()) {
    onProgress?.(index + 1, results.length);
    let stage: QueueSyncFailure["stage"] = "start";

    try {
      await startMatch(result);
      stage = "complete";
      await completeMatch(result);
      stage = "stats";
      await refreshStats();
      stage = "remove";
      await removeResult(result);
      succeeded.push(result);
    } catch {
      failed.push({ result, stage });
    }
  }

  return { succeeded, failed };
};
