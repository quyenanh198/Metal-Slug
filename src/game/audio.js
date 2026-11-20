// Procedural Web Audio API synthesizer for Metal Slug 3D Arcade SFX
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

  playEvent(ev) {
    if (ev === 'shoot_hmg') this._tone(320, 0.06, 'sawtooth', 0.08, 110);
    else if (ev === 'shoot_shotgun') this._tone(180, 0.14, 'sawtooth', 0.16, 45);
    else if (ev === 'shoot_rocket') this._tone(240, 0.18, 'triangle', 0.14, 90);
    else if (ev === 'grenade') this._tone(420, 0.1, 'sine', 0.1, 640);
    else if (ev === 'explosion') this._tone(110, 0.28, 'sawtooth', 0.18, 32);
    else if (ev === 'jump') this._tone(260, 0.1, 'triangle', 0.09, 520);
    else if (ev === 'pow' || ev === 'pickup') {
      this._tone(523.25, 0.09, 'square', 0.09);
      setTimeout(() => this._tone(783.99, 0.14, 'square', 0.09), 70);
    } else if (ev === 'board') {
      this._tone(180, 0.12, 'square', 0.12, 360);
    } else if (ev === 'boss_warning') {
      [440, 330, 440].forEach((f, i) => setTimeout(() => this._tone(f, 0.18, 'sawtooth', 0.13), i * 200));
    } else if (ev === 'hit') {
      this._tone(150, 0.16, 'sawtooth', 0.15, 65);
    } else if (ev === 'victory') {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this._tone(f, 0.16, 'square', 0.11), i * 110));
    }
  }
}

export const arcadeAudio = new ArcadeAudio();
