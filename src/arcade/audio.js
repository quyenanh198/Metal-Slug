// Procedural Web Audio synth for the arcade sound effects (no sound files are bundled).
class ArcadeAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  _ctx() {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  _tone(freq, dur, type = 'square', vol = 0.12, endFreq = null) {
    const ctx = this._ctx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  }

  // ev = event name from src/arcade/game.js
  playEvent(ev) {
    if (ev === 'shoot') this._tone(660, 0.05, 'square', 0.07, 220);
    else if (ev === 'hmg') this._tone(320, 0.05, 'sawtooth', 0.07, 110);
    else if (ev === 'shotgun') this._tone(180, 0.16, 'sawtooth', 0.16, 45);
    else if (ev === 'rocket') this._tone(240, 0.2, 'triangle', 0.14, 90);
    else if (ev === 'knife') this._tone(900, 0.06, 'triangle', 0.08, 1500);
    else if (ev === 'throw' || ev === 'enemyThrow') this._tone(420, 0.1, 'sine', 0.08, 640);
    else if (ev === 'explode') this._tone(110, 0.32, 'sawtooth', 0.18, 32);
    else if (ev === 'jump') this._tone(260, 0.08, 'triangle', 0.06, 520);
    else if (ev === 'bossShoot') this._tone(200, 0.25, 'sawtooth', 0.12, 520);
    else if (ev === 'bossCannon') this._tone(70, 0.4, 'sawtooth', 0.2, 30);
    else if (ev === 'bossDeploy') [140, 120, 100].forEach((f, i) => setTimeout(() => this._tone(f, 0.18, 'square', 0.1), i * 160));
    else if (ev === 'bossAppear') [196, 185, 196, 233].forEach((f, i) => setTimeout(() => this._tone(f, 0.2, 'square', 0.1), i * 220));
    else if (ev === 'bossDie') [262, 196, 131, 98].forEach((f, i) => setTimeout(() => this._tone(f, 0.3, 'sawtooth', 0.14, f / 2), i * 200));
    else if (ev === 'enemyDie') this._tone(520, 0.18, 'square', 0.06, 160);
    else if (ev === 'playerDie') [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this._tone(f, 0.16, 'square', 0.1), i * 120));
    else if (ev === 'pickup' || ev === 'powFree') {
      this._tone(523.25, 0.09, 'square', 0.09);
      setTimeout(() => this._tone(783.99, 0.14, 'square', 0.09), 70);
    } else if (ev === 'thankYou' || ev === 'weapon') {
      [659, 784, 1046].forEach((f, i) => setTimeout(() => this._tone(f, 0.1, 'square', 0.09), i * 80));
    } else if (ev === 'go') {
      [784, 784].forEach((f, i) => setTimeout(() => this._tone(f, 0.08, 'square', 0.1), i * 140));
    } else if (ev === 'missionStart') {
      [392, 523, 659, 784].forEach((f, i) => setTimeout(() => this._tone(f, 0.14, 'square', 0.1), i * 120));
    } else if (ev === 'missionComplete') {
      [523, 659, 784, 1046, 784, 1046].forEach((f, i) => setTimeout(() => this._tone(f, 0.18, 'square', 0.11), i * 140));
    }
  }
}

export const arcadeAudio = new ArcadeAudio();
