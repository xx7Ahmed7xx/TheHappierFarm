import type { BuildItemSelection, FarmSnapshot } from '../types';
import { animalEmoji, cropVisual, factoryEmoji, resourceDisplay } from '../game/catalogVisuals';
import {
  catalogAnimalName,
  catalogCropName,
  catalogDecorationName,
  catalogFactoryName,
  catalogResourceName,
} from '../i18n/catalogNames';
import { t } from '../i18n';
import { sellPriceForResourceCode } from '../game/resourceEconomy';

export type InventoryFilter = 'all' | 'crops' | 'animal' | 'factory' | 'build';

export interface InventoryRow {
  key: string;
  filter: Exclude<InventoryFilter, 'all'>;
  emoji: string;
  name: string;
  quantity: number;
  meta: string;
  /** Barn resource code for sell actions. */
  resourceCode?: string;
  sellPrice?: number;
  cropTypeId?: number;
  build?: BuildItemSelection;
  action: 'equip-build' | 'sell' | 'none';
}

function cropCodesFromCatalog(snap: FarmSnapshot): Set<string> {
  const codes = new Set<string>();
  for (const c of snap.cropCatalog) {
    if (c.harvestResourceCode) {
      codes.add(c.harvestResourceCode);
    }
  }
  return codes;
}

function isFactoryProduct(snap: FarmSnapshot, code: string): boolean {
  return snap.factoryCatalog.some(
    (f) =>
      !(f.isBarn ?? false)
      && f.outputQuantity > 0
      && f.outputResourceCode === code,
  );
}

function sellPriceForResource(snap: FarmSnapshot, code: string): number | undefined {
  return sellPriceForResourceCode(snap, code);
}

function labelForResource(snap: FarmSnapshot, code: string): { emoji: string; name: string } {
  const crop = snap.cropCatalog.find((c) => c.harvestResourceCode === code);
  if (crop) {
    return {
      emoji: cropVisual(crop.id).emoji,
      name: catalogCropName(crop.id, crop.name, crop),
    };
  }
  const display = resourceDisplay(code);
  const resRow = snap.resourceCatalog.find((r) => r.code === code);
  return {
    emoji: display.emoji,
    name: catalogResourceName(code, display.name, resRow),
  };
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

export function buildInventoryRows(snap: FarmSnapshot): InventoryRow[] {
  const rows: InventoryRow[] = [];
  const codes = cropCodesFromCatalog(snap);

  for (const r of snap.resources) {
    if (r.quantity < 1) {
      continue;
    }
    const { emoji, name: displayName } = labelForResource(snap, r.resourceCode);
    const price = sellPriceForResource(snap, r.resourceCode);
    if (codes.has(r.resourceCode)) {
      rows.push({
        key: `crop:${r.resourceCode}`,
        filter: 'crops',
        emoji,
        name: displayName,
        quantity: r.quantity,
        meta: price ? t('inventory.sellEach', { price }) : '',
        resourceCode: r.resourceCode,
        sellPrice: price,
        action: price ? 'sell' : 'none',
      });
      continue;
    }

    const filter: InventoryRow['filter'] = isFactoryProduct(snap, r.resourceCode)
      ? 'factory'
      : 'animal';
    rows.push({
      key: `res:${r.resourceCode}`,
      filter,
      emoji,
      name: displayName,
      quantity: r.quantity,
      meta: price ? t('inventory.sellEach', { price }) : '',
      resourceCode: r.resourceCode,
      sellPrice: price,
      action: price ? 'sell' : 'none',
    });
  }

  for (const animal of snap.animalCatalog) {
    const stash = snap.animals.find((a) => a.animalTypeId === animal.id)?.stashQuantity ?? 0;
    if (stash < 1) {
      continue;
    }
    rows.push({
      key: `build:animal:${animal.id}`,
      filter: 'build',
      emoji: animalEmoji(animal.id),
      name: catalogAnimalName(animal.id, animal.name, animal),
      quantity: stash,
      meta: t('inventory.placeAnimal'),
      build: { kind: 'animal', typeId: animal.id },
      action: 'equip-build',
    });
  }

  for (const factory of snap.factoryCatalog) {
    const stash = snap.factories.find((f) => f.factoryTypeId === factory.id)?.stashQuantity ?? 0;
    if (stash < 1) {
      continue;
    }
    rows.push({
      key: `build:factory:${factory.id}`,
      filter: 'build',
      emoji: factoryEmoji(factory.id, factory.isBarn ?? false),
      name: catalogFactoryName(factory.id, factory.name, factory),
      quantity: stash,
      meta: (factory.isBarn ?? false)
        ? t('inventory.placeBarn')
        : t('inventory.placeFactory'),
      build: { kind: 'factory', typeId: factory.id },
      action: 'equip-build',
    });
  }

  for (const deco of snap.decorationCatalog) {
    const stash = snap.decorations.find((d) => d.decorationTypeId === deco.id)?.stashQuantity ?? 0;
    if (stash < 1) {
      continue;
    }
    rows.push({
      key: `build:decoration:${deco.id}`,
      filter: 'build',
      emoji: decorationEmoji(deco.id),
      name: catalogDecorationName(deco.id, deco.name, deco),
      quantity: stash,
      meta: t('inventory.placeDecor'),
      build: { kind: 'decoration', typeId: deco.id },
      action: 'equip-build',
    });
  }

  return rows;
}

export function filterInventoryRows(
  rows: InventoryRow[],
  filter: InventoryFilter,
): InventoryRow[] {
  if (filter === 'all') {
    return rows;
  }
  return rows.filter((r) => r.filter === filter);
}
