// src/audio/AudioManager.js
// Hệ thống âm thanh Web Audio API tổng hợp trực tiếp (không cần tệp âm thanh ngoài)
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.lastStepTime = 0;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    } catch (_) {}
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTone(freq, duration = 0.12, type = 'sine', gainVal = 0.08, slideTo = null) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch (_) {}
  }

  playClick() {
    this.playTone(620, 0.06, 'triangle', 0.06, 420);
  }

  playSuccess() {
    this.playTone(523.25, 0.1, 'sine', 0.07);
    setTimeout(() => this.playTone(659.25, 0.1, 'sine', 0.07), 85);
    setTimeout(() => this.playTone(783.99, 0.18, 'sine', 0.08), 170);
  }

  playAlert() {
    this.playTone(440, 0.12, 'sawtooth', 0.05, 360);
    setTimeout(() => this.playTone(360, 0.15, 'sawtooth', 0.05, 300), 130);
  }

  playPhoneRing() {
    this.playTone(880, 0.14, 'sine', 0.07, 1100);
    setTimeout(() => this.playTone(1100, 0.16, 'sine', 0.07, 880), 160);
  }

  playDoor() {
    this.playTone(190, 0.18, 'sine', 0.06, 120);
  }

  playStep(sprint = false) {
    const now = performance.now();
    const interval = sprint ? 260 : 410;
    if (now - this.lastStepTime < interval) return;
    this.lastStepTime = now;
    this.playTone(sprint ? 125 : 95, 0.045, 'triangle', 0.025, 60);
  }

  playWhistle() {
    this.playTone(2750, 0.28, 'sine', 0.06, 2600);
    setTimeout(() => this.playTone(2820, 0.18, 'sine', 0.05, 2500), 300);
  }

  playGoal() {
    this.playTone(261.63, 0.2, 'triangle', 0.09);
    setTimeout(() => this.playTone(329.63, 0.2, 'triangle', 0.09), 120);
    setTimeout(() => this.playTone(392.0, 0.22, 'triangle', 0.09), 240);
    setTimeout(() => this.playTone(523.25, 0.45, 'triangle', 0.1), 360);
  }
}
