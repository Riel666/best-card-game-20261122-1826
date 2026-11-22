// main.js — bootstrap: pose a shot state, run the headless self-test, or
// show the title screen; then the repaint loop. The game itself lives in
// game.js (rules), ai.js (the rival), render.js (one frame) and input.js
// (clicks and keys); this file only wires them to the page and runs the
// rival's turn on a timer so you can watch her think.
import { CardGame } from './game.js';
import { takeTurn } from './ai.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { drawGame } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const sfx = new Sfx();
const game = new CardGame();

const ui = {
  get selectedHand() { return input.selectedHand; },
  get selectedAttacker() { return input.selectedAttacker; },
  get targeting() { return input.targeting(); },
  mouse: { x: 0, y: 0 },
};

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  ui.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
  ui.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  sfx.ensure();
  input.handleClick(game, sfx, x, y);
});

window.addEventListener('keydown', (e) => {
  if (e.key === ' ') e.preventDefault();
  input.handleKey(game, sfx, e.key);
});

const params = new URLSearchParams(window.location.search);
if (params.get('selftest')) {
  // Headless play-test: both sides play with the real rules (the player's
  // side uses the same AI brain), in a tight loop with no animation
  // frames, then report the result in the title and #selftest.
  game.startMatch();
  const report = document.createElement('div');
  report.id = 'selftest';
  report.style.cssText = 'position:fixed;left:0;top:0;z-index:99;background:#000;color:#fff;font:14px monospace;padding:4px 8px;';
  document.body.appendChild(report);
  let turns = 0;
  let result = null;
  while (game.state === 'play' && turns < 200) {
    takeTurn(game, game.turn);
    if (game.state !== 'play') break;
    game.endTurn();
    turns++;
  }
  if (game.state === 'win') {
    result = `PASS match won in ${turns} turns, score ${game.score}, life ${game.sides[0].life} vs ${game.sides[1].life}`;
  } else if (game.state === 'lose') {
    result = `PASS match lost in ${turns} turns, score ${game.score}, life ${game.sides[0].life} vs ${game.sides[1].life}`;
  } else {
    result = 'FAIL timeout after 200 turns';
  }
  drawGame(ctx, game, ui);
  report.textContent = `SELFTEST ${result}`;
  document.title = `SELFTEST ${result}`;
} else {
  const shot = params.get('shot');
  if (shot) {
    // A posed screenshot state: draw one frame and stop.
    applyShot(game, shot);
    drawGame(ctx, game, ui);
  } else {
    let last = performance.now();
    let aiTimer = 0;
    let aiStarted = false;
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (game.state === 'play' && game.turn === 1) {
        // The rival takes a beat to think, then plays her whole turn.
        aiTimer += dt;
        if (!aiStarted && aiTimer > 0.7) {
          aiStarted = true;
          const before = game.state;
          takeTurn(game, 1);
          if (game.state === 'play' && before === 'play') game.endTurn();
          sfx.turn();
          aiTimer = 0;
          aiStarted = false;
        }
      } else {
        aiTimer = 0;
        aiStarted = false;
      }
      if (game.state === 'win' && !frame.won) { frame.won = true; sfx.win(); }
      if (game.state === 'lose' && !frame.lost) { frame.lost = true; sfx.lose(); }
      drawGame(ctx, game, ui);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}
