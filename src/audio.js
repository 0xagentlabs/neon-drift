const NOTES = [110, 164.81, 146.83, 196, 110, 220, 146.83, 164.81];

export class NeonAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.musicTimer = null;
    this.step = 0;
    this.enabled = localStorage.getItem("neon-drift-sound") !== "off";
  }

  ensureContext() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.32;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "suspended") void this.context.resume();
    return true;
  }

  tone(frequency, duration, { type = "sine", volume = 0.12, slide = 0, delay = 0 } = {}) {
    if (!this.enabled || !this.ensureContext()) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, frequency + slide), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  play(effect) {
    if (effect === "start") {
      [220, 329.63, 440].forEach((note, index) => this.tone(note, 0.16, { type: "triangle", volume: 0.14, delay: index * 0.07 }));
    } else if (effect === "dash") {
      this.tone(180, 0.18, { type: "sawtooth", volume: 0.1, slide: 620 });
    } else if (effect === "core") {
      this.tone(659.25, 0.12, { volume: 0.16, slide: 180 });
      this.tone(987.77, 0.16, { volume: 0.1, delay: 0.06 });
    } else if (effect === "crash") {
      this.tone(135, 0.48, { type: "sawtooth", volume: 0.2, slide: -95 });
      this.tone(72, 0.4, { type: "square", volume: 0.08, slide: -38 });
    }
  }

  startMusic() {
    if (!this.enabled || !this.ensureContext() || this.musicTimer) return;
    const tick = () => {
      const note = NOTES[this.step % NOTES.length];
      this.tone(note, 0.24, { type: "triangle", volume: 0.055 });
      if (this.step % 2 === 0) this.tone(note * 2, 0.07, { type: "square", volume: 0.018 });
      this.step += 1;
    };
    tick();
    this.musicTimer = window.setInterval(tick, 280);
  }

  stopMusic() {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem("neon-drift-sound", this.enabled ? "on" : "off");
    if (!this.enabled) this.stopMusic();
    return this.enabled;
  }
}
