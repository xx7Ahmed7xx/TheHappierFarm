import { onLocaleChange, t } from './core';

type HudLogEntry =
  | { kind: 'key'; path: string; params?: Record<string, string | number> }
  | { kind: 'raw'; text: string };

let lastEntry: HudLogEntry | null = null;
let logElement: HTMLElement | null = null;

export type HudLogParamResolver = (
  path: string,
  params: Record<string, string | number>,
) => Record<string, string | number>;

let paramResolver: HudLogParamResolver | undefined;

/** Re-resolve dynamic params (resource names, etc.) when locale changes. */
export function setHudLogParamResolver(fn: HudLogParamResolver | undefined): void {
  paramResolver = fn;
}

export function bindHudLogElement(el: HTMLElement): void {
  logElement = el;
  refreshHudLog();
}

/** User-facing status line — re-translates on locale change. */
export function setHudLog(path: string, params?: Record<string, string | number>): void {
  lastEntry = { kind: 'key', path, params };
  renderHudLog();
}

/** Server errors / dynamic text that cannot be keyed. */
export function setHudLogRaw(text: string): void {
  lastEntry = { kind: 'raw', text };
  renderHudLog();
}

export function clearHudLog(): void {
  lastEntry = null;
  if (logElement) {
    logElement.textContent = '';
  }
}

export function refreshHudLog(): void {
  renderHudLog();
}

function renderHudLog(): void {
  if (!logElement || !lastEntry) {
    return;
  }
  if (lastEntry.kind === 'raw') {
    logElement.textContent = lastEntry.text;
    return;
  }
  const params =
    lastEntry.params && paramResolver
      ? paramResolver(lastEntry.path, lastEntry.params)
      : lastEntry.params;
  logElement.textContent = t(lastEntry.path, params);
}

onLocaleChange(() => {
  refreshHudLog();
});
