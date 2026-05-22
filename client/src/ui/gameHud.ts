import type { BuildItemSelection, FarmSnapshot } from '../types';
import { animalEmoji, factoryEmoji } from '../game/catalogVisuals';
import {
  catalogAnimalName,
  catalogCropName,
  catalogDecorationName,
  catalogFactoryName,
  catalogResourceName,
} from '../i18n/catalogNames';
import { t } from '../i18n';
import { cropVisual, formatGrowTime } from './cropVisuals';
import {
  buildInventoryRows,
  filterInventoryRows,
  type InventoryFilter,
  type InventoryRow,
} from './inventory';

export type FarmTool = 'plant' | 'harvest' | 'place' | 'pickup' | 'pan';
export type ShopTab = 'seeds' | 'animals' | 'factories' | 'decorations' | 'expansion';

export interface GameHudCallbacks {
  onEquipCrop: (cropTypeId: number) => void;
  onBuyAnimal: (animalTypeId: number) => void;
  onBuyFactory: (factoryTypeId: number) => void;
  onBuyDecoration: (decorationTypeId: number) => void;
  onBuyExpansion: () => void;
  onCollectAnimals: () => void;
  onCollectFactories: () => void;
  onUpgradeBarn: () => void;
  onSellResource: (resourceCode: string, quantity: number) => void;
  onRefresh: () => void;
  onToolChange: (tool: FarmTool) => void;
  onSeedSelected: (cropTypeId: number | null) => void;
  onBuildSelected: (item: BuildItemSelection | null) => void;
}

const shopCardsEl = document.querySelector<HTMLDivElement>('#shop-cards')!;
const inventoryListEl = document.querySelector<HTMLDivElement>('#inventory-list')!;
const storageCapacityEl = document.querySelector<HTMLSpanElement>('#storage-capacity')!;
const upgradeBarnBtn = document.querySelector<HTMLButtonElement>('#btn-upgrade-barn')!;
const invFilterButtons = document.querySelectorAll<HTMLButtonElement>('.inv-filter');
const handPreviewEl = document.querySelector<HTMLDivElement>('#hand-preview')!;
const handHintEl = document.querySelector<HTMLParagraphElement>('#hand-hint')!;
const toolPlantBtn = document.querySelector<HTMLButtonElement>('#tool-plant')!;
const toolHarvestBtn = document.querySelector<HTMLButtonElement>('#tool-harvest')!;
const toolPlaceBtn = document.querySelector<HTMLButtonElement>('#tool-place')!;
const toolPickupBtn = document.querySelector<HTMLButtonElement>('#tool-pickup')!;
const toolPanBtn = document.querySelector<HTMLButtonElement>('#tool-pan')!;
const shopTabButtons = document.querySelectorAll<HTMLButtonElement>('.shop-tab');

let selectedCropId: number | null = null;
let selectedBuild: BuildItemSelection | null = null;
let activeTool: FarmTool = 'plant';
let activeShopTab: ShopTab = 'seeds';
let activeInvFilter: InventoryFilter = 'all';
let lastSnapshot: FarmSnapshot | null = null;
let callbacks: GameHudCallbacks | null = null;

function animalStash(snap: FarmSnapshot, id: number): number {
  return snap.animals.find((a) => a.animalTypeId === id)?.stashQuantity ?? 0;
}

function animalPlaced(snap: FarmSnapshot, id: number): number {
  return snap.animals.find((a) => a.animalTypeId === id)?.placedCount ?? 0;
}

function factoryStash(snap: FarmSnapshot, id: number): number {
  return snap.factories.find((f) => f.factoryTypeId === id)?.stashQuantity ?? 0;
}

function factoryPlaced(snap: FarmSnapshot, id: number): number {
  return snap.factories.find((f) => f.factoryTypeId === id)?.placedCount ?? 0;
}

function decorationStash(snap: FarmSnapshot, id: number): number {
  return snap.decorations.find((d) => d.decorationTypeId === id)?.stashQuantity ?? 0;
}

function decorationPlaced(snap: FarmSnapshot, id: number): number {
  return snap.decorations.find((d) => d.decorationTypeId === id)?.placedCount ?? 0;
}

function isUnlocked(snap: FarmSnapshot, minLevel: number): boolean {
  return snap.level >= minLevel;
}

function storageTotals(snap: FarmSnapshot): { used: number; capacity: number } {
  const used =
    snap.storageUsed ?? snap.resources.reduce((n, r) => n + r.quantity, 0);
  const capacity = snap.storageCapacity;
  return { used, capacity };
}

const INV_FILTER_KEYS: Record<Exclude<InventoryFilter, 'all'>, string> = {
  crops: 'inventory.crops',
  animal: 'inventory.animal',
  factory: 'inventory.factory',
  build: 'inventory.build',
};

function buildSellActionHtml(row: InventoryRow): string {
  if (row.action !== 'sell' || !row.sellPrice || !row.resourceCode) {
    return '';
  }
  const price = row.sellPrice;
  const q = row.quantity;
  const parts: string[] = [];
  for (const n of [1, 5, 10] as const) {
    if (q >= n) {
      parts.push(
        `<button type="button" class="inv-sell-btn" data-q="${n}">${t('inventory.sellN', { n, total: price * n })}</button>`,
      );
    }
  }
  if (q > 1) {
    parts.push(
      `<button type="button" class="inv-sell-btn" data-q="all">${t('inventory.sellAll', { total: price * q })}</button>`,
    );
  }
  return parts.join('');
}

function sellQtyFromButton(row: InventoryRow, dataQ: string | undefined): number {
  if (dataQ === 'all') {
    return row.quantity;
  }
  const n = Number(dataQ);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return Math.min(Math.floor(n), row.quantity);
}

function decorationEmoji(id: number): string {
  if (id === 2) {
    return '🪵';
  }
  if (id === 3) {
    return '🌾';
  }
  return '🌻';
}

function setHandPreview(): void {
  if (!lastSnapshot) {
    handPreviewEl.innerHTML = `<span class="hand-empty">${t('hand.loading')}</span>`;
    handHintEl.textContent = '';
    return;
  }

  if (activeTool === 'pan') {
    handPreviewEl.innerHTML =
      `<span class="hand-tool-icon" aria-hidden="true">🗺️</span><span class="hand-label">${t('hand.moveView')}</span>`;
    handHintEl.textContent = t('hand.moveHint');
    return;
  }

  if (activeTool === 'harvest') {
    handPreviewEl.innerHTML =
      `<span class="hand-tool-icon" aria-hidden="true">🧺</span><span class="hand-label">${t('hand.harvestBasket')}</span>`;
    handHintEl.textContent = t('hand.harvestHint');
    return;
  }

  if (activeTool === 'place') {
    if (!selectedBuild) {
      handPreviewEl.innerHTML = `<span class="hand-empty">${t('hand.pickBuild')}</span>`;
      handHintEl.textContent = t('hand.placeHint');
      return;
    }
    const build = selectedBuild;
    const label =
      build.kind === 'animal'
        ? (() => {
            const a = lastSnapshot.animalCatalog.find((x) => x.id === build.typeId);
            return a ? catalogAnimalName(a.id, a.name, a) : t('hand.animal');
          })()
        : build.kind === 'factory'
          ? (() => {
              const f = lastSnapshot.factoryCatalog.find((x) => x.id === build.typeId);
              return f ? catalogFactoryName(f.id, f.name, f) : t('hand.building');
            })()
          : (() => {
              const d = lastSnapshot.decorationCatalog.find((x) => x.id === build.typeId);
              return d ? catalogDecorationName(d.id, d.name, d) : t('hand.decor');
            })();
    const stash =
      build.kind === 'animal'
        ? animalStash(lastSnapshot, build.typeId)
        : build.kind === 'factory'
          ? factoryStash(lastSnapshot, build.typeId)
          : decorationStash(lastSnapshot, build.typeId);
    handPreviewEl.innerHTML = `<span class="hand-label">${label}</span><span class="hand-qty">${t('hand.stashQty', { n: stash })}</span>`;
    handHintEl.textContent = stash > 0 ? t('hand.placeFootprint') : t('hand.buyFirst');
    return;
  }

  if (activeTool === 'pickup') {
    handPreviewEl.innerHTML =
      `<span class="hand-tool-icon" aria-hidden="true">📦</span><span class="hand-label">${t('hand.storeInv')}</span>`;
    handHintEl.textContent = t('hand.storeHint');
    return;
  }

  if (selectedCropId === null) {
    handPreviewEl.innerHTML = `<span class="hand-empty">${t('hand.pickCrop')}</span>`;
    handHintEl.textContent = t('hand.plantHint');
    return;
  }

  const crop = lastSnapshot.cropCatalog.find((c) => c.id === selectedCropId);
  if (!crop) {
    return;
  }

  const vis = cropVisual(crop.id);
  const canPlant = lastSnapshot.gold >= crop.buyPrice;
  handPreviewEl.innerHTML = `
    <div class="hand-crop" style="--accent:${vis.accent};--accent-dark:${vis.accentDark}">
      <span class="hand-crop-emoji">${vis.emoji}</span>
      <div>
        <strong>${catalogCropName(crop.id, crop.name, crop)}</strong>
        <span class="hand-qty">${t('hand.goldPerTile', { price: crop.buyPrice })}</span>
      </div>
    </div>`;

  handHintEl.textContent = canPlant
    ? t('hand.plantEquipped')
    : t('hand.needGold', { price: crop.buyPrice });
}

function rowIsSelected(row: InventoryRow): boolean {
  if (row.action === 'equip-build' && row.build) {
    return (
      activeTool === 'place' &&
      selectedBuild?.kind === row.build.kind &&
      selectedBuild.typeId === row.build.typeId
    );
  }
  return false;
}

function activateBuildRow(build: BuildItemSelection, snap: FarmSnapshot): void {
  activeTool = 'place';
  selectedCropId = null;
  updateToolButtons();
  selectedBuild = build;
  callbacks?.onBuildSelected(build);
  callbacks?.onSeedSelected(null);
  callbacks?.onToolChange('place');
  renderInventory(snap);
  setHandPreview();
}

function updateToolButtons(): void {
  toolPlantBtn.classList.toggle('active', activeTool === 'plant');
  toolHarvestBtn.classList.toggle('active', activeTool === 'harvest');
  toolPlaceBtn.classList.toggle('active', activeTool === 'place');
  toolPickupBtn.classList.toggle('active', activeTool === 'pickup');
  toolPanBtn.classList.toggle('active', activeTool === 'pan');
}

function renderInventory(snap: FarmSnapshot): void {
  const { used: usedSlots, capacity } = storageTotals(snap);
  const full = usedSlots >= capacity;

  const cfg = snap.gameConfig;
  const baseCap =
    (cfg?.baseStorageCapacity ?? 50) + Math.max(0, snap.level - 1) * (cfg?.storagePerLevel ?? 10);
  const barnBonus = Math.max(0, capacity - baseCap);
  const barnTier = snap.barnUpgradeTier ?? 0;
  storageCapacityEl.textContent = `${t('inventory.title')} ${usedSlots}/${capacity}${full ? ` ${t('hud.barnFull')}` : ''} · ${t('hud.level')} ${snap.level} +10${barnBonus > 0 ? ` · ${t('hud.barnUpgrades')} +${barnBonus}` : ''} · ${snap.gridSize}×${snap.gridSize}`;

  const offer = snap.nextBarnUpgrade;
  const canUpgrade =
    offer != null && snap.barnPlacedOnFarm && snap.gold >= offer.goldCost;
  if (offer && snap.barnPlacedOnFarm) {
    upgradeBarnBtn.hidden = false;
    upgradeBarnBtn.textContent = t('hud.upgradeBarnSlots', {
      slots: offer.bonusSlots,
      cost: offer.goldCost,
    });
    upgradeBarnBtn.disabled = !canUpgrade;
  } else if (offer && !snap.barnPlacedOnFarm) {
    upgradeBarnBtn.hidden = false;
    upgradeBarnBtn.textContent = t('hud.placeBarnToUpgrade');
    upgradeBarnBtn.disabled = true;
  } else {
    upgradeBarnBtn.hidden = barnTier < 1;
    upgradeBarnBtn.textContent =
      barnTier >= 3 ? t('hud.barnMaxed') : t('hud.upgradeBarn');
    upgradeBarnBtn.disabled = true;
  }

  const allRows = buildInventoryRows(snap);
  const rows = filterInventoryRows(allRows, activeInvFilter);

  inventoryListEl.innerHTML = '';

  if (rows.length === 0) {
    const emptyMsg =
      activeInvFilter === 'all'
        ? t('inventory.emptyAll')
        : t('inventory.emptyFilter', {
            filter: t(INV_FILTER_KEYS[activeInvFilter as Exclude<InventoryFilter, 'all'>]),
          });
    inventoryListEl.innerHTML = `<p class="inventory-empty">${emptyMsg}</p>`;
    return;
  }

  for (const row of rows) {
    const el = document.createElement('div');
    const selected = rowIsSelected(row);
    el.className = `inventory-row${selected ? ' selected' : ''}`;
    el.dataset.filter = row.filter;

    const actions =
      row.action === 'sell'
        ? buildSellActionHtml(row)
        : row.action === 'equip-build'
          ? `<span class="inv-action-hint">${t('inventory.clickToPlace')}</span>`
          : '';

    el.innerHTML = `
      <button type="button" class="inventory-row-main">
        <span class="inv-emoji">${row.emoji}</span>
        <span class="inv-info">
          <span class="inv-name">${row.name}</span>
          <span class="inv-meta">${row.meta}</span>
        </span>
        <span class="inv-qty">×${row.quantity}</span>
      </button>
      <div class="inventory-row-actions">${actions}</div>
    `;

    el.querySelector<HTMLButtonElement>('.inventory-row-main')!.addEventListener('click', () => {
      if (row.action === 'equip-build' && row.build) {
        activateBuildRow(row.build, snap);
      }
    });

    if (row.action === 'sell' && row.resourceCode) {
      el.querySelectorAll<HTMLButtonElement>('.inv-sell-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const qty = sellQtyFromButton(row, btn.dataset.q);
          callbacks?.onSellResource(row.resourceCode!, qty);
        });
      });
    }

    inventoryListEl.appendChild(el);
  }
}

function renderShopCards(snap: FarmSnapshot): void {
  shopCardsEl.innerHTML = '';

  if (activeShopTab === 'seeds') {
    for (const crop of snap.cropCatalog) {
      const vis = cropVisual(crop.id);
      const unlocked = isUnlocked(snap, crop.minLevelRequired ?? 1);
      const afford = unlocked && snap.gold >= crop.buyPrice;
      const equipped = selectedCropId === crop.id && activeTool === 'plant';
      shopCardsEl.appendChild(
        makeShopCard(
          vis.emoji,
          catalogCropName(crop.id, crop.name, crop),
          t('shop.cropMeta', {
            time: formatGrowTime(crop.growthDurationSeconds),
            price: crop.buyPrice,
            sell: crop.sellValue,
          }),
          `${crop.buyPrice}g/tile`,
          equipped ? t('shop.equipped') : unlocked ? t('shop.equip') : t('shop.lv', { n: crop.minLevelRequired ?? 1 }),
          afford || equipped,
          unlocked,
          crop.minLevelRequired ?? 1,
          vis.accent,
          vis.accentDark,
          () => callbacks?.onEquipCrop(crop.id),
        ),
      );
    }
    return;
  }

  if (activeShopTab === 'animals') {
    for (const animal of snap.animalCatalog) {
      const stash = animalStash(snap, animal.id);
      const placed = animalPlaced(snap, animal.id);
      const total = stash + placed;
      const atCap = total >= animal.maxOwned;
      const unlocked = isUnlocked(snap, animal.minLevelRequired ?? 1);
      const afford = unlocked && snap.gold >= animal.buyPrice && !atCap;
      shopCardsEl.appendChild(
        makeShopCard(
          animalEmoji(animal.id),
          catalogAnimalName(animal.id, animal.name, animal),
          t('shop.animalMeta', {
            w: animal.footprintWidth,
            h: animal.footprintHeight,
            feedQty: animal.feedQuantity ?? 1,
            feed: catalogResourceName(
              animal.feedResourceCode ?? 'wheat',
              animal.feedResourceCode,
              snap.resourceCatalog.find((r) => r.code === animal.feedResourceCode),
            ),
            time: formatGrowTime(animal.productionIntervalSeconds),
            qty: animal.productQuantity,
            product: catalogResourceName(
              animal.productCode,
              animal.productCode,
              snap.resourceCatalog.find((r) => r.code === animal.productCode),
            ),
            owned: total,
            max: animal.maxOwned,
            placed,
            maxPlaced: animal.maxPlaced,
          }),
          `${animal.buyPrice}g`,
          !unlocked
            ? t('shop.lv', { n: animal.minLevelRequired ?? 1 })
            : atCap
              ? t('shop.atCap')
              : t('shop.buyStash'),
          afford,
          unlocked,
          animal.minLevelRequired ?? 1,
          '#8d6e63',
          '#5d4037',
          () => callbacks?.onBuyAnimal(animal.id),
        ),
      );
    }
    return;
  }

  if (activeShopTab === 'decorations') {
    for (const deco of snap.decorationCatalog) {
      const stash = decorationStash(snap, deco.id);
      const placed = decorationPlaced(snap, deco.id);
      const total = stash + placed;
      const atCap = total >= deco.maxOwned;
      const unlocked = isUnlocked(snap, deco.minLevelRequired ?? 1);
      const afford = unlocked && snap.gold >= deco.buyPrice && !atCap;
      shopCardsEl.appendChild(
        makeShopCard(
          decorationEmoji(deco.id),
          catalogDecorationName(deco.id, deco.name, deco),
          `${deco.footprintWidth}×${deco.footprintHeight} · ${total}/${deco.maxOwned} · ${placed}/${deco.maxPlaced}`,
          `${deco.buyPrice}g`,
          !unlocked
            ? t('shop.lv', { n: deco.minLevelRequired ?? 1 })
            : atCap
              ? t('shop.atCap')
              : t('shop.buyStash'),
          afford,
          unlocked,
          deco.minLevelRequired ?? 1,
          '#7cb342',
          '#558b2f',
          () => callbacks?.onBuyDecoration(deco.id),
        ),
      );
    }
    return;
  }

  if (activeShopTab === 'expansion') {
    const offer = snap.expansionOffer;
    if (!offer) {
      shopCardsEl.innerHTML = `<p class="shop-empty">${t('shop.expansionEmpty')}</p>`;
      return;
    }
    const added = offer.nextSize * offer.nextSize - snap.gridSize * snap.gridSize;
    const afford = snap.gold >= offer.price;
    shopCardsEl.appendChild(
      makeShopCard(
        '🌾',
        t('shop.expandTitle', { size: offer.nextSize }),
        t('shop.expandMeta', { tiles: added }),
        `${offer.price}g`,
        t('shop.buyLand'),
        afford,
        true,
        1,
        '#6d4c41',
        '#4e342e',
        () => callbacks?.onBuyExpansion(),
      ),
    );
    return;
  }

  for (const factory of snap.factoryCatalog) {
    if (factory.isBarn ?? false) {
      const stash = factoryStash(snap, factory.id);
      const placed = factoryPlaced(snap, factory.id);
      const total = stash + placed;
      const atCap = total >= factory.maxOwned;
      const unlocked = isUnlocked(snap, factory.minLevelRequired ?? 1);
      const afford = unlocked && snap.gold >= factory.buyPrice && !atCap;
      const tier = snap.barnUpgradeTier ?? 0;
      shopCardsEl.appendChild(
        makeShopCard(
          factoryEmoji(factory.id, true),
          catalogFactoryName(factory.id, factory.name, factory),
          t('shop.barnMeta', { level: snap.level, tier }),
          `${factory.buyPrice}g`,
          !unlocked
            ? t('shop.lv', { n: factory.minLevelRequired ?? 1 })
            : atCap
              ? t('shop.placed')
              : t('shop.buyStash'),
          afford,
          unlocked,
          factory.minLevelRequired ?? 1,
          '#ffb74d',
          '#e65100',
          () => callbacks?.onBuyFactory(factory.id),
        ),
      );
      continue;
    }

    const stash = factoryStash(snap, factory.id);
    const placed = factoryPlaced(snap, factory.id);
    const total = stash + placed;
    const atCap = total >= factory.maxOwned;
    const unlocked = isUnlocked(snap, factory.minLevelRequired ?? 1);
    const afford = unlocked && snap.gold >= factory.buyPrice && !atCap;
    shopCardsEl.appendChild(
      makeShopCard(
        factoryEmoji(factory.id, false),
        catalogFactoryName(factory.id, factory.name, factory),
        t('shop.factoryMeta', {
          w: factory.footprintWidth,
          h: factory.footprintHeight,
          inQty: factory.inputQuantity,
          inCode: catalogResourceName(factory.inputResourceCode),
          outQty: factory.outputQuantity,
          outCode: catalogResourceName(factory.outputResourceCode),
          time: formatGrowTime(factory.processSeconds),
          owned: total,
          max: factory.maxOwned,
        }),
        `${factory.buyPrice}g`,
        !unlocked
          ? t('shop.lv', { n: factory.minLevelRequired ?? 1 })
          : atCap
            ? t('shop.atCap')
            : t('shop.buyStash'),
        afford,
        unlocked,
        factory.minLevelRequired ?? 1,
        '#78909c',
        '#455a64',
        () => callbacks?.onBuyFactory(factory.id),
      ),
    );
  }
}

function makeShopCard(
  emoji: string,
  title: string,
  meta: string,
  price: string,
  buyLabel: string,
  afford: boolean,
  unlocked: boolean,
  _unlockLevel: number,
  accent: string,
  accentDark: string,
  onBuy: () => void,
): HTMLElement {
  const card = document.createElement('article');
  card.className = `shop-card${unlocked ? '' : ' locked'}${afford ? '' : ' cant-afford'}`;
  card.style.setProperty('--accent', accent);
  card.style.setProperty('--accent-dark', accentDark);
  card.innerHTML = `
    <div class="shop-card-body">
      <span class="shop-card-emoji">${emoji}</span>
      <div class="shop-card-info">
        <h4 class="shop-card-title">${title}</h4>
        <p class="shop-card-meta">${meta}</p>
      </div>
      <span class="shop-price">${price}</span>
    </div>
    <button type="button" class="shop-buy-btn" ${afford && unlocked ? '' : 'disabled'}>${buyLabel}</button>
  `;
  card.querySelector<HTMLButtonElement>('.shop-buy-btn')!.addEventListener('click', (e) => {
    e.stopPropagation();
    if (unlocked && afford) {
      onBuy();
    }
  });
  return card;
}

export function initGameHud(cbs: GameHudCallbacks): void {
  callbacks = cbs;

  toolPlantBtn.addEventListener('click', () => {
    activeTool = 'plant';
    updateToolButtons();
    callbacks?.onToolChange('plant');
    if (lastSnapshot) {
      renderInventory(lastSnapshot);
    }
    setHandPreview();
  });

  toolHarvestBtn.addEventListener('click', () => {
    activeTool = 'harvest';
    selectedCropId = null;
    selectedBuild = null;
    updateToolButtons();
    callbacks?.onToolChange('harvest');
    callbacks?.onSeedSelected(null);
    callbacks?.onBuildSelected(null);
    if (lastSnapshot) {
      renderInventory(lastSnapshot);
    }
    setHandPreview();
  });

  toolPlaceBtn.addEventListener('click', () => {
    activeTool = 'place';
    selectedCropId = null;
    updateToolButtons();
    callbacks?.onToolChange('place');
    callbacks?.onSeedSelected(null);
    if (lastSnapshot) {
      renderInventory(lastSnapshot);
    }
    setHandPreview();
  });

  toolPickupBtn.addEventListener('click', () => {
    activeTool = 'pickup';
    selectedCropId = null;
    selectedBuild = null;
    updateToolButtons();
    callbacks?.onToolChange('pickup');
    callbacks?.onSeedSelected(null);
    callbacks?.onBuildSelected(null);
    if (lastSnapshot) {
      renderInventory(lastSnapshot);
    }
    setHandPreview();
  });

  toolPanBtn.addEventListener('click', () => {
    activeTool = 'pan';
    selectedCropId = null;
    selectedBuild = null;
    updateToolButtons();
    callbacks?.onToolChange('pan');
    callbacks?.onSeedSelected(null);
    callbacks?.onBuildSelected(null);
    setHandPreview();
  });

  shopTabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeShopTab = (btn.dataset.shopTab as ShopTab) ?? 'seeds';
      shopTabButtons.forEach((b) => b.classList.toggle('active', b === btn));
      if (lastSnapshot) {
        renderShopCards(lastSnapshot);
      }
    });
  });

  invFilterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeInvFilter = (btn.dataset.invFilter as InventoryFilter) ?? 'all';
      invFilterButtons.forEach((b) => b.classList.toggle('active', b === btn));
      if (lastSnapshot) {
        renderInventory(lastSnapshot);
      }
    });
  });

  document.querySelector<HTMLButtonElement>('#btn-collect-animals')!.addEventListener('click', () => {
    callbacks?.onCollectAnimals();
  });

  document.querySelector<HTMLButtonElement>('#btn-collect-factories')!.addEventListener('click', () => {
    callbacks?.onCollectFactories();
  });

  upgradeBarnBtn.addEventListener('click', () => {
    callbacks?.onUpgradeBarn();
  });

  updateToolButtons();

  document.addEventListener('localechange', () => {
    if (lastSnapshot) {
      updateGameHudFromSnapshot(lastSnapshot);
    }
    setHandPreview();
  });
}

export function updateGameHudFromSnapshot(snap: FarmSnapshot): void {
  lastSnapshot = snap;

  if (selectedCropId !== null && !snap.cropCatalog.some((c) => c.id === selectedCropId)) {
    selectedCropId = null;
  }

  if (selectedBuild) {
    const build = selectedBuild;
    const valid =
      (build.kind === 'animal' && snap.animalCatalog.some((a) => a.id === build.typeId)) ||
      (build.kind === 'factory' && snap.factoryCatalog.some((f) => f.id === build.typeId)) ||
      (build.kind === 'decoration' && snap.decorationCatalog.some((d) => d.id === build.typeId));
    if (!valid) {
      selectedBuild = null;
    }
  }

  renderInventory(snap);
  renderShopCards(snap);
  setHandPreview();
}

export function getSelectedCropId(): number | null {
  return activeTool === 'plant' ? selectedCropId : null;
}

export function getSelectedBuildItem(): BuildItemSelection | null {
  return activeTool === 'place' ? selectedBuild : null;
}

export function getActiveTool(): FarmTool {
  return activeTool;
}

export function equipCrop(cropTypeId: number): boolean {
  if (lastSnapshot) {
    const crop = lastSnapshot.cropCatalog.find((c) => c.id === cropTypeId);
    if (crop && !isUnlocked(lastSnapshot, crop.minLevelRequired ?? 1)) {
      return false;
    }
  }
  activeTool = 'plant';
  selectedCropId = cropTypeId;
  selectedBuild = null;
  updateToolButtons();
  callbacks?.onToolChange('plant');
  callbacks?.onSeedSelected(selectedCropId);
  callbacks?.onBuildSelected(null);
  if (lastSnapshot) {
    renderInventory(lastSnapshot);
    renderShopCards(lastSnapshot);
  }
  setHandPreview();
  return true;
}

export function getHudSnapshot(): FarmSnapshot | null {
  return lastSnapshot;
}
