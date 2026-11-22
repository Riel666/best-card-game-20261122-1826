// ai.js — Rival Maren's mind, written so you can read it and counter it.
// She plays the cheapest card she can afford first (saving mana for the
// best play, not the first), fires Ember Burst at the biggest threat or at
// your face when it is lethal, mends when she is hurt, volleys when your
// board is wide, veils when her hand is empty — then her creatures hit your
// face when the blow is lethal, trade up when they can kill and live, and
// otherwise go face. The same brain drives the self-test's auto-player for
// the player's side, so the headless match plays by the real rules.
export function bestBurstTarget(game, side) {
  const foe = game.sides[1 - side];
  const lethal = foe.life <= 3;
  if (lethal) return { kind: 'face', side: 1 - side };
  let best = null;
  foe.board.forEach((c, i) => {
    if (c.health <= 3 && (!best || c.attack > best.card.attack)) best = { card: c, index: i };
  });
  if (best) return { kind: 'creature', side: 1 - side, index: best.index };
  return { kind: 'face', side: 1 - side };
}

export function takeTurn(game, side) {
  const actions = [];
  const me = game.sides[side];
  const foe = game.sides[1 - side];
  // 1. Spells with a clear purpose.
  let guard = 0;
  while (guard++ < 20) {
    const burst = me.hand.findIndex((c) => c.defId === 'ember-burst');
    if (burst !== -1 && me.mana >= 2) {
      const target = bestBurstTarget(game, side);
      if (target.kind === 'face' && foe.life > 3 && foe.board.some((c) => c.health <= 3)) {
        // Keep the burst for a creature trade instead of chipping face.
      }
      const r = game.playCard(side, burst, target);
      if (r.ok) { actions.push(`burst ${target.kind}`); continue; }
      break;
    }
    const mend = me.hand.findIndex((c) => c.defId === 'tide-mend');
    if (mend !== -1 && me.mana >= 2 && me.life <= 24) {
      const r = game.playCard(side, mend, null);
      if (r.ok) { actions.push('mend'); continue; }
      break;
    }
    const volley = me.hand.findIndex((c) => c.defId === 'thorn-volley');
    if (volley !== -1 && me.mana >= 3 && foe.board.length >= 2) {
      const r = game.playCard(side, volley, null);
      if (r.ok) { actions.push('volley'); continue; }
      break;
    }
    const veil = me.hand.findIndex((c) => c.defId === 'gloom-veil');
    if (veil !== -1 && me.mana >= 2 && me.hand.length <= 3) {
      const r = game.playCard(side, veil, null);
      if (r.ok) { actions.push('veil'); continue; }
      break;
    }
    break;
  }
  // 2. Creatures, cheapest first so the mana stretches furthest.
  guard = 0;
  while (guard++ < 20 && game.state === 'play') {
    const affordable = me.hand
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.type === 'creature' && c.cost <= me.mana)
      .sort((a, b) => a.c.cost - b.c.cost);
    if (!affordable.length) break;
    const r = game.playCard(side, affordable[0].i, null);
    if (!r.ok) break;
    actions.push(`play ${r.card.name}`);
  }
  // 3. Attacks: lethal first, then a trade that kills and survives, else face.
  guard = 0;
  while (guard++ < 20 && game.state === 'play') {
    const attackers = me.board.map((c, i) => ({ c, i })).filter(({ c }) => c.canAttack);
    if (!attackers.length) break;
    const { c, i } = attackers[0];
    const faceDamage = me.board.filter((x) => x.canAttack).reduce((s, x) => s + x.attack, 0);
    let target;
    if (faceDamage >= foe.life) {
      target = { kind: 'face', side: 1 - side };
    } else {
      const trade = foe.board
        .map((f, fi) => ({ f, fi }))
        .filter(({ f }) => f.health <= c.attack && f.attack < c.health)
        .sort((a, b) => b.f.attack - a.f.attack)[0];
      target = trade
        ? { kind: 'creature', side: 1 - side, index: trade.fi }
        : { kind: 'face', side: 1 - side };
    }
    const r = game.attack(side, i, target);
    if (!r.ok) break;
    actions.push(`attack ${c.name} -> ${target.kind}`);
  }
  return actions;
}
