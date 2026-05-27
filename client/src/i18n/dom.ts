import { isBgmEnabled, setBgmEnabled } from '../audio';
import { applyBetaBadge } from '../ui/betaBadge';
import { getHudSnapshot } from '../ui/gameHud';
import { refreshBootLocale } from '../ui/bootLoader';
import { syncMobileMenuLocale } from '../ui/mobileMenu';
import { getLocale, onLocaleChange, setLocale, t } from './core';
import { bindFormValidation } from './formValidation';
import type { Locale } from './types';

function setText(sel: string, key: string, params?: Record<string, string | number>): void {
  const text = t(key, params);
  document.querySelectorAll(sel).forEach((el) => {
    el.textContent = text;
  });
}

function setPlaceholders(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (!key) {
      return;
    }
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.placeholder = t(key);
    }
  });
}

function setTitles(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      el.title = t(key);
    }
  });
}

function setAriaLabels(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria-label');
    if (key) {
      el.setAttribute('aria-label', t(key));
    }
  });
}

function setLabelText(forId: string, key: string): void {
  const input = document.querySelector<HTMLInputElement>(`#${forId}`);
  if (!input) {
    return;
  }
  const label = input.closest('label');
  if (!label) {
    return;
  }
  const span = label.querySelector('[data-i18n]');
  if (span) {
    span.textContent = t(key);
    return;
  }
  const text = t(key);
  const child = label.firstChild;
  if (child?.nodeType === Node.TEXT_NODE) {
    child.textContent = `${text} `;
  } else {
    label.insertBefore(document.createTextNode(`${text} `), input);
  }
}

type LangSwitcherPlacement = 'overlay' | 'hud';

function langSwitcherHost(placement: LangSwitcherPlacement): HTMLElement {
  if (placement === 'hud') {
    return document.querySelector<HTMLElement>('.stats') ?? document.body;
  }
  return document.body;
}

function ensureGlobalLangSwitcher(): void {
  let wrap = document.querySelector<HTMLDivElement>('#site-lang-switcher');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'site-lang-switcher';
    document.body.appendChild(wrap);
  }

  if (!wrap.querySelector('.lang-btn')) {
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', t('lang.switch'));

    const mk = (code: Locale, labelKey: string) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-btn';
      btn.dataset.locale = code;
      btn.textContent = t(labelKey);
      btn.setAttribute('aria-pressed', String(getLocale() === code));
      btn.addEventListener('click', () => {
        setLocale(code);
      });
      return btn;
    };

    wrap.append(mk('en', 'lang.en'), mk('ar', 'lang.ar'));
    ensureGlobalMusicButton(wrap);
  }

  refreshLangButtons();
  refreshMusicButton();
}

function ensureGlobalMusicButton(wrap: HTMLElement): void {
  if (wrap.querySelector('#btn-music-global')) {
    return;
  }
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'btn-music-global';
  btn.className = 'music-btn';
  btn.addEventListener('click', () => {
    setBgmEnabled(!isBgmEnabled());
    refreshMusicButton();
  });
  wrap.appendChild(btn);
}

export function setLangSwitcherPlacement(placement: LangSwitcherPlacement): void {
  ensureGlobalLangSwitcher();
  const wrap = document.querySelector<HTMLDivElement>('#site-lang-switcher')!;
  const host = langSwitcherHost(placement);
  const before = placement === 'hud' ? host.querySelector('#btn-refresh') : null;

  wrap.classList.remove('site-lang-switcher--overlay', 'site-lang-switcher--hud');
  wrap.classList.add(
    placement === 'hud' ? 'site-lang-switcher--hud' : 'site-lang-switcher--overlay',
  );

  if (placement === 'hud') {
    wrap.hidden = false;
    if (before) {
      host.insertBefore(wrap, before);
    } else {
      host.appendChild(wrap);
    }
  } else {
    wrap.hidden = false;
    if (wrap.parentElement !== document.body) {
      document.body.appendChild(wrap);
    }
  }
}

export function refreshMusicButton(): void {
  const on = isBgmEnabled();
  const label = t(on ? 'hud.musicOn' : 'hud.musicOff');
  const icon = on ? '♪' : '🔇';
  document.querySelectorAll<HTMLButtonElement>('#btn-music-global').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(on));
    btn.title = label;
    btn.textContent = icon;
  });
}

function refreshLangButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach((btn) => {
    const code = btn.dataset.locale as Locale;
    btn.setAttribute('aria-pressed', String(getLocale() === code));
    btn.textContent = t(code === 'en' ? 'lang.en' : 'lang.ar');
  });
  const wrap = document.querySelector('#site-lang-switcher');
  if (wrap) {
    wrap.setAttribute('aria-label', t('lang.switch'));
  }
}

export function applyStaticDomLocale(): void {
  document.documentElement.lang = getLocale();
  document.documentElement.dir = getLocale() === 'ar' ? 'rtl' : 'ltr';

  document.title = t('brand.gameName');
  setText('.auth-game-name, .boot-game-name, .hud-game-title', 'brand.gameName');
  setText('#page-login .auth-title', 'auth.loginTitle');
  setText('#page-login .auth-tagline', 'auth.loginTagline');
  setText('#page-register .auth-title', 'auth.registerTitle');
  setText('#page-register .auth-tagline', 'auth.registerTagline');
  setLabelText('login-email', 'auth.email');
  setLabelText('login-password', 'auth.password');
  setLabelText('register-display-name', 'auth.displayName');
  setLabelText('register-email', 'auth.email');
  setLabelText('register-password', 'auth.password');
  setText('#btn-login', 'auth.loginBtn');
  setText('#btn-register', 'auth.registerBtn');
  setText('#go-register', 'auth.createAccount');
  setText('#go-login', 'auth.goLogin');
  setText('#page-login .auth-switch > span', 'auth.newHere');
  setText('#page-register .auth-switch > span', 'auth.haveAccount');

  setText('#btn-refresh, #btn-refresh-mobile', 'hud.sync');
  setText('#btn-logout, #btn-logout-mobile', 'hud.logout');
  setText('#btn-collect-animals', 'hud.collectAnimals');
  setText('#btn-collect-factories', 'hud.collectFactories');
  setText('#btn-upgrade-barn', 'hud.upgradeBarn');
  setText('#farm-pan-hint', 'farm.panHint');
  setText('#farm-modal-cancel', 'modal.cancel');
  setText('#farm-modal-confirm', 'modal.confirm');

  setPlaceholders();
  setTitles();
  setAriaLabels();

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  const drawerClose = document.querySelector<HTMLButtonElement>('#mobile-drawer-close');
  if (drawerClose) {
    drawerClose.setAttribute('aria-label', t('mobile.close'));
  }

  ensureGlobalLangSwitcher();
  refreshBootLocale();
  syncMobileMenuLocale();
}

export function bindDomLocale(): void {
  applyStaticDomLocale();
  bindFormValidation();
  setLangSwitcherPlacement(
    document.querySelector<HTMLDivElement>('#app')?.hidden === false ? 'hud' : 'overlay',
  );
  onLocaleChange(() => {
    applyStaticDomLocale();
    document.dispatchEvent(new CustomEvent('localechange'));
    window.dispatchEvent(new CustomEvent('farm-localechange'));
    applyBetaBadge(getHudSnapshot());
  });
}
