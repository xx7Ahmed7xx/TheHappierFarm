/**
 * Runtime API base URL loaded from /config.json (copied to dist/ on build).
 * Edit config.json on the server after deploy — no rebuild required.
 *
 * - apiBaseUrl empty → same origin (dev via Vite proxy, or API served on same host)
 * - apiBaseUrl set   → cross-origin calls to e.g. https://api.thehappierfarmx7.click
 */

export type RuntimeConfig = {
  /** API origin only, no path, no trailing slash. Example: https://api.thehappierfarmx7.click */
  apiBaseUrl?: string;
};

let apiBase = '';

function normalizeOrigin(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.replace(/\/+$/, '');
}

export async function loadRuntimeConfig(): Promise<void> {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (!res.ok) {
      return;
    }
    const data = (await res.json()) as RuntimeConfig;
    apiBase = normalizeOrigin(data.apiBaseUrl);
  } catch {
    /* missing config.json — use same-origin /api (dev proxy or co-hosted API) */
  }
}

/** Resolve `/api/...` or `/hubs/...` against optional apiBaseUrl. */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!apiBase) {
    return p;
  }
  return `${apiBase}${p}`;
}

export function getApiBaseUrl(): string {
  return apiBase;
}

export function hubGameUrl(): string {
  return apiUrl('/hubs/game');
}
