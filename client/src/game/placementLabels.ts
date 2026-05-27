import { formatGameTimer, t } from '../i18n';
import { catalogResourceName } from '../i18n/catalogNames';
import type { FarmSnapshot, FarmTileDto } from '../types';
import { computePlacementSecondsRemaining } from '../growth';
import { estimateBankedAnimalCycles } from './collectEstimates';
import { barnFactoryTypeId, maxBankedAnimalCycles } from './gameConfig';

/** @deprecated Use barnFactoryTypeId(snap) from server gameConfig */
export const BARN_FACTORY_TYPE_ID = 2;

export type FactoryPlacementState = 'idle' | 'working' | 'done';

function isBarnPlacement(tile: FarmTileDto, snap?: FarmSnapshot | null): boolean {
  if (tile.placementKind !== 'factory' || tile.placementTypeId == null) {
    return false;
  }
  const barnId = snap ? barnFactoryTypeId(snap) : BARN_FACTORY_TYPE_ID;
  if (tile.placementTypeId === barnId) {
    return true;
  }
  const def = snap?.factoryCatalog.find((f) => f.id === tile.placementTypeId);
  return def?.isBarn ?? false;
}

/** Short hover label for the storage barn (not production). */
export function barnPlacementLabel(snap: FarmSnapshot): string {
  const used =
    snap.storageUsed ?? snap.resources.reduce((n, r) => n + r.quantity, 0);
  const capacity =
    snap.storageCapacity;
  const line = t('game.barnLabelStorage', { used, capacity });

  if (used >= capacity) {
    return `${line} · ${t('game.barnLabelFull')}`;
  }
  const offer = snap.nextBarnUpgrade;
  if (!offer) {
    return `${line} · ${t('game.barnLabelMaxed')}`;
  }
  return `${line} · ${t('game.barnLabelUpgrade')}`;
}

export function factoryPlacementState(tile: FarmTileDto): FactoryPlacementState {
  const started =
    tile.placementLastActionUtc != null && tile.placementLastActionUtc !== '';
  const remaining = tile.placementSecondsRemaining ?? 0;
  if (!started) {
    return 'idle';
  }
  if (remaining > 0) {
    return 'working';
  }
  return 'done';
}

/** Floating label above a placed animal or factory. */
export function placementTimerLabel(
  tile: FarmTileDto,
  nowMs: number,
  snapshotServerMs: number | null,
  snap?: FarmSnapshot | null,
): string {
  const kind = tile.placementKind;
  const remaining = computePlacementSecondsRemaining(tile, nowMs, snapshotServerMs);

  if (kind === 'factory') {
    if (isBarnPlacement(tile, snap)) {
      return snap ? barnPlacementLabel(snap) : t('game.barnLabelTap');
    }

    const state = factoryPlacementState(tile);
    if (state === 'idle') {
      return t('game.factoryReadyStart');
    }
    if (state === 'working' && remaining != null && remaining > 0) {
      return formatGameTimer(remaining);
    }
    if (state === 'done') {
      return t('game.factoryWorkDone');
    }
    return '';
  }

  if (kind === 'animal') {
    if (
      tile.placementLastActionUtc == null ||
      tile.placementLastActionUtc === ''
    ) {
      const def = snap?.animalCatalog.find((a) => a.id === tile.placementTypeId);
      if (def?.feedResourceCode) {
        const feedRow = snap?.resourceCatalog.find((r) => r.code === def.feedResourceCode);
        return t('game.animalNeedsFeed', {
          qty: def.feedQuantity,
          feed: catalogResourceName(def.feedResourceCode, def.feedResourceCode, feedRow),
        });
      }
      return t('game.animalNeedsFeedShort');
    }
    if (remaining != null && remaining > 0) {
      return formatGameTimer(remaining);
    }
    const interval = tile.placementCooldownSeconds ?? 90;
    const cap = snap ? maxBankedAnimalCycles(snap) : 30;
    const banked = estimateBankedAnimalCycles(tile, interval, nowMs, cap);
    if (banked >= cap) {
      return t('game.animalPenFull');
    }
    return t('game.readyCollect');
  }

  return '';
}
