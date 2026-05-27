import { getLocale, onLocaleChange, t } from '../i18n';

export type MobileMenuId = 'tools' | 'market' | 'barn' | 'settings';

const MOBILE_LAYOUT_MQ = window.matchMedia('(max-width: 960px), (max-height: 560px)');

let activeMenu: MobileMenuId | null = null;

function layoutEl(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.layout');
}

function drawerTitleEl(): HTMLElement | null {
  return document.querySelector<HTMLElement>('#mobile-drawer-title');
}

function refreshDrawerTitle(): void {
  if (!drawerTitleEl() || !activeMenu) {
    return;
  }
  const keys: Record<MobileMenuId, string> = {
    tools: 'mobile.tools',
    market: 'shop.market',
    barn: 'inventory.title',
    settings: 'mobile.settings',
  };
  drawerTitleEl()!.textContent = t(keys[activeMenu]);
}

function setActiveMenu(menu: MobileMenuId | null): void {
  activeMenu = menu;
  const layout = layoutEl();
  if (!layout) {
    return;
  }

  if (menu) {
    layout.dataset.mobileMenu = menu;
    layout.classList.add('mobile-menu-open');
  } else {
    delete layout.dataset.mobileMenu;
    layout.classList.remove('mobile-menu-open');
  }

  document.querySelectorAll<HTMLButtonElement>('.mobile-menu-btn').forEach((btn) => {
    const id = btn.dataset.mobileMenu as MobileMenuId | undefined;
    const pressed = Boolean(menu && id === menu);
    btn.setAttribute('aria-pressed', String(pressed));
    btn.classList.toggle('active', pressed);
  });

  const drawer = document.querySelector<HTMLElement>('#mobile-menu-drawer');
  if (drawer) {
    drawer.setAttribute('aria-hidden', menu ? 'false' : 'true');
  }

  refreshDrawerTitle();
}

function toggleMenu(menu: MobileMenuId): void {
  if (!MOBILE_LAYOUT_MQ.matches) {
    return;
  }
  setActiveMenu(activeMenu === menu ? null : menu);
}

function closeMenu(): void {
  setActiveMenu(null);
}

function onMobileLayoutChange(): void {
  if (!MOBILE_LAYOUT_MQ.matches) {
    closeMenu();
  }
}

export function initMobileMenu(): void {
  const layout = layoutEl();
  if (!layout) {
    return;
  }

  document.querySelectorAll<HTMLButtonElement>('.mobile-menu-btn').forEach((btn) => {
    const menu = btn.dataset.mobileMenu as MobileMenuId | undefined;
    if (!menu) {
      return;
    }
    btn.addEventListener('click', () => toggleMenu(menu));
  });

  document.querySelector<HTMLButtonElement>('#mobile-drawer-close')?.addEventListener('click', closeMenu);
  MOBILE_LAYOUT_MQ.addEventListener('change', onMobileLayoutChange);
  onLocaleChange(() => refreshDrawerTitle());
  onMobileLayoutChange();
}

/** Side rail follows reading direction: start edge in LTR = left, in RTL = right. */
export function syncMobileMenuLocale(): void {
  const layout = layoutEl();
  if (!layout) {
    return;
  }
  layout.dataset.locale = getLocale();
}
