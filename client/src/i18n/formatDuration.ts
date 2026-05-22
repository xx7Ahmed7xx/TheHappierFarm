import { getLocale } from './core';
import type { Locale } from './types';

type UnitKey = 's' | 'm' | 'h' | 'd';

const UNITS: Record<Locale, Record<UnitKey, string>> = {
  en: { s: 's', m: 'm', h: 'h', d: 'd' },
  ar: { s: 'ث', m: 'د', h: 'س', d: 'ي' },
};

/** Compact countdown / duration for timers and shop (e.g. 30s, 2h · 30ث، 2س). */
export function formatDuration(totalSeconds: number): string {
  const sec = Math.max(0, Math.ceil(totalSeconds));
  const u = UNITS[getLocale()];

  if (sec < 60) {
    return `${sec}${u.s}`;
  }

  if (sec < 3600) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}${u.m} ${s}${u.s}` : `${m}${u.m}`;
  }

  if (sec < 86400) {
    const h = Math.floor(sec / 3600);
    const rem = sec % 3600;
    const m = Math.floor(rem / 60);
    if (m > 0) {
      return `${h}${u.h} ${m}${u.m}`;
    }
    return `${h}${u.h}`;
  }

  const d = Math.floor(sec / 86400);
  const rem = sec % 86400;
  const h = Math.floor(rem / 3600);
  if (h > 0) {
    return `${d}${u.d} ${h}${u.h}`;
  }
  return `${d}${u.d}`;
}
