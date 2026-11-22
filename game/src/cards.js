// cards.js — the Ember Court card pool: every card an original design.
// Four suits, each with five creatures, plus four spells. A deck is 30
// cards: one of every creature and two extra copies of each spell. The
// shuffle is seeded (mulberry32) so a headless play-test replays exactly.
export const CARD_DEFS = [
  // Ember creatures — fast, hard-hitting, fragile.
  { id: 'cinder-imp', name: 'Cinder Imp', suit: 'ember', type: 'creature', cost: 1, attack: 2, health: 1, text: 'Quick as a spark.' },
  { id: 'spark-hound', name: 'Spark Hound', suit: 'ember', type: 'creature', cost: 3, attack: 3, health: 3, text: 'Chases every ember.' },
  { id: 'flame-squire', name: 'Flame Squire', suit: 'ember', type: 'creature', cost: 2, attack: 3, health: 2, text: 'Sworn to the court.' },
  { id: 'ember-knight', name: 'Ember Knight', suit: 'ember', type: 'creature', cost: 4, attack: 4, health: 4, text: 'His blade never cools.' },
  { id: 'ash-dragon', name: 'Ash Dragon', suit: 'ember', type: 'creature', cost: 7, attack: 7, health: 6, text: 'The court bows to fire.' },
  // Tide creatures — tough, patient, hard to remove.
  { id: 'dew-sprite', name: 'Dew Sprite', suit: 'tide', type: 'creature', cost: 1, attack: 1, health: 2, text: 'Small, and everywhere.' },
  { id: 'river-guard', name: 'River Guard', suit: 'tide', type: 'creature', cost: 2, attack: 2, health: 4, text: 'Holds the crossing.' },
  { id: 'mist-eel', name: 'Mist Eel', suit: 'tide', type: 'creature', cost: 3, attack: 4, health: 2, text: 'Strikes from the fog.' },
  { id: 'tidecaller', name: 'Tidecaller', suit: 'tide', type: 'creature', cost: 4, attack: 3, health: 5, text: 'Calls the river in.' },
  { id: 'deep-leviathan', name: 'Deep Leviathan', suit: 'tide', type: 'creature', cost: 7, attack: 6, health: 7, text: 'Older than the court.' },
  // Thorn creatures — balanced growers that trade well.
  { id: 'seedling', name: 'Seedling', suit: 'thorn', type: 'creature', cost: 1, attack: 1, health: 3, text: 'Grows where it lands.' },
  { id: 'briar-wolf', name: 'Briar Wolf', suit: 'thorn', type: 'creature', cost: 2, attack: 3, health: 2, text: 'Runs the green halls.' },
  { id: 'vine-snake', name: 'Vine Snake', suit: 'thorn', type: 'creature', cost: 3, attack: 2, health: 4, text: 'Coils around ankles.' },
  { id: 'grove-warden', name: 'Grove Warden', suit: 'thorn', type: 'creature', cost: 4, attack: 4, health: 5, text: 'Keeper of the roots.' },
  { id: 'thorn-titan', name: 'Thorn Titan', suit: 'thorn', type: 'creature', cost: 6, attack: 6, health: 6, text: 'A walking thicket.' },
  // Gloom creatures — tricky, high attack, low health.
  { id: 'shade-wisp', name: 'Shade Wisp', suit: 'gloom', type: 'creature', cost: 1, attack: 2, health: 1, text: 'Here, then gone.' },
  { id: 'night-owl', name: 'Night Owl', suit: 'gloom', type: 'creature', cost: 2, attack: 2, health: 3, text: 'Sees your hand.' },
  { id: 'moon-moth', name: 'Moon Moth', suit: 'gloom', type: 'creature', cost: 3, attack: 3, health: 2, text: 'Drawn to dying light.' },
  { id: 'gloom-reaper', name: 'Gloom Reaper', suit: 'gloom', type: 'creature', cost: 5, attack: 5, health: 4, text: 'Harvests the fallen.' },
  { id: 'dusk-phantom', name: 'Dusk Phantom', suit: 'gloom', type: 'creature', cost: 6, attack: 5, health: 5, text: 'Half here, half gone.' },
  // Spells — one per suit, each a different kind of decision.
  { id: 'ember-burst', name: 'Ember Burst', suit: 'ember', type: 'spell', cost: 2, text: 'Deal 3 damage to any target.' },
  { id: 'tide-mend', name: 'Tide Mend', suit: 'tide', type: 'spell', cost: 2, text: 'Restore 6 life to yourself.' },
  { id: 'thorn-volley', name: 'Thorn Volley', suit: 'thorn', type: 'spell', cost: 3, text: 'Deal 2 damage to all enemy creatures.' },
  { id: 'gloom-veil', name: 'Gloom Veil', suit: 'gloom', type: 'spell', cost: 2, text: 'Draw 2 cards.' },
];

export function defById(id) {
  return CARD_DEFS.find((d) => d.id === id);
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildDeck(seed) {
  // 20 creatures (one each) + 10 spells (Ember Burst x3, Tide Mend x3,
  // Thorn Volley x2, Gloom Veil x2) = 30 cards, then a seeded shuffle.
  const ids = CARD_DEFS.filter((d) => d.type === 'creature').map((d) => d.id);
  ids.push('ember-burst', 'ember-burst', 'ember-burst');
  ids.push('tide-mend', 'tide-mend', 'tide-mend');
  ids.push('thorn-volley', 'thorn-volley');
  ids.push('gloom-veil', 'gloom-veil');
  const rand = mulberry32(seed);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.map((id, i) => makeCard(defById(id), i + 1));
}

let nextUid = 1;
export function makeCard(def, uid) {
  return {
    uid: uid ?? nextUid++,
    defId: def.id,
    name: def.name,
    suit: def.suit,
    type: def.type,
    cost: def.cost,
    attack: def.attack ?? 0,
    health: def.health ?? 0,
    maxHealth: def.health ?? 0,
    text: def.text,
    canAttack: false,
    justPlayed: false,
  };
}
