/** Farm SFX + looping BGM (MP3 + procedural fallback). */

import {
  getBgmScene,
  playBgm,
  resumeBgm,
  setBgmScene,
  stopBgmPlayback,
  switchBgmScene,
  type BgmScene,
} from './audio/bgmPlayer';

let ctx: AudioContext | null = null;
let unlocked = false;
let bgmEnabled = true;

const BGM_STORAGE_KEY = 'happier-farm-bgm';

function readBgmPref(): boolean {
  try {
    const v = localStorage.getItem(BGM_STORAGE_KEY);
    if (v === '0') {
      return false;
    }
  } catch {
    /* ignore */
  }
  return true;
}

bgmEnabled = readBgmPref();

async function resumeContext(): Promise<AudioContext | null> {
  if (!ctx || !unlocked) {
    return null;
  }
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return null;
    }
  }
  return ctx.state === 'running' ? ctx : null;
}

async function ensureBgmRunning(): Promise<void> {
  if (!bgmEnabled) {
    return;
  }
  const ac = await resumeContext();
  if (ac) {
    await resumeBgm(ac);
  }
}

/** Call from pointerdown / keydown — required before any sound (browser policy). */
export function unlockAudio(): void {
  if (unlocked && ctx) {
    void resumeContext();
    return;
  }

  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) {
      return;
    }
    ctx = new Ctx();
    unlocked = true;
    void ctx.resume().then(() => {
      if (ctx?.state === 'running' && bgmEnabled) {
        void playBgm(ctx);
      }
    });
  } catch {
    ctx = null;
    unlocked = false;
  }
}

export function isBgmEnabled(): boolean {
  return bgmEnabled;
}

export function setBgmEnabled(on: boolean): void {
  bgmEnabled = on;
  try {
    localStorage.setItem(BGM_STORAGE_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (!on) {
    stopBgmPlayback();
    return;
  }
  void ensureBgmRunning();
}

/** Menu = login / register / boot; farm = in-game HUD. */
export function setBgmForScreen(screen: BgmScene): void {
  setBgmScene(screen);
  if (!bgmEnabled || !ctx) {
    return;
  }
  void resumeContext().then((ac) => {
    if (ac) {
      void switchBgmScene(screen, ac);
    }
  });
}

export { getBgmScene };

function playTone(
  frequency: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  gain = 0.12,
): void {
  void resumeContext().then((ac) => {
    if (!ac) {
      return;
    }

    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    amp.gain.value = gain;
    amp.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + durationSec);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + durationSec);
  });
}

export function playPlant(): void {
  playTone(420, 0.08, 'triangle', 0.1);
  window.setTimeout(() => playTone(520, 0.06, 'triangle', 0.08), 40);
}

export function playHarvest(): void {
  playTone(660, 0.07, 'sine', 0.11);
  window.setTimeout(() => playTone(880, 0.1, 'sine', 0.1), 60);
}

export function playBuy(): void {
  playTone(300, 0.05, 'square', 0.06);
  window.setTimeout(() => playTone(450, 0.08, 'square', 0.07), 50);
}

export function playError(): void {
  playTone(180, 0.15, 'sawtooth', 0.07);
}

export function playCollect(): void {
  playTone(520, 0.06, 'sine', 0.1);
  window.setTimeout(() => playTone(740, 0.08, 'sine', 0.09), 55);
}
