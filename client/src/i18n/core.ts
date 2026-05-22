import { ar } from './ar';
import { en } from './en';
import type { Locale, MessageTree } from './types';

const STORAGE_KEY = 'happier-farm-locale';

const trees: Record<Locale, MessageTree> = { en, ar };

let locale: Locale = 'en';
const listeners = new Set<() => void>();

function readStoredLocale(): Locale {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'ar' || v === 'en') {
      return v;
    }
  } catch {
    /* ignore */
  }
  return 'en';
}

function resolve(tree: MessageTree, path: string): string | undefined {
  const parts = path.split('.');
  let cur: string | MessageTree | undefined = tree;
  for (const p of parts) {
    if (cur === undefined || typeof cur === 'string') {
      return undefined;
    }
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = params[key];
    return v === undefined ? `{${key}}` : String(v);
  });
}

export function getLocale(): Locale {
  return locale;
}

export function setLocale(next: Locale): void {
  if (next === locale) {
    return;
  }
  locale = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = next;
  document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  for (const fn of listeners) {
    fn();
  }
}

export function onLocaleChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Translate a dotted message key (English tree is the source of keys). */
export function t(path: string, params?: Record<string, string | number>): string {
  const raw =
    resolve(trees[locale], path) ??
    resolve(trees.en, path) ??
    path;
  return interpolate(raw, params);
}

export function initI18n(): void {
  locale = readStoredLocale();
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
}
