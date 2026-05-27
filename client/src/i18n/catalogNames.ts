import type { Locale } from './types';
import { getLocale } from './core';
import {
  ANIMAL_NAMES_AR,
  CROP_NAMES_AR,
  DECORATION_NAMES_AR,
  FACTORY_NAMES_AR,
  RESOURCE_NAMES_AR,
} from './catalogFallbacks';

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
  id: number,
  fallback: string,
  names?: { displayNameEn?: string; displayNameAr?: string },
): string {
  const en = names?.displayNameEn?.trim() || fallback;
  const ar = names?.displayNameAr?.trim() || CROP_NAMES_AR[id];
  return pickLocaleName(getLocale(), en, ar, fallback);
}

export function catalogAnimalName(
  id: number,
  fallback: string,
  names?: { displayNameEn?: string; displayNameAr?: string },
): string {
  const en = names?.displayNameEn?.trim() || fallback;
  const ar = names?.displayNameAr?.trim() || ANIMAL_NAMES_AR[id];
  return pickLocaleName(getLocale(), en, ar, fallback);
}

export function catalogFactoryName(
  id: number,
  fallback: string,
  names?: { displayNameEn?: string; displayNameAr?: string },
): string {
  const en = names?.displayNameEn?.trim() || fallback;
  const ar = names?.displayNameAr?.trim() || FACTORY_NAMES_AR[id];
  return pickLocaleName(getLocale(), en, ar, fallback);
}

export function catalogDecorationName(
  id: number,
  fallback: string,
  names?: { displayNameEn?: string; displayNameAr?: string },
): string {
  const en = names?.displayNameEn?.trim() || fallback;
  const ar = names?.displayNameAr?.trim() || DECORATION_NAMES_AR[id];
  return pickLocaleName(getLocale(), en, ar, fallback);
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
  const en = names?.displayNameEn?.trim() || fallback;
  const ar = names?.displayNameAr?.trim() || RESOURCE_NAMES_AR[key];
  return pickLocaleName(getLocale(), en, ar, fallback ?? key);
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
