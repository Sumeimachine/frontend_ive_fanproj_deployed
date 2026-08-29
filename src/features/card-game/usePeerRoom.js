import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addBot,
  addPlayer,
  createRoomState,
  drawCard,
  eliminateDisconnectedCurrent,
  playCards,
  publicState,
  reinsertDanger,
  removePlayer,
  setRoomGroup,
  startGame,
  takeBotTurn,
} from './game-engine.js';

// Keep this IVE-only edition isolated from the original multi-pack prototype.
const APP_ID = 'ive-fan-hub-night-card-game-v1';
const ACTIVE_SESSION_KEY = 'ive-fan-hub-card-game-active-session';
const HOST_SNAPSHOT_PREFIX = 'ive-fan-hub-card-game-host-';

function createToken() {
  return globalThis.crypto.randomUUID();
}

function normalizeCode(value) {
  return String(value ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

function loadSnapshot(code) {
  try {
    const parsed = JSON.parse(localStorage.getItem(`${HOST_SNAPSHOT_PREFIX}${code}`));
    if (!parsed || Date.now() - parsed.updatedAt > 1000 * 60 * 60 * 6) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSnapshot(room) {
  localStorage.setItem(`${HOST_SNAPSHOT_PREFIX}${room.code}`, JSON.stringify(room));
}

export function loadActiveSession() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_SESSION_KEY));
  } catch {
    return null;
  }
}

export function generateRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

export function usePeerRoom() {
  const [roomState, setRoomState] = useState(null);
  const [networkStatus, setNetworkStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [peek, setPeek] = useState(null);
  const transportRef = useRef(null);
  const authoritativeRef = useRef(null);
  const sessionRef = useRef(null);
  const selfIdRef = useRef(null);
  const hostPeerIdRef = useRef(null);
  const joinTimerRef = useRef(null);

  const closeTransport = useCallback(() => {
    clearTimeout(joinTimerRef.current);
    transportRef.current?.room.leave();
    transportRef.current = null;
    authoritativeRef.current = null;
    setRoomState(null);
    setNetworkStatus('idle');
  }, []);

  useEffect(() => () => closeTransport(), [closeTransport]);

  const emitAll = useCallback(() => {
    const room = authoritativeRef.current;
    const transport = transportRef.current;
    if (!room || !transport) return;

    const host = room.players.find((player) => player.id === room.hostId);
    const ownState = publicState(room, host.id);
    setRoomState(ownState);
    saveSnapshot(room);

    for (const player of room.players) {
      if (player.id === host.id || !player.connected || !player.socketId) continue;
      transport.state.send(publicState(room, player.id), { target: player.socketId }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const room = authoritativeRef.current;
    if (!room || room.status !== 'playing') return undefined;
    const bot = room.players.find((player) => player.id === room.currentPlayerId);
    if (!bot?.isBot || bot.eliminated) return undefined;

    const timer = setTimeout(() => {
      try {
        takeBotTurn(room, bot.id);
        emitAll();
      } catch (error) {
        setMessage(`AI turn paused: ${error.message}`);
      }
    }, 850);

    return () => clearTimeout(timer);
  }, [roomState?.updatedAt, emitAll]);

  const hostCommand = useCallback(
    (type, payload = {}, peerId = selfIdRef.current) => {
      const room = authoritativeRef.current;
      const transport = transportRef.current;
      if (!room || !transport) throw new Error('The room is not ready.');
      const player = room.players.find((candidate) => candidate.socketId === peerId);
      if (!player) throw new Error('Your seat is not registered in this room.');

      let result = {};
      if (type === 'start') {
        if (room.hostId !== player.id) throw new Error('Only the room host can start the game.');
        startGame(room);
      } else if (type === 'set-group') {
        setRoomGroup(room, player.id, payload.groupId);
      } else if (type === 'add-bot') {
        addBot(room, player.id);
      } else if (type === 'play') {
        result = playCards(room, player.id, payload.cardIds, payload.targetId);
      } else if (type === 'draw') {
        result = drawCard(room, player.id);
      } else if (type === 'reinsert') {
        reinsertDanger(room, player.id, payload.position);
      } else if (type === 'remove') {
        removePlayer(room, player.id, payload.playerId);
      } else if (type === 'drop-disconnected') {
        eliminateDisconnectedCurrent(room, player.id);
      } else {
        throw new Error('Unknown game command.');
      }

      emitAll();
      if (result.peek) {
        if (peerId === selfIdRef.current) setPeek(result.peek);
        else transport.notice.send({ type: 'peek', value: result.peek }, { target: peerId }).catch(() => {});
      }
      if (result.privateMessage) {
        if (peerId === selfIdRef.current) setMessage(result.privateMessage);
        else
          transport.notice
            .send({ type: 'toast', value: result.privateMessage }, { target: peerId })
            .catch(() => {});
      }
      return result;
    },
    [emitAll],
  );

  const connect = useCallback(
    async ({ code: rawCode, name, isHost, token: existingToken, groupId, withBot = false, restore = false }) => {
      closeTransport();
      const code = normalizeCode(rawCode);
      if (code.length !== 6) throw new Error('Room codes use six letters or numbers.');
      const token = existingToken || createToken();
      const session = { code, name: String(name).trim(), isHost, token, groupId, withBot };
      sessionRef.current = session;
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
      setNetworkStatus('connecting');
      setMessage(isHost ? 'Opening a private backstage room…' : 'Looking for the room host…');

      let joinRoom;
      try {
        const transportModule = await import('@trystero-p2p/mqtt');
        joinRoom = transportModule.joinRoom;
        selfIdRef.current = transportModule.selfId;
      } catch {
        setNetworkStatus('error');
        setMessage('The multiplayer transport could not load. Check your internet connection and try again.');
        return;
      }

      const room = joinRoom(
        {
          appId: APP_ID,
          password: code,
          relayConfig: {
            urls: [
              'wss://broker.emqx.io:8084/mqtt',
              'wss://public:public@public.cloud.shiftr.io',
              'wss://broker-cn.emqx.io:8084/mqtt',
              'wss://broker.hivemq.com:8884/mqtt',
            ],
            warnOnRelayFailure: false,
          },
        },
        code,
      );
      const hello = room.makeAction('hello');
      const state = room.makeAction('game-state');
      const command = room.makeAction('game-command');
      const notice = room.makeAction('notice');
      transportRef.current = { room, hello, state, command, notice };

      if (isHost) {
        const restored = restore ? loadSnapshot(code) : null;
        const authoritative = restored || createRoomState(code, name, selfIdRef.current, token, groupId);
        authoritative.groupId ||= groupId || 'ive';
        if (!restored && withBot) addBot(authoritative, authoritative.hostId);
        const host = authoritative.players.find((player) => player.id === authoritative.hostId);
        host.name = String(name).trim().slice(0, 18);
        host.token = token;
        host.socketId = selfIdRef.current;
        host.connected = true;
        for (const player of authoritative.players) {
          if (player.id !== host.id) {
            player.connected = Boolean(player.isBot);
            player.socketId = null;
          }
        }
        authoritativeRef.current = authoritative;
        setNetworkStatus('connected');
        setMessage(restored ? 'Room restored. Waiting for friends to reconnect.' : 'Room ready. Share the code.');
      }

      hello.onMessage = (data, { peerId }) => {
        const authoritative = authoritativeRef.current;
        if (!authoritative) return;
        try {
          let player = authoritative.players.find((candidate) => candidate.token === data.token);
          if (player) {
            player.name = String(data.name).trim().slice(0, 18);
            player.socketId = peerId;
            player.connected = true;
            authoritative.log.push(`${player.name} reconnected.`);
          } else {
            player = addPlayer(authoritative, data.name, peerId, data.token);
          }
          emitAll();
        } catch (error) {
          notice.send({ type: 'error', value: error.message }, { target: peerId }).catch(() => {});
        }
      };

      state.onMessage = (value) => {
        if (authoritativeRef.current) return;
        clearTimeout(joinTimerRef.current);
        hostPeerIdRef.current = value.hostPeerId;
        setRoomState(value);
        setNetworkStatus('connected');
        setMessage('Connected to the backstage room.');
      };

      command.onMessage = (value, { peerId }) => {
        if (!authoritativeRef.current) return;
        try {
          hostCommand(value.type, value.payload, peerId);
        } catch (error) {
          notice.send({ type: 'error', value: error.message }, { target: peerId }).catch(() => {});
        }
      };

      notice.onMessage = (value) => {
        if (value.type === 'peek') setPeek(value.value);
        else setMessage(value.value);
      };

      room.onPeerJoin = (peerId) => {
        if (!authoritativeRef.current) {
          hello.send({ name: session.name, token: session.token }, { target: peerId }).catch(() => {});
        }
      };

      room.onPeerLeave = (peerId) => {
        const authoritative = authoritativeRef.current;
        if (authoritative) {
          const player = authoritative.players.find((candidate) => candidate.socketId === peerId);
          if (player) {
            player.connected = false;
            player.socketId = null;
            authoritative.log.push(`${player.name} disconnected.`);
            emitAll();
          }
          return;
        }
        if (hostPeerIdRef.current === peerId) {
          setNetworkStatus('host-left');
          setMessage('The room host disconnected. They can restore the room from this browser.');
        }
      };

      if (isHost) emitAll();
      else {
        joinTimerRef.current = setTimeout(() => {
          if (!authoritativeRef.current) {
            setMessage('No host found yet. Check the code and make sure the host keeps their room open.');
          }
        }, 12000);
      }
    },
    [closeTransport, emitAll, hostCommand],
  );

  const sendCommand = useCallback(
    async (type, payload = {}) => {
      setMessage('');
      try {
        if (authoritativeRef.current) {
          hostCommand(type, payload, selfIdRef.current);
          return;
        }
        const target = roomState?.hostPeerId;
        if (!target || !transportRef.current) throw new Error('The room host is not connected.');
        await transportRef.current.command.send({ type, payload }, { target });
      } catch (error) {
        setMessage(error.message);
      }
    },
    [hostCommand, roomState?.hostPeerId],
  );

  const leave = useCallback(() => {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    closeTransport();
    setMessage('');
    setPeek(null);
  }, [closeTransport]);

  return {
    roomState,
    networkStatus,
    message,
    peek,
    setPeek,
    connect,
    sendCommand,
    leave,
  };
}
