// config.js — every number and look of Ember Court in one place: canvas
// size, life and mana rules, the four suits (each told apart by colour AND
// shape, never by text alone), and the table geometry every other module
// shares (hand rows, board rows, buttons, life orbs).
export const W = 1280;
export const H = 800;
export const START_LIFE = 30;
export const START_HAND = 3;
export const MAX_MANA = 10;
export const MAX_HAND = 10;
export const BOARD_LIMIT = 7;
export const DECK_SIZE = 30;
export const FATIGUE_STEP = 1; // empty-deck damage grows by 1 each draw

export const SUITS = {
  ember: { name: 'Ember', color: '#e8492f', dark: '#7d1a0b', shape: 'flame', glyph: '▲' },
  tide: { name: 'Tide', color: '#2f9be8', dark: '#0a4a86', shape: 'drop', glyph: '●' },
  thorn: { name: 'Thorn', color: '#43b04c', dark: '#14571c', shape: 'leaf', glyph: '◆' },
  gloom: { name: 'Gloom', color: '#9b5fe0', dark: '#452078', shape: 'moon', glyph: '★' },
};

export const CARD_W = 132;
export const CARD_H = 188;
export const BOARD_CARD_W = 118;
export const BOARD_CARD_H = 168;
export const AI_CARD_W = 84;
export const AI_CARD_H = 118;

// Table rows (canvas 1280x800).
export const AI_HAND_Y = 10;
export const AI_BOARD_Y = 158;
export const PLAYER_BOARD_Y = 372;
export const PLAYER_HAND_Y = 592;
export const LOG_Y = 556;

export function handRects(n) {
  // Player hand: centred row of full-size cards, slightly overlapping past 6.
  const w = CARD_W;
  const gap = n <= 6 ? 12 : Math.max(-38, (1280 - 320 - n * w) / Math.max(1, n - 1));
  const total = n * w + (n - 1) * gap;
  const x0 = (1280 - total) / 2;
  const out = [];
  for (let i = 0; i < n; i++) out.push({ x: x0 + i * (w + gap), y: PLAYER_HAND_Y, w, h: CARD_H });
  return out;
}

export function aiHandRects(n) {
  const w = AI_CARD_W;
  const gap = 10;
  const total = n * w + (n - 1) * gap;
  const x0 = (1280 - total) / 2;
  const out = [];
  for (let i = 0; i < n; i++) out.push({ x: x0 + i * (w + gap), y: AI_HAND_Y, w, h: AI_CARD_H });
  return out;
}

export function boardRects(n, y) {
  const w = BOARD_CARD_W;
  const gap = 14;
  const total = n * w + (n - 1) * gap;
  const x0 = (1280 - total) / 2;
  const out = [];
  for (let i = 0; i < n; i++) out.push({ x: x0 + i * (w + gap), y, w, h: BOARD_CARD_H });
  return out;
}

export function endTurnRect() {
  return { x: 1130, y: 392, w: 132, h: 56 };
}

export function lifeOrb(side) {
  // side 0 = player (bottom left), 1 = rival (top left).
  return side === 0
    ? { x: 18, y: 620, r: 52 }
    : { x: 18, y: 40, r: 52 };
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
