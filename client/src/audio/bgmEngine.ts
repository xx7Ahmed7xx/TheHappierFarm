/**
 * Procedural fallback BGM — acoustic folk loop (used only if MP3 files fail to load).
 */

let ac: AudioContext | null = null;
let master: GainNode | null = null;
let schedulerId: ReturnType<typeof setInterval> | null = null;
let step = 0;
let chordIdx = 0;

const BEAT_SEC = 60 / 96;
const CHORDS = [
  { root: 196.0, notes: [196, 246.94, 293.66, 392] },
  { root: 164.81, notes: [164.81, 196, 246.94, 329.63] },
  { root: 261.63, notes: [261.63, 329.63, 392, 523.25] },
  { root: 220.0, notes: [220, 277.18, 329.63, 440] },
];

const MELODY = [
  392, 440, 523.25, 587.33, 523.25, 440, 392, 349.23,
  392, 440, 493.88, 440, 392, 349.23, 329.63, 293.66,
];

function pluck(freq: number, time: number, vol: number, dur = 0.22): void {
  if (!ac || !master) return;
  const o1 = ac.createOscillator();
  const o2 = ac.createOscillator();
  const g = ac.createGain();
  const f = ac.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 2400;
  o1.type = 'triangle';
  o2.type = 'triangle';
  o1.frequency.value = freq;
  o2.frequency.value = freq * 1.005;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(vol, time + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  o1.connect(g);
  o2.connect(g);
  g.connect(f);
  f.connect(master);
  o1.start(time);
  o2.start(time);
  o1.stop(time + dur + 0.05);
  o2.stop(time + dur + 0.05);
}

function bass(root: number, time: number): void {
  if (!ac || !master) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.value = root * 0.5;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(0.07, time + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, time + BEAT_SEC * 3.8);
  o.connect(g);
  g.connect(master);
  o.start(time);
  o.stop(time + BEAT_SEC * 4);
}

function shaker(time: number): void {
  if (!ac || !master) return;
  const len = Math.floor(ac.sampleRate * 0.06);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  const src = ac.createBufferSource();
  const g = ac.createGain();
  const f = ac.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 5200;
  src.buffer = buf;
  g.gain.value = 0.018;
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(time);
  src.stop(time + 0.06);
}

function tick(): void {
  if (!ac || !master) return;
  const t = ac.currentTime + 0.05;
  const beat = step % 16;
  if (beat % 4 === 0) {
    chordIdx = Math.floor(beat / 4) % CHORDS.length;
    const ch = CHORDS[chordIdx]!;
    bass(ch.root, t);
  }
  if (beat % 2 === 1) {
    shaker(t);
  }
  const mel = MELODY[beat % MELODY.length]!;
  if (beat % 2 === 0 || beat === 7 || beat === 15) {
    pluck(mel, t, 0.055);
  }
  step++;
}

export function startProceduralBgm(context: AudioContext, destination: AudioNode): void {
  stopProceduralBgm();
  ac = context;
  master = context.createGain();
  master.gain.value = 0.55;
  master.connect(destination);
  step = 0;
  chordIdx = 0;
  tick();
  schedulerId = window.setInterval(tick, BEAT_SEC * 1000);
}

export function stopProceduralBgm(): void {
  if (schedulerId !== null) {
    clearInterval(schedulerId);
    schedulerId = null;
  }
  if (master) {
    try {
      master.disconnect();
    } catch {
      /* ignore */
    }
    master = null;
  }
  ac = null;
}
