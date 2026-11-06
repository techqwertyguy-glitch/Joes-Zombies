/**
 * Procedural Web Audio API sound synthesizer for Pixel Gun 3D.
 * 100% procedural with zero external audio assets/404s.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.6;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, gainPeak: number = 0.3, pitchDrop?: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (pitchDrop !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * pitchDrop), now + duration);
      }

      gain.gain.setValueAtTime(gainPeak * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // AudioContext policy gracefully caught
    }
  }

  private playNoise(duration: number, gainPeak: number = 0.25, filterFreq: number = 1200) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainPeak * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch {
      // Ignore
    }
  }

  public playShoot(weaponId: string) {
    switch (weaponId) {
      case 'combat_knife':
        // Melee slash whoosh
        this.playNoise(0.12, 0.2, 800);
        this.playTone(320, 'triangle', 0.1, 0.15, 0.4);
        break;

      case 'pixel_pistol':
        // Crisp 8-bit snap
        this.playNoise(0.09, 0.25, 2400);
        this.playTone(480, 'square', 0.08, 0.2, 0.3);
        break;

      case 'pixel_ak47':
        // Punchy metallic automatic crack
        this.playNoise(0.12, 0.3, 1800);
        this.playTone(340, 'sawtooth', 0.1, 0.25, 0.35);
        break;

      case 'pixel_shotgun':
        // Deep boom with wide noise burst
        this.playNoise(0.24, 0.45, 900);
        this.playTone(180, 'sawtooth', 0.18, 0.35, 0.2);
        break;

      case 'pixel_sniper':
        // Heavy supersonic crack & resonance
        this.playNoise(0.35, 0.4, 3200);
        this.playTone(620, 'square', 0.22, 0.35, 0.15);
        this.playTone(120, 'sine', 0.4, 0.3, 0.5);
        break;

      case 'rocket_jumper':
        // Heavy rocket hiss & motor thrust
        this.playNoise(0.25, 0.35, 1200);
        this.playTone(220, 'sawtooth', 0.3, 0.3, 1.8);
        break;

      case 'prototype_laser':
        // Resonant sci-fi beam sweep
        this.playTone(950, 'sawtooth', 0.25, 0.35, 0.18);
        this.playTone(440, 'sine', 0.25, 0.2, 0.5);
        break;

      default:
        this.playTone(400, 'square', 0.1, 0.2, 0.3);
        break;
    }
  }

  public playHitmarker(isCrit: boolean) {
    if (isCrit) {
      // High double chime
      this.playTone(1250, 'triangle', 0.09, 0.35);
      setTimeout(() => this.playTone(1750, 'triangle', 0.12, 0.4), 30);
    } else {
      // Crisp metallic ding
      this.playTone(980, 'triangle', 0.08, 0.25);
    }
  }

  public playExplosion() {
    this.playNoise(0.45, 0.5, 600);
    this.playTone(130, 'sine', 0.4, 0.45, 0.2);
    this.playTone(80, 'sawtooth', 0.35, 0.3, 0.3);
  }

  public playJump() {
    this.playTone(260, 'sine', 0.14, 0.2, 1.8);
  }

  public playJumpPad() {
    // Springy double rising boing
    this.playTone(280, 'triangle', 0.25, 0.35, 2.5);
    this.playTone(560, 'sine', 0.2, 0.25, 1.8);
  }

  public playRocketJump() {
    this.playNoise(0.3, 0.4, 1500);
    this.playTone(160, 'sawtooth', 0.3, 0.4, 2.2);
  }

  public playPlayerHurt() {
    this.playNoise(0.18, 0.35, 700);
    this.playTone(110, 'sawtooth', 0.16, 0.3, 0.6);
  }

  public playTelegraph() {
    // Warning chirp
    this.playTone(660, 'square', 0.1, 0.2, 1.2);
  }

  public playCoin() {
    this.playTone(987.77, 'sine', 0.08, 0.25);
    setTimeout(() => this.playTone(1318.51, 'sine', 0.15, 0.3), 60);
  }

  public playPowerup() {
    this.playTone(440, 'triangle', 0.1, 0.2, 1.4);
    setTimeout(() => this.playTone(660, 'triangle', 0.15, 0.25, 1.2), 70);
  }

  public playReload() {
    // Click-clack
    this.playNoise(0.06, 0.15, 3000);
    setTimeout(() => {
      this.playNoise(0.08, 0.2, 3500);
      this.playTone(480, 'square', 0.05, 0.1);
    }, 150);
  }

  public playEmptyClip() {
    this.playTone(650, 'square', 0.04, 0.15);
  }

  public playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.25, 0.3);
      }, idx * 120);
    });
  }

  public playGameOver() {
    const notes = [440, 392, 349.23, 293.66];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.3, 0.25, 0.8);
      }, idx * 160);
    });
  }
}

export const soundEngine = new SoundEngine();
