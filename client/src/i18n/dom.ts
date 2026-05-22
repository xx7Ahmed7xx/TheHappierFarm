import { isBgmEnabled, setBgmEnabled } from '../audio';
import { applyBetaBadge } from '../ui/betaBadge';
import { getHudSnapshot } from '../ui/gameHud';
import { refreshBootLocale } from '../ui/bootLoader';
import { getLocale, onLocaleChange, setLocale, t } from './core';
import type { Locale } from './types';

function setText(sel: string, key: string, params?: Record<string, string | number>): void {
  const text = t(key, params);
  document.querySelectorAll(sel).forEach((el) => {
    el.textContent = text;
  });
}

function setLabelText(forId: string, key: string): void {
  const input = document.querySelector<HTMLInputElement>(`#${forId}`);
  if (!input) {
    return;
  }
  const label = input.closest('label');
  if (label) {
    const text = t(key);
    const child = label.firstChild;
    if (child?.nodeType === Node.TEXT_NODE) {
      child.textContent = `${text} `;
    } else {
      label.insertBefore(document.createTextNode(`${text} `), input);
    }
  }
}

type LangSwitcherPlacement = 'overlay' | 'hud';

function langSwitcherHost(placement: LangSwitcherPlacement): HTMLElement {
  if (placement === 'hud') {
    return document.querySelector<HTMLElement>('.stats') ?? document.body;
  }
  return document.body;
}

/** Language toggle on auth/boot (overlay) and in the in-game header bar. */
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
  const before =
    placement === 'hud' ? host.querySelector('#btn-refresh') : null;

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
  const loginSwitch = document.querySelector('#page-login .auth-switch');
  if (loginSwitch) {
    loginSwitch.childNodes[0].textContent = `${t('auth.newHere')} `;
  }
  const regSwitch = document.querySelector('#page-register .auth-switch');
  if (regSwitch) {
    regSwitch.childNodes[0].textContent = `${t('auth.haveAccount')} `;
  }

  setText('.dock-tools .dock-label', 'tools.label');
  setText('#tool-plant span:last-child', 'tools.plant');
  setText('#tool-harvest span:last-child', 'tools.harvest');
  setText('#tool-place span:last-child', 'tools.place');
  setText('#tool-pickup span:last-child', 'tools.store');
  setText('#tool-pan span:last-child', 'tools.move');
  setText('.dock-hand .dock-label', 'tools.inHand');
  setText('.dock-inventory .dock-label', 'inventory.title');
  setText('.inv-filter[data-inv-filter="all"]', 'inventory.all');
  setText('.inv-filter[data-inv-filter="crops"]', 'inventory.crops');
  setText('.inv-filter[data-inv-filter="animal"]', 'inventory.animal');
  setText('.inv-filter[data-inv-filter="factory"]', 'inventory.factory');
  setText('.inv-filter[data-inv-filter="build"]', 'inventory.build');
  setText('#btn-collect-animals', 'hud.collectAnimals');
  setText('#btn-collect-factories', 'hud.collectFactories');
  setText('#farm-pan-hint', 'farm.panHint');
  setText('.shop-tab[data-shop-tab="seeds"]', 'shop.crops');
  setText('.shop-tab[data-shop-tab="animals"]', 'shop.animals');
  setText('.shop-tab[data-shop-tab="factories"]', 'shop.factories');
  setText('.shop-tab[data-shop-tab="decorations"]', 'shop.decor');
  setText('.shop-tab[data-shop-tab="expansion"]', 'shop.expand');
  refreshMusicButton();
  setText('#btn-refresh', 'hud.sync');
  setText('#btn-logout', 'hud.logout');
  setText('#farm-modal-cancel', 'modal.cancel');

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  ensureGlobalLangSwitcher();
  refreshBootLocale();
}

export function bindDomLocale(): void {
  applyStaticDomLocale();
  setLangSwitcherPlacement(
    document.querySelector<HTMLDivElement>('#app')?.hidden === false
      ? 'hud'
      : 'overlay',
  );
  onLocaleChange(() => {
    applyStaticDomLocale();
    document.dispatchEvent(new CustomEvent('localechange'));
    window.dispatchEvent(new CustomEvent('farm-localechange'));
    applyBetaBadge(getHudSnapshot());
  });
}
