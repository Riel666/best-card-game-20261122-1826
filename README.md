# best-card-game-20261122-1826

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Riel666/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Riel666/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Ember Court — a card duel at the court of embers. Thirty life each, mana that grows by one every turn (up to ten), and a thirty-card deck of original creatures and spells across four suits — Ember, Tide, Thorn and Gloom — each told apart by colour and shape. Play creatures, trade blows, and outlast Rival Maren, an opponent whose choices you can read: she plays cheapest first, saves her Ember Burst for a lethal blow or a big threat, mends when hurt, and trades up when she can kill and live.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Validation

Local runs (twice, fresh output dirs) wrote identical bytes:

`node main.ts` with `MAKEFUN_OUTPUT_DIR` set copies `game/` and `screenshots/` and writes `dossier.json` (604,048 bytes). Screenshots are real renders of the game in headless Chromium at 1280x800: `1-cover.jpg` (104,538 bytes), `2-play.jpg` (138,938 bytes), `3-victory.jpg` (85,734 bytes), `4-defeat.jpg` (84,420 bytes) — each under the 256 KiB cap.

Headless play-tests with the real rules: `?selftest=1` plays a full match with both sides using the real AI brain — won in 26 turns, score 293, life 22 vs -1. Node smoke tests of the pure logic (deck, mana curve, spell effects, AI decisions, win/lose conditions) all pass.

## Play

Click a creature card in your hand to play it. Click one of your creatures, then an enemy creature or the rival's life orb, to attack. Spells: Ember Burst deals 3 damage to any target (click it, then a target), Tide Mend restores 6 life, Thorn Volley hits every enemy creature for 2, Gloom Veil draws 2 cards. Creatures cannot attack the turn they arrive. Space ends your turn, R plays again, M toggles sound, Escape clears a selection.
