// input.js — mouse and keyboard into game actions. Click a card in your
// hand, then click its target (an enemy creature, the rival's life orb, or
// your own life orb for a healing spell); click one of your creatures, then
// click what it attacks; click End Turn, or press Space. Escape clears a
// selection. This module owns the selection state, so the game module
// never has to know where the mouse is.
import { hitTest } from './render.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouse = { x: 0, y: 0 };
    this.selectedHand = null; // index into your hand
    this.selectedAttacker = null; // index into your board
    this.keys = new Set();
  }

  clearSelection() {
    this.selectedHand = null;
    this.selectedAttacker = null;
  }

  // Where the selection is aiming, for the renderer's targeting line.
  targeting() {
    if (this.selectedHand !== null) return { kind: 'hand', index: this.selectedHand };
    if (this.selectedAttacker !== null) return { kind: 'attacker', index: this.selectedAttacker };
    return null;
  }

  // Resolve a click into a target descriptor the game understands, or null
  // when the click was a selection instead of an action.
  targetFromHit(hit) {
    if (!hit) return null;
    if (hit.type === 'face') return { kind: 'face', side: hit.side };
    if (hit.type === 'enemy') return { kind: 'creature', side: 1, index: hit.index };
    return null;
  }

  handleClick(game, sfx, x, y) {
    const hit = hitTest(game, { selectedHand: this.selectedHand }, x, y);
    if (!hit) { this.clearSelection(); return; }
    if (hit.type === 'play') {
      sfx.ensure();
      game.startMatch();
      this.clearSelection();
      return;
    }
    if (hit.type === 'endturn') {
      if (game.state === 'play' && game.turn === 0) {
        game.endTurn();
        sfx.turn();
        this.clearSelection();
      }
      return;
    }
    // A selected hand card wants a target.
    if (this.selectedHand !== null) {
      const card = game.sides[0].hand[this.selectedHand];
      const target = this.targetFromHit(hit);
      if (card && card.type === 'spell' && card.defId === 'ember-burst' && !target) {
        this.clearSelection();
        return;
      }
      if (card && card.type === 'creature' && target) {
        // Creatures need no target: clicking a target cancels the pick.
        this.clearSelection();
        return;
      }
      const r = game.playCard(0, this.selectedHand, target);
      if (r.ok) {
        if (card.type === 'spell' && card.defId === 'tide-mend') sfx.heal();
        else sfx.playCard();
      } else {
        game.say(r.reason);
      }
      this.clearSelection();
      return;
    }
    // A selected attacker wants a target.
    if (this.selectedAttacker !== null) {
      const target = this.targetFromHit(hit);
      if (target) {
        const r = game.attack(0, this.selectedAttacker, target);
        if (r.ok) sfx.hit();
        else game.say(r.reason);
        this.clearSelection();
        return;
      }
      this.clearSelection();
      return;
    }
    // Fresh selection.
    if (hit.type === 'hand') {
      const card = game.sides[0].hand[hit.index];
      if (!card) return;
      if (card.type === 'creature') {
        // Creatures play at once — no target needed.
        const r = game.playCard(0, hit.index, null);
        if (r.ok) sfx.playCard();
        else game.say(r.reason);
        return;
      }
      // Spells that need no target fire at once; Ember Burst arms targeting.
      if (card.defId === 'ember-burst') {
        this.selectedHand = hit.index;
        game.say('Ember Burst armed — click a target.');
      } else {
        const r = game.playCard(0, hit.index, null);
        if (r.ok) {
          if (card.defId === 'tide-mend') sfx.heal();
          else sfx.playCard();
        } else game.say(r.reason);
      }
      return;
    }
    if (hit.type === 'attacker') {
      const c = game.sides[0].board[hit.index];
      if (c && c.canAttack) {
        this.selectedAttacker = hit.index;
        game.say(`${c.name} ready — click a creature or the rival's life to strike.`);
      } else if (c) {
        game.say(`${c.name} cannot attack yet — it just arrived.`);
      }
    }
  }

  handleKey(game, sfx, key) {
    const k = key.toLowerCase();
    if (k === 'escape') { this.clearSelection(); return; }
    if (game.state === 'title' && (k === 'enter' || k === ' ')) {
      sfx.ensure();
      game.startMatch();
      this.clearSelection();
      return;
    }
    if ((game.state === 'win' || game.state === 'lose') && k === 'r') {
      game.startMatch();
      this.clearSelection();
      return;
    }
    if (game.state === 'play' && game.turn === 0 && k === ' ') {
      game.endTurn();
      sfx.turn();
      this.clearSelection();
    }
    if (k === 'm') sfx.muted = !sfx.muted;
  }
}
