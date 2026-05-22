import { getLocale } from '../i18n';
import type { ClientPresentationState, FarmSnapshot } from '../types';

let badgeEl: HTMLDivElement | null = null;

function badgeHost(): HTMLElement {
  return document.querySelector<HTMLElement>('.hud-brand') ?? document.body;
}

function ensureBadgeElement(): HTMLDivElement {
  const host = badgeHost();
  if (!badgeEl) {
    badgeEl = document.createElement('div');
    badgeEl.id = 'beta-badge';
    badgeEl.className = 'beta-badge';
    badgeEl.setAttribute('role', 'status');
    badgeEl.hidden = true;
  }
  if (badgeEl.parentElement !== host) {
    host.prepend(badgeEl);
  }
  return badgeEl;
}

export function applyBetaBadge(snap: FarmSnapshot | null): void {
  const el = ensureBadgeElement();
  const p: ClientPresentationState | undefined = snap?.clientPresentation;
  if (!p?.showBetaBadge) {
    el.hidden = true;
    return;
  }
  const label =
    getLocale() === 'ar'
      ? p.betaBadgeLabelAr || p.betaBadgeLabelEn
      : p.betaBadgeLabelEn || p.betaBadgeLabelAr;
  el.textContent = label;
  el.title = label;
  el.hidden = false;
}

export function hideBetaBadge(): void {
  if (badgeEl) {
    badgeEl.hidden = true;
  }
}
