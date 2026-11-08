// Web Audio API procedural sound engine for Lamp interactions
// Completely self-contained - zero external audio assets required

let audioCtx = null;
let humGain = null;
let humOsc = null;
let isMuted = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Pre-unlock AudioContext on first user interaction for instant playback
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      getAudioContext();
    } catch {}
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
}

export const soundManager = {
  get isMuted() {
    return isMuted;
  },

  toggleMute() {
    isMuted = !isMuted;
    if (isMuted && humGain) {
      humGain.gain.setValueAtTime(0, audioCtx ? audioCtx.currentTime : 0);
    }
    return isMuted;
  },

  setMuted(muted) {
    isMuted = muted;
    if (isMuted && humGain && audioCtx) {
      humGain.gain.setValueAtTime(0, audioCtx.currentTime);
    }
  },

  // Sound of chain beads pulling / stretching
  playChainRattle() {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const count = 4;
      for (let i = 0; i < count; i++) {
        const time = ctx.currentTime + i * 0.04 + Math.random() * 0.01;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Metallic beaded chain frequency
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2200 + Math.random() * 800, time);
        osc.frequency.exponentialRampToValueAtTime(800 + Math.random() * 400, time + 0.03);

        gain.gain.setValueAtTime(0.04, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.04);
      }
    } catch {
      // Audio not permitted or supported
    }
  },

  // Satisfying mechanical rotary/pull switch snap
  playSwitchClick(isOn = true) {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // 1. Transient click (sharp mechanical snap)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      const baseFreq = isOn ? 1400 : 1100;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.025);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);

      // 2. High metallic spring click
      const springOsc = ctx.createOscillator();
      const springGain = ctx.createGain();

      springOsc.type = 'sine';
      springOsc.frequency.setValueAtTime(isOn ? 3400 : 2800, now + 0.01);
      springOsc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

      springGain.gain.setValueAtTime(0.12, now + 0.01);
      springGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      springOsc.connect(springGain);
      springGain.connect(ctx.destination);
      springOsc.start(now + 0.01);
      springOsc.stop(now + 0.07);

      // 3. Subtle incandescent bulb filament "ting" when turning on
      if (isOn) {
        const pingOsc = ctx.createOscillator();
        const pingGain = ctx.createGain();

        pingOsc.type = 'sine';
        pingOsc.frequency.setValueAtTime(4800, now + 0.03);
        pingOsc.frequency.exponentialRampToValueAtTime(4200, now + 0.15);

        pingGain.gain.setValueAtTime(0.05, now + 0.03);
        pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        pingOsc.connect(pingGain);
        pingGain.connect(ctx.destination);
        pingOsc.start(now + 0.03);
        pingOsc.stop(now + 0.2);

        this.startHum();
      } else {
        this.stopHum();
      }
    } catch {
      // Audio fallback
    }
  },

  // Soft electric warm lamp hum
  startHum() {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (!humOsc) {
        humOsc = ctx.createOscillator();
        const humFilter = ctx.createBiquadFilter();
        humGain = ctx.createGain();

        humOsc.type = 'sawtooth';
        humOsc.frequency.setValueAtTime(60, ctx.currentTime); // 60Hz subtle electric hum

        humFilter.type = 'lowpass';
        humFilter.frequency.setValueAtTime(140, ctx.currentTime);

        humGain.gain.setValueAtTime(0.0001, ctx.currentTime);

        humOsc.connect(humFilter);
        humFilter.connect(humGain);
        humGain.connect(ctx.destination);

        humOsc.start();
      }

      const now = ctx.currentTime;
      humGain.gain.cancelScheduledValues(now);
      humGain.gain.setValueAtTime(humGain.gain.value, now);
      // Gentle fade in
      humGain.gain.linearRampToValueAtTime(0.012, now + 0.8);
    } catch {
      // Audio fallback
    }
  },

  stopHum() {
    try {
      if (humGain && audioCtx) {
        const now = audioCtx.currentTime;
        humGain.gain.cancelScheduledValues(now);
        humGain.gain.setValueAtTime(humGain.gain.value, now);
        humGain.gain.linearRampToValueAtTime(0.00001, now + 0.4);
      }
    } catch {
      // Audio fallback
    }
  },

  // Input focus or button hover tactile feedback
  playSoftClick() {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.02);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    } catch {}
  }
};
