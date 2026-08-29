export const TURN_PING_STORAGE_KEY = 'ive-night-turn-ping';

let audioContext = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) audioContext = new AudioContextClass();
  return audioContext;
}

export function getTurnPingPreference() {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(TURN_PING_STORAGE_KEY) !== 'off';
}

export function saveTurnPingPreference(enabled) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TURN_PING_STORAGE_KEY, enabled ? 'on' : 'off');
}

export function shouldPlayTurnPing({
  enabled,
  status,
  eliminated,
  previousPlayerId,
  currentPlayerId,
  yourPlayerId,
}) {
  return Boolean(
    enabled
    && status === 'playing'
    && !eliminated
    && currentPlayerId
    && currentPlayerId === yourPlayerId
    && previousPlayerId !== currentPlayerId
  );
}

export async function unlockTurnAudio() {
  const context = getAudioContext();
  if (!context) return false;
  if (context.state === 'suspended') {
    try {
      await context.resume();
    } catch {
      return false;
    }
  }
  return context.state === 'running';
}

export function installTurnAudioUnlock() {
  if (typeof window === 'undefined') return () => {};

  const remove = () => {
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
  };
  const unlock = async () => {
    if (await unlockTurnAudio()) remove();
  };

  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  return remove;
}

function scheduleTone(context, destination, { frequency, offset, duration, volume, type = 'sine' }) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime + offset;
  const end = start + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
  return oscillator;
}

export async function playTurnPing(kind = 'turn') {
  const ready = await unlockTurnAudio();
  const context = getAudioContext();
  if (!ready || !context) return false;

  const master = context.createGain();
  master.gain.setValueAtTime(0.78, context.currentTime);
  master.connect(context.destination);

  scheduleTone(context, master, {
    frequency: 987.77,
    offset: 0.01,
    duration: 0.18,
    volume: 0.055,
    type: 'sine',
  });
  const finalTone = scheduleTone(context, master, {
    frequency: 1318.51,
    offset: 0.13,
    duration: 0.32,
    volume: 0.065,
    type: 'triangle',
  });
  finalTone.addEventListener('ended', () => master.disconnect(), { once: true });

  window.dispatchEvent(new CustomEvent('ive-night:turn-ping', { detail: { kind, at: Date.now() } }));
  return true;
}
