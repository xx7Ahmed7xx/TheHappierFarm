import { startProceduralBgm, stopProceduralBgm } from './bgmEngine';

export type BgmScene = 'menu' | 'farm';

const TRACK_URL: Record<BgmScene, string> = {
  menu: '/assets/audio/bgm-menu.mp3',
  farm: '/assets/audio/bgm-farm.mp3',
};

const VOLUME = 0.34;
const FADE_MS = 600;

let scene: BgmScene = 'menu';
let audio: HTMLAudioElement | null = null;
let usingProcedural = false;
let fadeTimer: ReturnType<typeof setTimeout> | null = null;
let procDest: GainNode | null = null;
/** Bumped on stop/mute so in-flight load/play/fade callbacks cannot restart audio. */
let playbackGen = 0;

function clearFade(): void {
  if (fadeTimer !== null) {
    clearTimeout(fadeTimer);
    fadeTimer = null;
  }
}

function stopMp3(): void {
  if (!audio) {
    return;
  }
  const el = audio;
  audio = null;
  el.pause();
  el.src = '';
}

function stopAll(): void {
  clearFade();
  stopMp3();
  stopProceduralBgm();
  usingProcedural = false;
  if (procDest) {
    try {
      procDest.disconnect();
    } catch {
      /* ignore */
    }
    procDest = null;
  }
}

function startProcedural(ac: AudioContext): void {
  stopProceduralBgm();
  procDest = ac.createGain();
  procDest.gain.value = VOLUME;
  procDest.connect(ac.destination);
  startProceduralBgm(ac, procDest);
  usingProcedural = true;
}

function isPlaybackCancelled(gen: number): boolean {
  return gen !== playbackGen;
}

async function tryPlayMp3(target: BgmScene, gen: number): Promise<boolean> {
  stopMp3();
  if (isPlaybackCancelled(gen)) {
    return false;
  }
  const el = new Audio(TRACK_URL[target]);
  el.loop = true;
  el.volume = 0;
  el.preload = 'auto';

  try {
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const onReady = () => {
        if (settled) return;
        settled = true;
        el.removeEventListener('canplaythrough', onReady);
        el.removeEventListener('loadeddata', onReady);
        el.removeEventListener('error', onErr);
        resolve();
      };
      const onErr = () => {
        if (settled) return;
        settled = true;
        el.removeEventListener('canplaythrough', onReady);
        el.removeEventListener('loadeddata', onReady);
        el.removeEventListener('error', onErr);
        reject(new Error('bgm load failed'));
      };
      el.addEventListener('canplaythrough', onReady);
      el.addEventListener('loadeddata', onReady);
      el.addEventListener('error', onErr);
      el.load();
    });
    if (isPlaybackCancelled(gen)) {
      el.pause();
      el.src = '';
      return false;
    }
    await el.play();
    if (isPlaybackCancelled(gen)) {
      el.pause();
      el.src = '';
      return false;
    }
    audio = el;
    usingProcedural = false;
    stopProceduralBgm();
    if (procDest) {
      procDest.disconnect();
      procDest = null;
    }

    const startVol = 0;
    const endVol = VOLUME;
    const t0 = performance.now();
    const fadeIn = () => {
      if (isPlaybackCancelled(gen) || audio !== el) {
        fadeTimer = null;
        return;
      }
      const p = Math.min(1, (performance.now() - t0) / FADE_MS);
      el.volume = startVol + (endVol - startVol) * p;
      if (p < 1) {
        fadeTimer = window.setTimeout(fadeIn, 30);
      } else {
        fadeTimer = null;
      }
    };
    fadeIn();
    return true;
  } catch {
    el.pause();
    el.src = '';
    return false;
  }
}

export function getBgmScene(): BgmScene {
  return scene;
}

export function setBgmScene(next: BgmScene): void {
  scene = next;
}

export async function playBgm(ac: AudioContext): Promise<void> {
  const gen = playbackGen;
  const ok = await tryPlayMp3(scene, gen);
  if (isPlaybackCancelled(gen)) {
    return;
  }
  if (!ok) {
    if (!isPlaybackCancelled(gen)) {
      startProcedural(ac);
    }
    return;
  }
}

export function pauseBgm(): void {
  clearFade();
  if (audio) {
    audio.pause();
  }
  stopProceduralBgm();
}

export async function resumeBgm(ac: AudioContext): Promise<void> {
  const gen = playbackGen;
  if (isPlaybackCancelled(gen)) {
    return;
  }
  if (usingProcedural) {
    startProcedural(ac);
    return;
  }
  if (audio) {
    try {
      await audio.play();
      if (isPlaybackCancelled(gen)) {
        audio.pause();
        return;
      }
      audio.volume = VOLUME;
    } catch {
      await playBgm(ac);
    }
    return;
  }
  await playBgm(ac);
}

export async function switchBgmScene(next: BgmScene, ac: AudioContext): Promise<void> {
  if (next === scene && (audio || usingProcedural)) {
    return;
  }
  if (audio && TRACK_URL[next] === TRACK_URL[scene]) {
    scene = next;
    return;
  }
  scene = next;
  if (audio) {
    const old = audio;
    const vol = old.volume;
    const t0 = performance.now();
    const fadeOutGen = playbackGen;
    const fadeOut = () => {
      if (isPlaybackCancelled(fadeOutGen)) {
        fadeTimer = null;
        return;
      }
      const p = Math.min(1, (performance.now() - t0) / FADE_MS);
      old.volume = vol * (1 - p);
      if (p < 1) {
        fadeTimer = window.setTimeout(fadeOut, 30);
      } else {
        old.pause();
        old.src = '';
        if (audio === old) {
          audio = null;
        }
        fadeTimer = null;
        void playBgm(ac);
      }
    };
    fadeOut();
    return;
  }
  await playBgm(ac);
}

export function stopBgmPlayback(): void {
  playbackGen += 1;
  stopAll();
}
