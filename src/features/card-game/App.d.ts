import type { ComponentType } from 'react';

export interface CardGameStats {
  wins: number;
  losses: number;
  played?: number;
}

export interface MatchStartedEvent {
  matchId: string;
  playerCount: number;
}

export interface MatchFinishedEvent extends MatchStartedEvent {
  outcome: 'win' | 'loss';
}

export interface CardGameProps {
  defaultPlayerName?: string;
  stats?: CardGameStats | null;
  onMatchStarted?: (event: MatchStartedEvent) => void | Promise<void>;
  onMatchFinished?: (event: MatchFinishedEvent) => void | Promise<void>;
}

declare const CardGame: ComponentType<CardGameProps>;

export default CardGame;
