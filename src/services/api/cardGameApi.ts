import httpClient from "../httpClient";
import type {
  CardGameMatchRecord,
  CardGameMatchStart,
  CardGameOutcome,
  CardGamePlayerStats,
} from "../../types/cardGame";

export interface CardGameSyncSessionToken {
  accountKey: string;
  username: string;
  generation: number;
  signal: AbortSignal;
}

export const assertCardGameSyncSession = (
  session: CardGameSyncSessionToken,
  currentAccountKey: string,
  currentGeneration: number,
) => {
  if (
    session.signal.aborted ||
    session.accountKey !== currentAccountKey ||
    session.generation !== currentGeneration
  ) {
    const error = new Error("The card-game sync account changed.");
    error.name = "AbortError";
    throw error;
  }
};

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;

const readValue = (record: UnknownRecord, ...keys: string[]) => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }

  return undefined;
};

const readNumber = (record: UnknownRecord, ...keys: string[]) => {
  const value = readValue(record, ...keys);
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const readString = (record: UnknownRecord, ...keys: string[]) => {
  const value = readValue(record, ...keys);
  return typeof value === "string" ? value : undefined;
};

const readOutcome = (record: UnknownRecord): CardGameOutcome | null => {
  const outcome = readString(record, "outcome", "Outcome")?.toLowerCase();
  return outcome === "win" || outcome === "loss" ? outcome : null;
};

const normalizeMatch = (value: unknown): CardGameMatchRecord | null => {
  const match = asRecord(value);
  if (!match) return null;

  const clientMatchId = readString(
    match,
    "clientMatchId",
    "ClientMatchId",
    "matchId",
    "MatchId",
  );
  if (!clientMatchId) return null;

  return {
    clientMatchId,
    playerCount: Math.max(
      0,
      Math.trunc(readNumber(match, "playerCount", "PlayerCount") ?? 0),
    ),
    startedAtUtc:
      readString(
        match,
        "startedAtUtc",
        "StartedAtUtc",
        "startedAt",
        "StartedAt",
      ) ?? null,
    completedAtUtc:
      readString(
        match,
        "completedAtUtc",
        "CompletedAtUtc",
        "completedAt",
        "CompletedAt",
      ) ?? null,
    outcome: readOutcome(match),
  };
};

const normalizeStats = (value: unknown): CardGamePlayerStats => {
  const response = asRecord(value) ?? {};
  const stats =
    asRecord(readValue(response, "stats", "Stats", "data", "Data")) ?? response;
  const wins = Math.max(0, Math.trunc(readNumber(stats, "wins", "Wins") ?? 0));
  const losses = Math.max(
    0,
    Math.trunc(readNumber(stats, "losses", "Losses") ?? 0),
  );
  const gamesPlayed = Math.max(
    wins + losses,
    Math.trunc(
      readNumber(stats, "gamesPlayed", "GamesPlayed", "played", "Played") ??
        wins + losses,
    ),
  );
  const recentMatchesValue = readValue(
    stats,
    "recentMatches",
    "RecentMatches",
    "matches",
    "Matches",
  );
  const recentMatches = Array.isArray(recentMatchesValue)
    ? recentMatchesValue
        .map(normalizeMatch)
        .filter((match): match is CardGameMatchRecord => match !== null)
    : [];

  return {
    gamesPlayed,
    wins,
    losses,
    winRate: Math.min(
      100,
      Math.max(0, readNumber(stats, "winRate", "WinRate") ?? 0),
    ),
    recentMatches,
  };
};

export const cardGameApi = {
  startMatch: async (
    { clientMatchId, playerCount }: CardGameMatchStart,
    signal?: AbortSignal,
  ) => {
    await httpClient.post(
      "/card-game/matches",
      { clientMatchId, playerCount },
      { signal },
    );
  },

  completeMatch: async (
    clientMatchId: string,
    outcome: CardGameOutcome,
    signal?: AbortSignal,
  ) => {
    await httpClient.post(
      `/card-game/matches/${encodeURIComponent(clientMatchId)}/complete`,
      {
        outcome,
      },
      { signal },
    );
  },

  getMyStats: async (signal?: AbortSignal) => {
    const { data } = await httpClient.get<unknown>("/card-game/stats/me", {
      signal,
    });
    return normalizeStats(data);
  },
};
