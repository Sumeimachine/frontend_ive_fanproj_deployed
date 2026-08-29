export type CardGameOutcome = "win" | "loss";

export interface CardGameMatchStart {
  clientMatchId: string;
  playerCount: number;
}

export interface CardGameMatchResult extends CardGameMatchStart {
  outcome: CardGameOutcome;
}

export interface CardGameMatchRecord {
  clientMatchId: string;
  playerCount: number;
  startedAtUtc?: string | null;
  completedAtUtc?: string | null;
  outcome?: CardGameOutcome | null;
}

export interface CardGamePlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  recentMatches: CardGameMatchRecord[];
}
