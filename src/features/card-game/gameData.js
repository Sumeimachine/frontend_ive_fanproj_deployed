import { MEMBER_PHOTOS } from './memberPhotos.js';

const MEMBER_TONES = ['#7ce7ff', '#ffb67a', '#ff8fcd', '#c9a7ff', '#ffe57a', '#8fffc5'];

const MEMBER_FLAVOR_LINES = [
  (name) => `${name} pulled up. Your safe little hand is now a rumor.`,
  (name) => `Two ${name}s make one suspiciously stylish heist.`,
  () => 'Bias energy: immaculate. Motives: deeply questionable.',
  () => 'Collect the pair. Collect somebody else’s card.',
  () => 'Cute photocard. Extremely uncute combo.',
  () => 'Serving visuals and mild strategic violence.',
];

function memberKey(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function makeMembers(names) {
  return names.map((name, index) => ({
    id: memberKey(name),
    name,
    tone: MEMBER_TONES[index % MEMBER_TONES.length],
    flavor: MEMBER_FLAVOR_LINES[index % MEMBER_FLAVOR_LINES.length](name),
  }));
}

export const GROUPS = [
  {
    id: 'ive',
    name: 'IVE',
    shortName: 'IVE',
    fandom: 'DIVE',
    accent: '#ff70bd',
    secondary: '#72edff',
    acid: '#e8ff72',
    // A local portrait also acts as the compact pack cover, keeping runtime art self-contained.
    image: '/member-photos/ive/yujin.png',
    source: 'https://commons.wikimedia.org/wiki/File:An_Yu-jin_of_Ive,_April_19,_2025.png',
    credit: '티비텐 TV10 · CC BY 3.0',
    vibe: 'Luxury confidence, zero chill. One bad draw and it’s a LOVE DIVE into chaos.',
    members: makeMembers(['Yujin', 'Gaeul', 'Rei', 'Wonyoung', 'Liz', 'Leeseo']),
  },
];

export const DEFAULT_GROUP_ID = 'ive';
export const GROUP_BY_ID = Object.fromEntries(GROUPS.map((group) => [group.id, group]));

export function getGroup(groupId = DEFAULT_GROUP_ID) {
  return GROUP_BY_ID[groupId] ?? GROUP_BY_ID[DEFAULT_GROUP_ID];
}

export function getMemberArt(groupId, memberId) {
  const group = getGroup(groupId);
  const member = group.members.find((candidate) => candidate.id === memberId);
  if (!member) return null;
  const portrait = MEMBER_PHOTOS[group.id]?.[member.id] ?? {};
  return {
    ...member,
    ...portrait,
    image: portrait.image ?? null,
    source: portrait.source ?? null,
    credit: portrait.credit ?? null,
    alt: portrait.alt ?? `${member.name} of ${group.name}`,
    position: portrait.position ?? '50% 24%',
    groupName: group.name,
    hasIndividualPhoto: Boolean(portrait.image),
    isGroupCrop: Boolean(portrait.note),
  };
}

export const ACTION_IDS = [
  'spotlight_pass',
  'soundcheck_skip',
  'double_take',
  'setlist_shuffle',
  'crystal_ball',
  'fan_request',
  'stage_crash',
];

const ACTION_VISUAL_RECIPES = {
  spotlight_pass: {
    template: 'spotlight-ticket',
    memberSlots: [0],
    layerCount: 1,
    cue: 'SAVED BY THE LIGHT',
    story: 'A clean hero spotlight and backstage pass signal an automatic rescue.',
  },
  soundcheck_skip: {
    template: 'skip-wave',
    memberSlots: [1],
    layerCount: 1,
    cue: 'SKIP THE DRAW',
    story: 'Fast-forward cuts and a waveform show one owed turn disappearing.',
  },
  double_take: {
    template: 'mirror-pressure',
    memberSlots: [2],
    layerCount: 2,
    cue: 'NEXT PLAYER +1',
    story: 'A mirrored double portrait passes extra pressure to the next player.',
  },
  setlist_shuffle: {
    template: 'cut-up-setlist',
    memberSlots: [3],
    layerCount: 3,
    cue: 'ORDER: REMIXED',
    story: 'Three displaced poster strips make the randomized deck visible at a glance.',
  },
  crystal_ball: {
    template: 'three-card-oracle',
    memberSlots: [4],
    layerCount: 1,
    cue: 'NEXT 3 IN FOCUS',
    story: 'An orb and three ordered card echoes represent the private preview.',
  },
  fan_request: {
    template: 'request-envelope',
    memberSlots: [5, -1],
    layerCount: 2,
    cue: 'ONE CARD, PLEASE',
    story: 'A fan-letter exchange pulls one mystery photocard from another player.',
  },
  stage_crash: {
    template: 'blackout-stage',
    memberSlots: [0, 2, -1],
    layerCount: 3,
    cue: 'PASS OR EXIT',
    story: 'A fractured red three-member blackout makes the elimination card impossible to mistake.',
  },
};

function wrapSlot(slot, length) {
  return ((slot % length) + length) % length;
}

function uniqueBySource(photos) {
  return photos.filter((photo, index) => photos.findIndex((candidate) => candidate.source === photo.source) === index);
}

export function getActionVisual(groupId, actionId) {
  const group = getGroup(groupId);
  const recipe = ACTION_VISUAL_RECIPES[actionId] ?? ACTION_VISUAL_RECIPES.stage_crash;
  if (!group.members.length) return null;

  const sourcePhotos = uniqueBySource(
    recipe.memberSlots.map((slot) => {
      const member = group.members[wrapSlot(slot, group.members.length)];
      return getMemberArt(group.id, member.id);
    }),
  );
  const photos = sourcePhotos.filter((photo) => photo?.image);
  if (!photos.length) return null;

  const layers = Array.from(
    { length: recipe.layerCount ?? photos.length },
    (_, index) => photos[index % photos.length],
  );
  const credits = uniqueBySource(layers);
  const primary = layers[0];
  const visualId = `${group.id}:${actionId}:${recipe.template}`;

  return {
    actionId,
    template: recipe.template,
    visualId,
    visualSignature: visualId,
    cue: recipe.cue,
    story: recipe.story,
    name: credits.map((photo) => photo.name).join(' + '),
    image: primary.image,
    source: primary.source,
    credit: primary.credit,
    alt: `${group.name} ${actionId.replaceAll('_', ' ')} artwork. ${recipe.story}`,
    position: primary.position,
    photos: credits,
    layers,
  };
}

export function getActionPhoto(groupId, actionId) {
  return getActionVisual(groupId, actionId);
}

export const ACTION_ART = {
  spotlight_pass: { icon: '✦', eyebrow: 'RESCUE', color: '#79f7d4', rule: 'AUTO-SAVE · REINSERT STAGE CRASH' },
  soundcheck_skip: { icon: '↷', eyebrow: 'TEMPO', color: '#9be2ff', rule: 'END 1 OWED TURN · DRAW NOTHING' },
  double_take: { icon: 'Ⅱ', eyebrow: 'PRESSURE', color: '#ff88c8', rule: 'END TURN · NEXT PLAYER OWES +1' },
  setlist_shuffle: { icon: '⌁', eyebrow: 'MIX', color: '#c2a6ff', rule: 'RANDOMIZE DRAW DECK · TURN CONTINUES' },
  crystal_ball: { icon: '◉', eyebrow: 'VISION', color: '#ffd878', rule: 'VIEW NEXT 3 · ORDER UNCHANGED' },
  fan_request: { icon: '♡', eyebrow: 'CHARM', color: '#ff9f92', rule: 'CHOOSE PLAYER · STEAL 1 RANDOM' },
  stage_crash: { icon: '!', eyebrow: 'DANGER', color: '#ff4f68', rule: 'NO SPOTLIGHT PASS = ELIMINATED' },
};

export const RULES = [
  ['Play', 'Drop an action card, or pair matching members for one tiny, glamorous robbery.'],
  ['Draw', 'Every turn ends with a draw. The deck smiles back. Suspiciously.'],
  ['Survive', 'Stage Crash? Flash a Spotlight Pass or make the most dramatic exit of your career.'],
  ['Win', 'Be the last star standing. Friendship can resume after the encore.'],
];
