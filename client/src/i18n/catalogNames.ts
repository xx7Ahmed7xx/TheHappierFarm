import type { Locale } from './types';
import { getLocale } from './core';

function pickLocaleName(
  locale: Locale,
  en: string | undefined,
  ar: string | undefined,
  fallback: string,
): string {
  const enName = en?.trim();
  const arName = ar?.trim();
  if (locale === 'ar' && arName) {
    return arName;
  }
  if (enName) {
    return enName;
  }
  if (arName) {
    return arName;
  }
  return fallback;
}

export function catalogCropName(
  _id: number,
  fallback: string,
  names?: { displayNameEn?: string; displayNameAr?: string },
): string {
  return pickLocaleName(getLocale(), names?.displayNameEn, names?.displayNameAr, fallback);
}

export function catalogAnimalName(
  _id: number,
  fallback: string,
  names?: { displayNameEn?: string; displayNameAr?: string },
): string {
  return pickLocaleName(getLocale(), names?.displayNameEn, names?.displayNameAr, fallback);
}

export function catalogFactoryName(
  _id: number,
  fallback: string,
  names?: { displayNameEn?: string; displayNameAr?: string },
): string {
  return pickLocaleName(getLocale(), names?.displayNameEn, names?.displayNameAr, fallback);
}

export function catalogDecorationName(
  _id: number,
  fallback: string,
  names?: { displayNameEn?: string; displayNameAr?: string },
): string {
  return pickLocaleName(getLocale(), names?.displayNameEn, names?.displayNameAr, fallback);
}

export function catalogResourceName(
  code: string,
  fallback?: string,
  names?: { displayNameEn?: string; displayNameAr?: string },
): string {
  const key = code.trim().toLowerCase();
  if (key === 'none') {
    return '—';
  }
  return pickLocaleName(getLocale(), names?.displayNameEn, names?.displayNameAr, fallback ?? key);
}

/** Resolve resource display from farm snapshot catalog when available. */
export function resourceNameFromSnapshot(
  snap: { resourceCatalog: { code: string; displayNameEn: string; displayNameAr: string }[] },
  code: string,
  fallback?: string,
): string {
  const row = snap.resourceCatalog.find((r) => r.code === code.trim().toLowerCase());
  return catalogResourceName(code, fallback, row);
}
