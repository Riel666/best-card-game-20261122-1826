// audio.js — every sound is a synthesized WebAudio oscillator: no audio
// files, no network. A short blip for playing a card, a low thud for a hit,
// a rising chime for healing, a bright arpeggio for victory, a falling
// phrase for defeat.
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  playCard() { this.tone(520, 0.12, 'triangle', 0.14); this.tone(780, 0.1, 'triangle', 0.1, 0.06); }
  hit() { this.tone(140, 0.18, 'square', 0.14); this.tone(90, 0.2, 'square', 0.1, 0.05); }
  heal() { this.tone(660, 0.15, 'sine', 0.1); this.tone(880, 0.2, 'sine', 0.1, 0.1); }
  draw() { this.tone(440, 0.06, 'sine', 0.06); }
  turn() { this.tone(330, 0.1, 'triangle', 0.08); }
  win() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.12, i * 0.12)); }
  lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, 'sine', 0.1, i * 0.14)); }
}
