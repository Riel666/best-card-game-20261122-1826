// game.js — the rules of Ember Court, pure logic with no DOM in it, so the
// Node smoke test and the headless self-test drive the real game.
// A match: each side has 30 life. Every turn your mana crystal grows by 1
// (up to 10) and refills, and you draw a card. Creatures cost mana, enter
// with summoning sickness (they attack from next turn), and fight by
// trading damage. Spells need a target only when they say so. A side at 0
// life loses; an empty deck deals growing fatigue damage instead of a draw.
import { START_LIFE, START_HAND, MAX_MANA, MAX_HAND, BOARD_LIMIT, FATIGUE_STEP } from './config.js';
import { buildDeck, makeCard, defById } from './cards.js';

export const NAMES = ['You', 'Rival Maren'];

function makeSide(name, seed) {
  return {
    name,
    life: START_LIFE,
    mana: 0,
    maxMana: 0,
    deck: buildDeck(seed),
    hand: [],
    board: [],
    fatigue: 0,
    damageDealt: 0,
    creaturesPlayed: 0,
    spellsPlayed: 0,
  };
}

export class CardGame {
  constructor(seed = 20261122) {
    this.seed = seed;
    this.reset();
  }

  reset() {
    this.sides = [makeSide(NAMES[0], this.seed), makeSide(NAMES[1], this.seed + 7919)];
    this.turn = 0; // whose turn: 0 = player, 1 = rival
    this.turnNumber = 0;
    this.state = 'title'; // title | play | win | lose
    this.winner = null;
    this.score = 0;
    this.logLines = [];
    this.say('Welcome to the Ember Court. Click PLAY to take your seat.');
  }

  say(text) {
    this.logLines.push(text);
    if (this.logLines.length > 4) this.logLines.shift();
  }

  startMatch() {
    this.reset();
    this.state = 'play';
    for (let s = 0; s < 2; s++) {
      for (let i = 0; i < START_HAND; i++) this.drawCard(s, true);
    }
    this.beginTurn(0);
    this.say('The court is seated. Your move — play a card, then End Turn.');
  }

  beginTurn(side) {
    this.turn = side;
    this.turnNumber += side === 0 ? 1 : 0;
    const p = this.sides[side];
    p.maxMana = Math.min(MAX_MANA, p.maxMana + 1);
    p.mana = p.maxMana;
    for (const c of p.board) c.canAttack = true;
    this.drawCard(side, false);
    this.say(`${p.name} — turn ${this.turnNumber}, ${p.mana} mana.`);
  }

  drawCard(side, quiet) {
    const p = this.sides[side];
    if (p.deck.length === 0) {
      p.fatigue += FATIGUE_STEP;
      p.life -= p.fatigue;
      this.say(`${p.name} draws from an empty deck — fatigue ${p.fatigue}!`);
      this.checkEnd();
      return null;
    }
    const card = p.deck.pop();
    if (p.hand.length >= MAX_HAND) {
      this.say(`${p.name}'s hand is full — ${card.name} burns away.`);
      return null;
    }
    p.hand.push(card);
    if (!quiet) this.say(`${p.name} draws a card.`);
    return card;
  }

  playable(side, handIndex) {
    const p = this.sides[side];
    const card = p.hand[handIndex];
    if (!card) return { ok: false, reason: 'no such card' };
    if (card.cost > p.mana) return { ok: false, reason: 'not enough mana' };
    if (card.type === 'creature' && p.board.length >= BOARD_LIMIT) {
      return { ok: false, reason: 'board is full' };
    }
    return { ok: true, card };
  }

  // target: null, or { kind: 'face', side } / { kind: 'creature', side, index }
  playCard(side, handIndex, target) {
    const p = this.sides[side];
    const check = this.playable(side, handIndex);
    if (!check.ok) return check;
    const card = check.card;
    if (card.type === 'spell' && card.defId === 'ember-burst' && !target) {
      return { ok: false, reason: 'Ember Burst needs a target' };
    }
    p.mana -= card.cost;
    p.hand.splice(handIndex, 1);
    if (card.type === 'creature') {
      card.canAttack = false; // summoning sickness
      card.justPlayed = true;
      p.board.push(card);
      p.creaturesPlayed++;
      this.score += side === 0 ? 10 : 0;
      this.say(`${p.name} plays ${card.name} (${card.attack}/${card.health}).`);
    } else {
      p.spellsPlayed++;
      this.score += side === 0 ? 5 : 0;
      this.castSpell(side, card, target);
    }
    this.checkEnd();
    return { ok: true, card };
  }

  castSpell(side, card, target) {
    const me = this.sides[side];
    const foe = this.sides[1 - side];
    if (card.defId === 'ember-burst') {
      this.dealDamage(target, 3, `${me.name}'s Ember Burst`);
    } else if (card.defId === 'tide-mend') {
      me.life = Math.min(START_LIFE, me.life + 6);
      this.say(`${me.name} mends 6 life with Tide Mend.`);
    } else if (card.defId === 'thorn-volley') {
      for (const c of [...foe.board]) this.damageCreature(1 - side, c, 2, 'Thorn Volley');
      this.say(`Thorn Volley rains thorns on ${foe.name}'s board.`);
    } else if (card.defId === 'gloom-veil') {
      this.drawCard(side, true);
      this.drawCard(side, true);
      this.say(`${me.name} lifts the Gloom Veil and draws 2.`);
    }
  }

  dealDamage(target, amount, source) {
    if (!target) return;
    if (target.kind === 'face') {
      const p = this.sides[target.side];
      p.life -= amount;
      if (this.turn === 0 && target.side === 1) {
        this.sides[0].damageDealt += amount;
        this.score += amount;
      }
      this.say(`${source} hits ${p.name} for ${amount}.`);
    } else {
      this.damageCreature(target.side, this.sides[target.side].board[target.index], amount, source);
    }
    this.checkEnd();
  }

  damageCreature(side, creature, amount, source) {
    if (!creature) return;
    creature.health -= amount;
    this.say(`${source} hits ${creature.name} for ${amount}.`);
    if (creature.health <= 0) {
      const board = this.sides[side].board;
      const i = board.indexOf(creature);
      if (i !== -1) board.splice(i, 1);
      this.say(`${creature.name} falls.`);
    }
  }

  attack(side, boardIndex, target) {
    const p = this.sides[side];
    const attacker = p.board[boardIndex];
    if (!attacker) return { ok: false, reason: 'no such creature' };
    if (!attacker.canAttack) return { ok: false, reason: 'that creature cannot attack yet' };
    attacker.canAttack = false;
    if (target.kind === 'face') {
      const foe = this.sides[target.side];
      foe.life -= attacker.attack;
      if (side === 0) {
        this.sides[0].damageDealt += attacker.attack;
        this.score += attacker.attack;
      }
      this.say(`${attacker.name} strikes ${foe.name} for ${attacker.attack}.`);
    } else {
      const foe = this.sides[target.side].board[target.index];
      if (!foe) return { ok: false, reason: 'no such target' };
      this.say(`${attacker.name} (${attacker.attack}/${attacker.health}) fights ${foe.name} (${foe.attack}/${foe.health}).`);
      const foeAttack = foe.attack;
      this.damageCreature(target.side, foe, attacker.attack, attacker.name);
      // The attacker takes the defender's blow back — unless the defender died.
      if (this.sides[target.side].board.includes(foe)) {
        this.damageCreature(side, attacker, foeAttack, foe.name);
      }
    }
    this.checkEnd();
    return { ok: true };
  }

  endTurn() {
    if (this.state !== 'play') return { ok: false, reason: 'not playing' };
    const next = 1 - this.turn;
    this.beginTurn(next);
    return { ok: true };
  }

  checkEnd() {
    if (this.state !== 'play') return;
    if (this.sides[1].life <= 0 && this.sides[0].life <= 0) {
      this.state = 'win'; // a draw counts as a win for the player in solo play
      this.winner = 0;
      this.say('Both courts fall — but yours stands last. Victory!');
    } else if (this.sides[1].life <= 0) {
      this.state = 'win';
      this.winner = 0;
      this.score += 100;
      this.say('Rival Maren falls. The Ember Court is yours!');
    } else if (this.sides[0].life <= 0) {
      this.state = 'lose';
      this.winner = 1;
      this.say('Your court falls. Rival Maren keeps the ember.');
    }
  }

  // Helpers the renderer and the AI share.
  manaCrystals(side) {
    const p = this.sides[side];
    return { filled: p.mana, total: p.maxMana };
  }

  // A deterministic auto-player for one side (used by the self-test and by
  // the AI module's shared logic): play what it can, attack what it should.
  static describeTarget(t) {
    return t.kind === 'face' ? `${NAMES[t.side]} (face)` : `${NAMES[t.side]}'s ${t.index}`;
  }
}

export { makeCard, defById };
