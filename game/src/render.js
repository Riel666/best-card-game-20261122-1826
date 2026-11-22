// render.js — one frame of the Ember Court on a 1280x800 canvas: the
// green baize table, the rival's hand of card backs, both boards, your
// hand, life orbs, mana crystals, the End Turn button, the log, and the
// title / victory / defeat overlays. Cards are legible at thumbnail size:
// a suit-coloured header, a big suit shape, a readable name, cost in a
// circle, attack and health in the corners. This module also owns the
// hit-testing the input module uses, so clicks land on what you see.
import { W, H, CARD_W, CARD_H, BOARD_CARD_W, BOARD_CARD_H, AI_CARD_W, AI_CARD_H,
  AI_HAND_Y, AI_BOARD_Y, PLAYER_BOARD_Y, PLAYER_HAND_Y, LOG_Y,
  SUITS, handRects, aiHandRects, boardRects, endTurnRect, lifeOrb, pointInRect } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawSuitShape(ctx, suit, cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  if (suit === 'ember') {
    // Flame: a triangle with a flicked tip.
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.8, cy + size * 0.6);
    ctx.lineTo(cx + size * 0.25, cy + size * 0.2);
    ctx.lineTo(cx - size * 0.2, cy + size * 0.8);
    ctx.lineTo(cx - size * 0.8, cy + size * 0.5);
  } else if (suit === 'tide') {
    // Drop: a circle with a point on top.
    ctx.moveTo(cx, cy - size);
    ctx.quadraticCurveTo(cx + size, cy, cx, cy + size * 0.85);
    ctx.quadraticCurveTo(cx - size, cy, cx, cy - size);
  } else if (suit === 'thorn') {
    // Leaf: a diamond.
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.75, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size * 0.75, cy);
  } else {
    // Moon: a crescent.
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5eeda';
    ctx.beginPath();
    ctx.arc(cx + size * 0.45, cy - size * 0.25, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.closePath();
  ctx.fill();
}

function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const suit = SUITS[card.suit];
  const scale = w / CARD_W;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 10);
  ctx.fillStyle = '#f5eeda';
  ctx.fill();
  ctx.lineWidth = opts.selected ? 4 : 2;
  ctx.strokeStyle = opts.selected ? '#ffd94d' : opts.canAttack ? '#7dff9a' : '#3a2c1c';
  ctx.stroke();
  // Suit header band: the suit's DARK shade, so the white name reads at
  // thumbnail size; the bright suit colour lives in the big shape below.
  ctx.fillStyle = suit.dark;
  roundRect(ctx, 0, 0, CARD_W, 34, 10);
  ctx.fillRect(0, 24, CARD_W, 10);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(card.name, 8, 18, CARD_W - 40);
  // Cost orb.
  ctx.beginPath();
  ctx.arc(CARD_W - 20, 18, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#1d4e89';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(card.cost), CARD_W - 20, 19);
  // Big suit shape in the middle.
  drawSuitShape(ctx, card.suit, CARD_W / 2, 84, 30, suit.color);
  ctx.fillStyle = suit.dark;
  ctx.font = 'bold 12px Georgia, serif';
  ctx.fillText(suit.name.toUpperCase(), CARD_W / 2, 128);
  // Rule text.
  ctx.fillStyle = '#3a2c1c';
  ctx.font = 'italic 11px Georgia, serif';
  ctx.textAlign = 'center';
  wrapText(ctx, card.text, CARD_W / 2, 146, CARD_W - 16, 13);
  // Attack / health for creatures, as plain words — glyphs render
  // inconsistently across headless fonts.
  if (card.type === 'creature') {
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#c22e12';
    ctx.fillText(`ATK ${card.attack}`, 10, CARD_H - 12);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#1d4e89';
    ctx.fillText(`HP ${card.health}`, CARD_W - 10, CARD_H - 12);
  } else {
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = suit.dark;
    ctx.fillText('✦ SPELL ✦', CARD_W / 2, CARD_H - 14);
  }
  if (opts.dimmed) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, 0, 0, CARD_W, CARD_H, 10);
    ctx.fill();
  }
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, cy);
}

function drawCardBack(ctx, x, y, w, h) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = '#5a2d1e';
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.stroke();
  roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 5);
  ctx.strokeStyle = 'rgba(212,175,55,0.7)';
  ctx.lineWidth = 1;
  ctx.stroke();
  drawSuitShape(ctx, 'ember', x + w / 2, y + h / 2, Math.min(w, h) * 0.22, '#d4af37');
  ctx.restore();
}

function drawLifeOrb(ctx, game, side) {
  const orb = lifeOrb(side);
  const p = game.sides[side];
  ctx.save();
  ctx.beginPath();
  ctx.arc(orb.x + orb.r, orb.y + orb.r, orb.r, 0, Math.PI * 2);
  ctx.fillStyle = side === 0 ? '#1d4e89' : '#7d1a0b';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#d4af37';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(Math.max(0, p.life)), orb.x + orb.r, orb.y + orb.r - 8);
  ctx.font = '11px Georgia, serif';
  ctx.fillText('LIFE', orb.x + orb.r, orb.y + orb.r + 24);
  ctx.restore();
}

function drawMana(ctx, game, side) {
  // Mana lives in the free right column (never under the hand, which can
  // stretch to x=151 with ten cards): a compact strip per side.
  const p = game.sides[side];
  const x0 = 1130;
  const y = side === 0 ? 686 : 56;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillStyle = '#cfe8ff';
  ctx.fillText('MANA', x0, y);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText(`${p.mana}/${p.maxMana}`, x0 + 48, y);
  for (let i = 0; i < 10; i++) {
    const cx = x0 + 7 + i * 13;
    const cy = y + 18;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx + 6, cy);
    ctx.lineTo(cx, cy + 8);
    ctx.lineTo(cx - 6, cy);
    ctx.closePath();
    ctx.fillStyle = i < p.mana ? '#2f9be8' : 'rgba(255,255,255,0.14)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = '#cfe8ff';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(`Deck ${p.deck.length} · Hand ${p.hand.length}`, x0, y + 44);
  ctx.restore();
}

function drawNameplate(ctx, game, side) {
  const p = game.sides[side];
  // The rival's plate sits between her hand and her board; yours sits
  // just above your board — never on the log lines at y=556.
  const y = side === 0 ? 358 : 138;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillStyle = game.turn === side && game.state === 'play' ? '#ffd94d' : '#9aa7bd';
  const label = game.turn === side && game.state === 'play' ? `▶ ${p.name} — your move` : p.name;
  ctx.fillText(label, W / 2, y);
  ctx.restore();
}

function drawButton(ctx, rect, label, enabled) {
  ctx.save();
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fillStyle = enabled ? '#d4af37' : 'rgba(255,255,255,0.15)';
  ctx.fill();
  ctx.strokeStyle = '#3a2c1c';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = enabled ? '#14100a' : '#9aa7bd';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  ctx.restore();
}

function drawOverlay(ctx, title, body, hint, color) {
  ctx.save();
  ctx.fillStyle = 'rgba(5,8,14,0.78)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = 'bold 58px Georgia, serif';
  ctx.fillText(title, W / 2, 300);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = '19px Georgia, serif';
  wrapText(ctx, body, W / 2, 360, 760, 26);
  ctx.fillStyle = '#9aa7bd';
  ctx.font = '15px monospace';
  ctx.fillText(hint, W / 2, 470);
  ctx.restore();
}

export function drawGame(ctx, game, ui) {
  // Table.
  ctx.fillStyle = '#2c1a10';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1e4d2b';
  roundRect(ctx, 8, 8, W - 16, H - 16, 18);
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(212,175,55,0.35)';
  ctx.lineWidth = 1;
  roundRect(ctx, 24, 24, W - 48, H - 48, 12);
  ctx.stroke();

  const me = game.sides[0];
  const foe = game.sides[1];

  // Rival's hand (backs) and board.
  for (const r of aiHandRects(foe.hand.length)) drawCardBack(ctx, r.x, r.y, r.w, r.h);
  const foeRects = boardRects(foe.board.length, AI_BOARD_Y);
  foe.board.forEach((c, i) => {
    const r = foeRects[i];
    const targetable = ui.targeting && ui.targeting.kind === 'creature' && ui.targeting.side === 1;
    drawCardFace(ctx, c, r.x, r.y, BOARD_CARD_W, BOARD_CARD_H,
      { selected: false, canAttack: targetable });
  });
  // Player board.
  const myRects = boardRects(me.board.length, PLAYER_BOARD_Y);
  me.board.forEach((c, i) => {
    const r = myRects[i];
    drawCardFace(ctx, c, r.x, r.y, BOARD_CARD_W, BOARD_CARD_H,
      { selected: ui.selectedAttacker === i, canAttack: c.canAttack && game.turn === 0 });
  });
  // Player hand.
  const myHand = handRects(me.hand.length);
  me.hand.forEach((c, i) => {
    const r = myHand[i];
    const playable = game.state === 'play' && game.turn === 0 && c.cost <= me.mana;
    drawCardFace(ctx, c, r.x, r.y - (ui.selectedHand === i ? 14 : 0), r.w, r.h,
      { selected: ui.selectedHand === i, dimmed: !playable && game.state === 'play' });
  });

  drawLifeOrb(ctx, game, 1);
  drawLifeOrb(ctx, game, 0);
  drawMana(ctx, game, 1);
  drawMana(ctx, game, 0);
  drawNameplate(ctx, game, 1);
  drawNameplate(ctx, game, 0);

  // Turn + score strip.
  ctx.save();
  ctx.textAlign = 'right';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillStyle = '#ffd94d';
  ctx.fillText(`TURN ${Math.max(1, game.turnNumber)}`, 1262, 340);
  ctx.fillStyle = '#cfe8ff';
  ctx.font = '14px Georgia, serif';
  ctx.fillText(`SCORE ${game.score}`, 1262, 362);
  ctx.restore();

  // End Turn button (only yours, only while playing).
  const btn = endTurnRect();
  drawButton(ctx, btn, game.turn === 0 ? 'END TURN' : 'RIVAL…', game.turn === 0 && game.state === 'play');

  // Targeting line from the selected card or attacker to the mouse.
  if (ui.targeting && ui.mouse) {
    let from = null;
    if (ui.targeting.kind === 'hand') {
      const r = myHand[ui.targeting.index];
      if (r) from = { x: r.x + r.w / 2, y: r.y };
    } else if (ui.targeting.kind === 'attacker') {
      const r = myRects[ui.targeting.index];
      if (r) from = { x: r.x + r.w / 2, y: r.y };
    }
    if (from) {
      ctx.save();
      ctx.strokeStyle = '#ffd94d';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(ui.mouse.x, ui.mouse.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  // Log lines.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'italic 14px Georgia, serif';
  ctx.fillStyle = '#cfe8ff';
  game.logLines.slice(-2).forEach((line, i) => {
    ctx.fillText(line, W / 2, LOG_Y + i * 18);
  });
  ctx.restore();

  // Overlays.
  if (game.state === 'title') {
    drawOverlay(ctx, 'EMBER COURT',
      'A card duel at the court of embers. Thirty life each, mana that grows every turn, creatures that trade blows and spells that turn a losing hand. Outlast Rival Maren — or fall to her.',
      'Click PLAY or press Enter  ·  click a card, then a target  ·  Space ends your turn', '#ffd94d');
    drawButton(ctx, { x: W / 2 - 90, y: 500, w: 180, h: 56 }, '▶  PLAY', true);
  } else if (game.state === 'win') {
    drawOverlay(ctx, 'VICTORY',
      `Rival Maren falls. The Ember Court is yours! Final score ${game.score} — damage dealt ${me.damageDealt}, creatures played ${me.creaturesPlayed}, spells cast ${me.spellsPlayed}.`,
      'Press R to play again', '#ffd94d');
  } else if (game.state === 'lose') {
    drawOverlay(ctx, 'DEFEAT',
      `Your court falls to Rival Maren. Final score ${game.score} — damage dealt ${me.damageDealt}. Study her trades, shuffle again, and take the ember back.`,
      'Press R to try again', '#e8492f');
  }
}

// Hit-testing: what did this click land on? Returns null or a descriptor.
export function hitTest(game, ui, x, y) {
  const btn = endTurnRect();
  if (pointInRect(x, y, btn)) return { type: 'endturn' };
  if (game.state === 'title') {
    const playBtn = { x: W / 2 - 90, y: 500, w: 180, h: 56 };
    if (pointInRect(x, y, playBtn)) return { type: 'play' };
    return null;
  }
  if (game.state !== 'play' || game.turn !== 0) return null;
  // Rival face (life orb) — a spell or attack target.
  const foeOrb = lifeOrb(1);
  if (Math.hypot(x - (foeOrb.x + foeOrb.r), y - (foeOrb.y + foeOrb.r)) <= foeOrb.r) {
    return { type: 'face', side: 1 };
  }
  // Rival board creatures.
  const foeRects = boardRects(game.sides[1].board.length, AI_BOARD_Y);
  for (let i = 0; i < foeRects.length; i++) {
    if (pointInRect(x, y, foeRects[i])) return { type: 'enemy', index: i };
  }
  // Own board creatures (attackers).
  const myRects = boardRects(game.sides[0].board.length, PLAYER_BOARD_Y);
  for (let i = 0; i < myRects.length; i++) {
    if (pointInRect(x, y, myRects[i])) return { type: 'attacker', index: i };
  }
  // Own hand.
  const myHand = handRects(game.sides[0].hand.length);
  for (let i = 0; i < myHand.length; i++) {
    const r = { ...myHand[i], y: myHand[i].y - (ui.selectedHand === i ? 14 : 0) };
    if (pointInRect(x, y, r)) return { type: 'hand', index: i };
  }
  return null;
}
