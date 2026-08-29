import { describe, expect, it, vi } from "vitest";
import {
  assertCardGameSyncSession,
  type CardGameSyncSessionToken,
} from "./api/cardGameApi";
import {
  enqueueCardGameResult,
  getCardGameResultQueueKey,
  loadQueuedCardGameResults,
  removeQueuedCardGameResult,
  syncQueuedCardGameResults,
  type CardGameQueueStorage,
} from "./cardGameResultQueue";

class MemoryStorage implements CardGameQueueStorage {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const firstResult = {
  matchId: "11111111-1111-4111-8111-111111111111",
  playerCount: 2,
  outcome: "win" as const,
};
const secondMatchId = "22222222-2222-4222-8222-222222222222";

describe("cardGameResultQueue", () => {
  it("keeps match-id keyed queues separate for each normalized user", () => {
    const storage = new MemoryStorage();

    enqueueCardGameResult("  DIVE.User  ", firstResult, storage, 20);
    enqueueCardGameResult(
      "another-user",
      { ...firstResult, matchId: secondMatchId, outcome: "loss" },
      storage,
      10,
    );

    expect(loadQueuedCardGameResults("dive.user", storage)).toEqual([
      { ...firstResult, queuedAt: 20 },
    ]);
    expect(loadQueuedCardGameResults("another-user", storage)).toEqual([
      { ...firstResult, matchId: secondMatchId, outcome: "loss", queuedAt: 10 },
    ]);

    const storedQueue = JSON.parse(
      storage.getItem(getCardGameResultQueueKey("DIVE.USER")!)!,
    ) as { results: Record<string, unknown> };
    expect(Object.keys(storedQueue.results)).toEqual([firstResult.matchId]);
  });

  it("deduplicates a match and rejects a conflicting outcome", () => {
    const storage = new MemoryStorage();

    enqueueCardGameResult("dive", firstResult, storage, 10);
    enqueueCardGameResult("dive", firstResult, storage, 99);

    expect(loadQueuedCardGameResults("dive", storage)).toEqual([
      { ...firstResult, queuedAt: 10 },
    ]);
    expect(() =>
      enqueueCardGameResult(
        "dive",
        { ...firstResult, outcome: "loss" },
        storage,
      ),
    ).toThrow("different queued outcome");
  });

  it("removes only the requested match while preserving the rest", () => {
    const storage = new MemoryStorage();
    enqueueCardGameResult("dive", firstResult, storage, 10);
    enqueueCardGameResult(
      "dive",
      { ...firstResult, matchId: secondMatchId, outcome: "loss" },
      storage,
      20,
    );

    const remaining = removeQueuedCardGameResult(
      "dive",
      firstResult.matchId,
      storage,
    );

    expect(remaining).toEqual([
      { ...firstResult, matchId: secondMatchId, outcome: "loss", queuedAt: 20 },
    ]);
  });

  it("starts before completing and removes only after stats refresh succeeds", async () => {
    const calls: string[] = [];
    const queuedResult = { ...firstResult, queuedAt: 10 };
    const removeResult = vi.fn(() => {
      calls.push("remove");
    });

    const summary = await syncQueuedCardGameResults({
      results: [queuedResult],
      startMatch: async () => {
        calls.push("start");
      },
      completeMatch: async () => {
        calls.push("complete");
      },
      refreshStats: async () => {
        calls.push("stats");
      },
      removeResult,
    });

    expect(calls).toEqual(["start", "complete", "stats", "remove"]);
    expect(summary.succeeded).toEqual([queuedResult]);
    expect(summary.failed).toEqual([]);

    removeResult.mockClear();
    const failedSummary = await syncQueuedCardGameResults({
      results: [queuedResult],
      startMatch: async () => undefined,
      completeMatch: async () => undefined,
      refreshStats: async () => {
        throw new Error("offline");
      },
      removeResult,
    });

    expect(removeResult).not.toHaveBeenCalled();
    expect(failedSummary.failed).toEqual([
      { result: queuedResult, stage: "stats" },
    ]);
  });

  it("attempts every queued completion even when an earlier result fails", async () => {
    const firstQueuedResult = { ...firstResult, queuedAt: 10 };
    const secondQueuedResult = {
      ...firstResult,
      matchId: secondMatchId,
      outcome: "loss" as const,
      queuedAt: 20,
    };
    const completedMatches: string[] = [];
    const removedMatches: string[] = [];

    const summary = await syncQueuedCardGameResults({
      results: [firstQueuedResult, secondQueuedResult],
      startMatch: async (result) => {
        if (result.matchId === firstQueuedResult.matchId) {
          throw new Error("offline");
        }
      },
      completeMatch: async (result) => {
        completedMatches.push(result.matchId);
      },
      refreshStats: async () => undefined,
      removeResult: (result) => {
        removedMatches.push(result.matchId);
      },
    });

    expect(completedMatches).toEqual([secondMatchId]);
    expect(removedMatches).toEqual([secondMatchId]);
    expect(summary.succeeded).toEqual([secondQueuedResult]);
    expect(summary.failed).toEqual([
      { result: firstQueuedResult, stage: "start" },
    ]);
  });

  it("stops an in-flight result before completion when the account generation changes", async () => {
    const queuedResult = { ...firstResult, queuedAt: 10 };
    const controller = new AbortController();
    const session: CardGameSyncSessionToken = {
      accountKey: "account:alice",
      username: "alice",
      generation: 1,
      signal: controller.signal,
    };
    let currentAccountKey = session.accountKey;
    let currentGeneration = session.generation;
    const completed = vi.fn();
    const removed = vi.fn();

    const assertCurrentSession = () =>
      assertCardGameSyncSession(session, currentAccountKey, currentGeneration);

    const summary = await syncQueuedCardGameResults({
      results: [queuedResult],
      startMatch: async () => {
        assertCurrentSession();
        currentAccountKey = "account:bob";
        currentGeneration += 1;
        controller.abort();
      },
      completeMatch: async () => {
        assertCurrentSession();
        completed();
      },
      refreshStats: async () => undefined,
      removeResult: removed,
    });

    expect(completed).not.toHaveBeenCalled();
    expect(removed).not.toHaveBeenCalled();
    expect(summary.failed).toEqual([
      { result: queuedResult, stage: "complete" },
    ]);
  });
});
