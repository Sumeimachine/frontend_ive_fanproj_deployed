import { describe, expect, it } from 'vitest';
import {
  addBot,
  addPlayer,
  buildDeck,
  createRoomState,
  drawCard,
  getPlayerMatchOutcome,
  publicState,
  shouldRecordQuitLoss,
  startGame,
} from './game-engine.js';

const stableRandom = () => 0.42;

function twoPlayerRoom() {
  const room = createRoomState('ABC123', 'Host', 'peer-host', 'token-host');
  addPlayer(room, 'Friend', 'peer-friend', 'token-friend');
  startGame(room, stableRandom);
  return room;
}

describe('IVE Night game engine', () => {
  it('creates a fresh match ID at start and exposes it to every player view', () => {
    const room = twoPlayerRoom();

    expect(room.matchId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(publicState(room, room.players[0].id).matchId).toBe(room.matchId);
    expect(publicState(room, room.players[1].id).matchId).toBe(room.matchId);
  });

  it('builds only the six-member IVE pack and scales danger cards by player count', () => {
    const expectedMembers = ['gaeul', 'leeseo', 'liz', 'rei', 'wonyoung', 'yujin'];

    for (let playerCount = 2; playerCount <= 6; playerCount += 1) {
      const built = buildDeck(playerCount, stableRandom);
      const members = [...new Set(
        built.dealDeck.filter((card) => card.type === 'member').map((card) => card.kind),
      )].sort();

      expect(members).toEqual(expectedMembers);
      expect(built.crashes).toHaveLength(playerCount - 1);
    }
  });

  it('supports a solo human starting with a host-added AI rival', () => {
    const room = createRoomState('BOT123', 'Solo Host', 'peer-host', 'token-host');
    const bot = addBot(room, room.hostId);

    startGame(room, stableRandom);

    expect(room.status).toBe('playing');
    expect(bot.isBot).toBe(true);
    expect(bot.hand).toHaveLength(6);
  });

  it('keeps another player hand private', () => {
    const room = twoPlayerRoom();
    const hostView = publicState(room, room.players[0].id);

    expect(hostView.yourHand).toEqual(room.players[0].hand);
    expect(hostView.players[1].hand).toBeUndefined();
    expect(hostView.players[1].handCount).toBe(room.players[1].hand.length);
  });

  it('finishes a duel when a player draws Stage Crash without a Spotlight Pass', () => {
    const room = twoPlayerRoom();
    const host = room.players[0];
    host.hand = host.hand.filter((card) => card.kind !== 'spotlight_pass');
    room.deck = [buildDeck(2, stableRandom).crashes[0]];

    const result = drawCard(room, host.id);

    expect(result.eliminated).toBe(true);
    expect(room.status).toBe('finished');
    expect(room.winnerId).toBe(room.players[1].id);
  });

  it('marks an eliminated local player as a loss before the overall match finishes', () => {
    const room = createRoomState('LOSS01', 'Host', 'peer-host', 'token-host');
    addPlayer(room, 'Friend', 'peer-friend', 'token-friend');
    addBot(room, room.hostId);
    startGame(room, stableRandom);
    room.players[0].eliminated = true;

    expect(room.status).toBe('playing');
    expect(getPlayerMatchOutcome(publicState(room, room.players[0].id), room.players[0].id)).toBe('loss');
    expect(getPlayerMatchOutcome(publicState(room, room.players[1].id), room.players[1].id)).toBeNull();
  });

  it('records only an active, non-eliminated player who explicitly quits as a loss', () => {
    const room = twoPlayerRoom();
    const playerId = room.players[0].id;

    expect(shouldRecordQuitLoss(publicState(room, playerId), playerId)).toBe(true);

    room.players[0].eliminated = true;
    expect(shouldRecordQuitLoss(publicState(room, playerId), playerId)).toBe(false);

    room.players[0].eliminated = false;
    room.status = 'finished';
    expect(shouldRecordQuitLoss(publicState(room, playerId), playerId)).toBe(false);
  });
});
