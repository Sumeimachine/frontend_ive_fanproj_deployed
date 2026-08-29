import { DEFAULT_GROUP_ID, GROUP_BY_ID, getGroup } from './gameData.js';

export const MAX_PLAYERS = 6;
export const MIN_PLAYERS = 2;
export const BOT_NAMES = ['Nova', 'Miso', 'Lumi', 'Echo', 'Pixel'];

const ACTIONS = {
  spotlight_pass: {
    label: 'Spotlight Pass',
    description: 'Cancel the crash, reinsert it, and look completely innocent.',
  },
  soundcheck_skip: {
    label: 'Soundcheck Skip',
    description: 'Skip one owed draw like an awkward encore request.',
  },
  double_take: {
    label: 'Double Take',
    description: 'Next player owes one extra turn. Friendship is on hiatus.',
  },
  setlist_shuffle: {
    label: 'Setlist Shuffle',
    description: 'Remix the deck until everybody’s confidence is fictional.',
  },
  crystal_ball: {
    label: 'Crystal Ball',
    description: 'Peek at the next three. Spoilers, but make it fashion.',
  },
  fan_request: {
    label: 'Fan Request',
    description: 'Steal one random card. Smile sweetly for the fancam.',
  },
  stage_crash: {
    label: 'Stage Crash',
    description: 'No Spotlight Pass? Exit with full mic-drop dignity.',
  },
};

function makeCard(kind, type, extra = {}) {
  const action = ACTIONS[kind];
  return {
    id: globalThis.crypto.randomUUID(),
    kind,
    type,
    label: action?.label ?? extra.label,
    description: action?.description ?? extra.description,
    ...extra,
  };
}

export function shuffle(input, random = Math.random) {
  const cards = [...input];
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [cards[index], cards[target]] = [cards[target], cards[index]];
  }
  return cards;
}

function copies(kind, type, count) {
  return Array.from({ length: count }, () => makeCard(kind, type));
}

export function buildDeck(playerCount, random = Math.random, groupId = DEFAULT_GROUP_ID) {
  const group = getGroup(groupId);
  const actionScale = playerCount >= 5 ? 1 : 0;
  const memberCopies = playerCount >= 5 ? 5 : 4;
  const actionDeck = [
    ...copies('soundcheck_skip', 'action', 5 + actionScale),
    ...copies('double_take', 'action', 4 + actionScale),
    ...copies('setlist_shuffle', 'action', 4 + actionScale),
    ...copies('crystal_ball', 'action', 5 + actionScale),
    ...copies('fan_request', 'action', 4 + actionScale),
  ];

  for (const member of group.members) {
    for (let index = 0; index < memberCopies; index += 1) {
      actionDeck.push(
        makeCard(member.id, 'member', {
          label: member.name,
          description: `${member.flavor} Pair two copies to steal a random card.`,
        }),
      );
    }
  }

  return {
    dealDeck: shuffle(actionDeck, random),
    passes: copies('spotlight_pass', 'defuse', playerCount + 2),
    crashes: copies('stage_crash', 'danger', playerCount - 1),
  };
}

export function createRoomState(
  code,
  hostName,
  hostSocketId,
  sessionToken = globalThis.crypto.randomUUID(),
  groupId = DEFAULT_GROUP_ID,
) {
  const host = {
    id: globalThis.crypto.randomUUID(),
    token: sessionToken,
    socketId: hostSocketId,
    name: cleanName(hostName),
    connected: true,
    isBot: false,
    eliminated: false,
    hand: [],
  };

  return {
    code,
    matchId: null,
    groupId: getGroup(groupId).id,
    hostId: host.id,
    status: 'lobby',
    maxPlayers: MAX_PLAYERS,
    players: [host],
    deck: [],
    discard: [],
    currentPlayerId: null,
    turnsLeft: 1,
    pendingDefuse: null,
    winnerId: null,
    log: [`${host.name} opened the backstage room.`],
    updatedAt: Date.now(),
  };
}

export function addPlayer(room, name, socketId, sessionToken = globalThis.crypto.randomUUID()) {
  if (room.status !== 'lobby') throw new Error('This performance has already started.');
  if (room.players.length >= room.maxPlayers) throw new Error('This room is full.');
  const player = {
    id: globalThis.crypto.randomUUID(),
    token: sessionToken,
    socketId,
    name: cleanName(name),
    connected: true,
    isBot: false,
    eliminated: false,
    hand: [],
  };
  room.players.push(player);
  room.log.push(`${player.name} joined the lineup.`);
  room.updatedAt = Date.now();
  return player;
}

export function addBot(room, hostId) {
  if (room.hostId !== hostId) throw new Error('Only the room host can add an AI player.');
  if (room.status !== 'lobby') throw new Error('AI players can only join before the game.');
  if (room.players.length >= room.maxPlayers) throw new Error('This room is full.');
  const usedNames = new Set(room.players.filter((player) => player.isBot).map((player) => player.name));
  const baseName = BOT_NAMES.find((name) => !usedNames.has(name)) ?? `AI ${usedNames.size + 1}`;
  const bot = {
    id: globalThis.crypto.randomUUID(),
    token: `bot-${globalThis.crypto.randomUUID()}`,
    socketId: null,
    name: baseName,
    connected: true,
    isBot: true,
    eliminated: false,
    hand: [],
  };
  room.players.push(bot);
  room.log.push(`${bot.name} joined as an AI rival.`);
  room.updatedAt = Date.now();
  return bot;
}

export function startGame(room, random = Math.random) {
  const connectedPlayers = room.players.filter((player) => player.connected);
  if (room.status !== 'lobby') throw new Error('The game has already started.');
  if (connectedPlayers.length < MIN_PLAYERS) throw new Error('At least two players are required.');
  if (connectedPlayers.length !== room.players.length) {
    throw new Error('Remove disconnected players before starting.');
  }

  const built = buildDeck(room.players.length, random, room.groupId);
  room.matchId = globalThis.crypto.randomUUID();
  for (const player of room.players) {
    player.eliminated = false;
    player.hand = [built.passes.pop()];
    for (let count = 0; count < 5; count += 1) {
      player.hand.push(built.dealDeck.pop());
    }
  }

  room.deck = shuffle([...built.dealDeck, ...built.passes, ...built.crashes], random);
  room.discard = [];
  room.status = 'playing';
  room.currentPlayerId = room.players[0].id;
  room.turnsLeft = 1;
  room.pendingDefuse = null;
  room.winnerId = null;
  room.log = [`The lights are on. ${room.players[0].name} goes first.`];
  room.updatedAt = Date.now();
  return room;
}

export function setRoomGroup(room, hostId, groupId) {
  if (room.hostId !== hostId) throw new Error('Only the room host can choose the artist pack.');
  if (room.status !== 'lobby') throw new Error('The artist pack is locked after the game starts.');
  if (!GROUP_BY_ID[groupId]) throw new Error('That artist pack is not available.');
  room.groupId = groupId;
  room.log.push(`${getGroup(groupId).name} is now headlining.`);
  room.updatedAt = Date.now();
}

function currentPlayer(room) {
  return room.players.find((player) => player.id === room.currentPlayerId);
}

function assertTurn(room, playerId) {
  if (room.status !== 'playing') throw new Error('The game is not active.');
  if (room.currentPlayerId !== playerId) throw new Error('Wait for your turn.');
  if (room.pendingDefuse) throw new Error('Place the Stage Crash back first.');
  const player = currentPlayer(room);
  if (!player || player.eliminated) throw new Error('You are no longer on stage.');
  return player;
}

function activePlayers(room) {
  return room.players.filter((player) => !player.eliminated);
}

function nextActivePlayer(room, fromId) {
  const start = room.players.findIndex((player) => player.id === fromId);
  for (let offset = 1; offset <= room.players.length; offset += 1) {
    const candidate = room.players[(start + offset) % room.players.length];
    if (!candidate.eliminated) return candidate;
  }
  return null;
}

function finishIfNeeded(room) {
  const active = activePlayers(room);
  if (active.length === 1) {
    room.status = 'finished';
    room.winnerId = active[0].id;
    room.currentPlayerId = null;
    room.log.push(`${active[0].name} owns the final spotlight!`);
    return true;
  }
  return false;
}

function advanceTurn(room, fromId, pressure = 1) {
  if (finishIfNeeded(room)) return;
  const next = nextActivePlayer(room, fromId);
  room.currentPlayerId = next.id;
  room.turnsLeft = Math.max(1, pressure);
  room.log.push(`${next.name} is up${pressure > 1 ? ` for ${pressure} turns` : ''}.`);
}

function discardCards(room, player, cardIds) {
  const selected = cardIds.map((cardId) => player.hand.find((card) => card.id === cardId));
  if (selected.some((card) => !card)) throw new Error('One of those cards is no longer in your hand.');
  player.hand = player.hand.filter((card) => !cardIds.includes(card.id));
  room.discard.push(...selected);
  return selected;
}

function randomSteal(room, player, targetId, random = Math.random) {
  const target = room.players.find((candidate) => candidate.id === targetId);
  if (!target || target.eliminated || target.id === player.id) throw new Error('Choose another active player.');
  if (target.hand.length === 0) throw new Error(`${target.name} has no cards to take.`);
  const index = Math.floor(random() * target.hand.length);
  const [stolen] = target.hand.splice(index, 1);
  player.hand.push(stolen);
  return { target, stolen };
}

export function playCards(room, playerId, cardIds, targetId, random = Math.random) {
  const player = assertTurn(room, playerId);
  if (!Array.isArray(cardIds) || cardIds.length < 1) throw new Error('Choose a card to play.');
  const cards = cardIds.map((id) => player.hand.find((card) => card.id === id));
  if (cards.some((card) => !card)) throw new Error('Card not found.');

  if (cards.length === 2) {
    if (cards.some((card) => card.type !== 'member') || cards[0].kind !== cards[1].kind) {
      throw new Error('A steal combo needs two matching member cards.');
    }
    discardCards(room, player, cardIds);
    const { target } = randomSteal(room, player, targetId, random);
    room.log.push(`${player.name} played a ${cards[0].label} duo and took a card from ${target.name}.`);
    room.updatedAt = Date.now();
    return { privateMessage: 'A mystery card joined your hand.' };
  }

  if (cards.length !== 1 || cards[0].type !== 'action') {
    throw new Error('Play one action card or a matching member pair.');
  }

  const card = cards[0];
  if (card.kind === 'fan_request') {
    const { target } = randomSteal(room, player, targetId, random);
    discardCards(room, player, cardIds);
    room.log.push(`${player.name} made a Fan Request to ${target.name}.`);
  } else {
    discardCards(room, player, cardIds);
    if (card.kind === 'soundcheck_skip') {
      room.log.push(`${player.name} skipped one soundcheck.`);
      room.turnsLeft -= 1;
      if (room.turnsLeft <= 0) advanceTurn(room, player.id, 1);
    } else if (card.kind === 'double_take') {
      const inheritedPressure = room.turnsLeft + 1;
      room.log.push(`${player.name} called a Double Take.`);
      advanceTurn(room, player.id, inheritedPressure);
    } else if (card.kind === 'setlist_shuffle') {
      room.deck = shuffle(room.deck, random);
      room.log.push(`${player.name} remixed the setlist.`);
    } else if (card.kind === 'crystal_ball') {
      room.log.push(`${player.name} checked the Crystal Ball.`);
    }
  }

  room.updatedAt = Date.now();
  const result = {};
  if (card.kind === 'crystal_ball') {
    result.peek = room.deck.slice(0, 3).map((nextCard) => ({
      kind: nextCard.kind,
      type: nextCard.type,
      label: nextCard.label,
      description: nextCard.description,
    }));
  }
  if (card.kind === 'fan_request') result.privateMessage = 'A random card was added to your hand.';
  return result;
}

export function drawCard(room, playerId) {
  const player = assertTurn(room, playerId);
  if (room.deck.length === 0) throw new Error('The deck is empty.');
  const card = room.deck.shift();

  if (card.type === 'danger') {
    const passIndex = player.hand.findIndex((held) => held.kind === 'spotlight_pass');
    if (passIndex >= 0) {
      const [pass] = player.hand.splice(passIndex, 1);
      room.discard.push(pass);
      room.pendingDefuse = { playerId: player.id, card };
      room.log.push(`${player.name} hit a Stage Crash—and flashed a Spotlight Pass.`);
      room.updatedAt = Date.now();
      return { danger: true, defused: true };
    }

    player.eliminated = true;
    room.discard.push(card);
    room.log.push(`${player.name} was caught in a Stage Crash and left the stage.`);
    if (!finishIfNeeded(room)) advanceTurn(room, player.id, 1);
    room.updatedAt = Date.now();
    return { danger: true, eliminated: true };
  }

  player.hand.push(card);
  room.log.push(`${player.name} drew a card.`);
  room.turnsLeft -= 1;
  if (room.turnsLeft <= 0) advanceTurn(room, player.id, 1);
  room.updatedAt = Date.now();
  return { card };
}

export function reinsertDanger(room, playerId, position) {
  if (!room.pendingDefuse || room.pendingDefuse.playerId !== playerId) {
    throw new Error('There is no Stage Crash waiting for you.');
  }
  const safePosition = Math.max(0, Math.min(room.deck.length, Number(position)));
  room.deck.splice(safePosition, 0, room.pendingDefuse.card);
  room.pendingDefuse = null;
  const player = room.players.find((candidate) => candidate.id === playerId);
  room.log.push(`${player.name} hid the Stage Crash back in the deck.`);
  room.turnsLeft -= 1;
  if (room.turnsLeft <= 0) advanceTurn(room, playerId, 1);
  room.updatedAt = Date.now();
}

function randomItem(items, random) {
  return items[Math.floor(random() * items.length)];
}

export function takeBotTurn(room, botId, random = Math.random) {
  const bot = room.players.find((player) => player.id === botId);
  if (!bot?.isBot) throw new Error('That player is not an AI opponent.');
  if (room.status !== 'playing' || room.currentPlayerId !== bot.id || bot.eliminated) {
    throw new Error('The AI is not currently on stage.');
  }

  if (room.pendingDefuse) {
    if (room.pendingDefuse.playerId !== bot.id) throw new Error('Another player must place the Stage Crash.');
    const position = Math.floor(random() * (room.deck.length + 1));
    reinsertDanger(room, bot.id, position);
    return { action: 'reinsert', position };
  }

  const targets = room.players.filter(
    (player) => player.id !== bot.id && !player.eliminated && player.hand.length > 0,
  );
  const target = targets.length ? randomItem(targets, random) : null;

  if (target) {
    const memberGroups = new Map();
    for (const card of bot.hand.filter((held) => held.type === 'member')) {
      const held = memberGroups.get(card.kind) ?? [];
      held.push(card);
      memberGroups.set(card.kind, held);
    }
    const pair = [...memberGroups.values()].find((cards) => cards.length >= 2);
    if (pair && random() < 0.52) {
      playCards(room, bot.id, [pair[0].id, pair[1].id], target.id, random);
      return { action: 'pair', targetId: target.id };
    }

    const request = bot.hand.find((card) => card.kind === 'fan_request');
    if (request && random() < 0.34) {
      playCards(room, bot.id, [request.id], target.id, random);
      return { action: 'fan_request', targetId: target.id };
    }
  }

  const attack = bot.hand.find((card) => card.kind === 'double_take');
  if (attack && random() < 0.46) {
    playCards(room, bot.id, [attack.id], undefined, random);
    return { action: 'double_take' };
  }

  const skip = bot.hand.find((card) => card.kind === 'soundcheck_skip');
  if (skip && (room.turnsLeft > 1 || random() < 0.22)) {
    playCards(room, bot.id, [skip.id], undefined, random);
    return { action: 'soundcheck_skip' };
  }

  const shuffleCard = bot.hand.find((card) => card.kind === 'setlist_shuffle');
  if (shuffleCard && random() < 0.14) {
    playCards(room, bot.id, [shuffleCard.id], undefined, random);
    return { action: 'setlist_shuffle' };
  }

  const peek = bot.hand.find((card) => card.kind === 'crystal_ball');
  if (peek && random() < 0.1) {
    playCards(room, bot.id, [peek.id], undefined, random);
    return { action: 'crystal_ball' };
  }

  const result = drawCard(room, bot.id);
  return { action: 'draw', ...result };
}

export function removePlayer(room, hostId, targetId) {
  if (room.hostId !== hostId) throw new Error('Only the room host can change the lineup.');
  if (room.status !== 'lobby') throw new Error('Players can only be removed before the game.');
  if (targetId === hostId) throw new Error('The host cannot remove themselves.');
  const index = room.players.findIndex((player) => player.id === targetId);
  if (index < 0) throw new Error('Player not found.');
  const [removed] = room.players.splice(index, 1);
  room.log.push(`${removed.name} left the lineup.`);
  room.updatedAt = Date.now();
}

export function eliminateDisconnectedCurrent(room, hostId) {
  if (room.hostId !== hostId) throw new Error('Only the host can manage a disconnected turn.');
  const player = currentPlayer(room);
  if (!player || player.connected) throw new Error('The current player is still connected.');
  player.eliminated = true;
  room.log.push(`${player.name} disconnected and was removed from the stage.`);
  room.pendingDefuse = null;
  if (!finishIfNeeded(room)) advanceTurn(room, player.id, 1);
  room.updatedAt = Date.now();
}

export function cleanName(value) {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, 18);
  if (name.length < 2) throw new Error('Use a name with at least two characters.');
  return name;
}

export function getPlayerMatchOutcome(state, playerId) {
  const player = state?.players?.find((candidate) => candidate.id === playerId);
  if (!player) return null;
  if (state.winnerId === playerId) return 'win';
  if (player.eliminated || state.status === 'finished') return 'loss';
  return null;
}

export function shouldRecordQuitLoss(state, playerId) {
  const player = state?.players?.find((candidate) => candidate.id === playerId);
  return Boolean(state?.matchId && state.status === 'playing' && player && !player.eliminated);
}

export function publicState(room, viewerId) {
  const viewer = room.players.find((player) => player.id === viewerId);
  return {
    code: room.code,
    matchId: room.matchId ?? null,
    groupId: room.groupId ?? DEFAULT_GROUP_ID,
    status: room.status,
    maxPlayers: room.maxPlayers,
    hostId: room.hostId,
    players: room.players.map((player) => ({
      id: player.id,
      peerId: player.socketId,
      name: player.name,
      connected: player.connected,
      isBot: Boolean(player.isBot),
      eliminated: player.eliminated,
      handCount: player.hand.length,
    })),
    currentPlayerId: room.currentPlayerId,
    turnsLeft: room.turnsLeft,
    deckCount: room.deck.length,
    discardTop: room.discard.at(-1) ?? null,
    log: room.log.slice(-12).reverse(),
    winnerId: room.winnerId,
    hostPeerId: room.players.find((player) => player.id === room.hostId)?.socketId ?? null,
    yourId: viewerId,
    yourHand: viewer?.hand ?? [],
    pendingDefuse:
      room.pendingDefuse?.playerId === viewerId
        ? { deckLength: room.deck.length }
        : null,
    updatedAt: room.updatedAt,
  };
}
