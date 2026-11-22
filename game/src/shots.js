// shots.js — posed states for honest screenshots (?shot=cover/play/
// victory/defeat). Each pose puts the game into a state a real play
// session reaches, using the same code and the same state a player would
// have: only the path there is a query string. Posed games are frozen, so
// the frame never drifts.
import { makeCard, defById } from './cards.js';

function placeCreature(game, side, defId, canAttack = true) {
  const card = makeCard(defById(defId));
  card.canAttack = canAttack;
  game.sides[side].board.push(card);
  return card;
}

function giveHand(game, side, defIds) {
  for (const id of defIds) game.sides[side].hand.push(makeCard(defById(id)));
}

export function applyShot(game, shot) {
  if (shot === 'cover') {
    // Title screen over a posed table: both courts seated, hands dealt,
    // the first creatures already trading.
    game.startMatch();
    game.sides[0].life = 30;
    game.sides[1].life = 30;
    game.sides[0].mana = 3;
    game.sides[0].maxMana = 3;
    placeCreature(game, 0, 'flame-squire');
    placeCreature(game, 0, 'seedling');
    placeCreature(game, 1, 'river-guard');
    placeCreature(game, 1, 'shade-wisp');
    giveHand(game, 0, ['ember-burst', 'ash-dragon', 'tide-mend']);
    game.state = 'title';
    game.say('Welcome to the Ember Court. Click PLAY to take your seat.');
    return 'cover';
  }
  if (shot === 'play') {
    // Mid-game: turn 6, both boards busy, hands full of decisions, life
    // totals and mana visible, the rival about to move.
    game.startMatch();
    game.sides[0].life = 24;
    game.sides[1].life = 27;
    game.turnNumber = 6;
    game.sides[0].maxMana = 6;
    game.sides[0].mana = 6;
    game.sides[1].maxMana = 6;
    game.sides[1].mana = 2;
    game.sides[0].hand = [];
    game.sides[1].hand = [];
    placeCreature(game, 0, 'ember-knight');
    placeCreature(game, 0, 'grove-warden');
    placeCreature(game, 0, 'mist-eel');
    placeCreature(game, 1, 'tidecaller');
    placeCreature(game, 1, 'gloom-reaper');
    placeCreature(game, 1, 'briar-wolf');
    giveHand(game, 0, ['ember-burst', 'ash-dragon', 'thorn-volley', 'cinder-imp', 'tide-mend', 'gloom-veil']);
    giveHand(game, 1, ['deep-leviathan', 'ember-knight']);
    game.say('Turn 6 — your board is wide, but Maren holds a Leviathan. Strike now or save the Burst?');
    return 'play';
  }
  if (shot === 'victory') {
    // The win screen after the final blow.
    game.startMatch();
    game.sides[0].life = 14;
    game.sides[1].life = 0;
    game.sides[0].mana = 4;
    game.sides[0].maxMana = 7;
    game.turnNumber = 9;
    game.score = 214;
    game.sides[0].damageDealt = 31;
    game.sides[0].creaturesPlayed = 9;
    game.sides[0].spellsPlayed = 3;
    placeCreature(game, 0, 'ash-dragon');
    placeCreature(game, 0, 'ember-knight');
    placeCreature(game, 1, 'night-owl');
    giveHand(game, 0, ['tide-mend', 'gloom-veil']);
    game.state = 'win';
    game.winner = 0;
    game.say('Rival Maren falls. The Ember Court is yours!');
    return 'victory';
  }
  if (shot === 'defeat') {
    // The loss screen: your court has fallen.
    game.startMatch();
    game.sides[0].life = 0;
    game.sides[1].life = 19;
    game.sides[0].mana = 2;
    game.sides[0].maxMana = 8;
    game.turnNumber = 11;
    game.score = 96;
    game.sides[0].damageDealt = 18;
    game.sides[0].creaturesPlayed = 7;
    game.sides[0].spellsPlayed = 2;
    placeCreature(game, 0, 'seedling');
    placeCreature(game, 1, 'deep-leviathan');
    placeCreature(game, 1, 'gloom-reaper');
    giveHand(game, 0, ['cinder-imp', 'ember-burst']);
    game.state = 'lose';
    game.winner = 1;
    game.say('Your court falls. Rival Maren keeps the ember.');
    return 'defeat';
  }
  return null;
}
