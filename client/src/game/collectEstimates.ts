import type { FarmSnapshot } from '../types';
import { computePlacementSecondsRemaining } from '../growth';
import { maxBankedAnimalCycles } from './gameConfig';
import { factoryPlacementState } from './placementLabels';

export function estimateBankedAnimalCycles(
  tile: {
    placementLastActionUtc: string | null;
    placementCooldownSeconds: number | null;
  },
  intervalSeconds: number,
  nowMs = Date.now(),
  maxCycles?: number,
): number {
  if (!tile.placementLastActionUtc) {
    return 0;
  }

  const interval = intervalSeconds > 0 ? intervalSeconds : 90;
  const lastMs = Date.parse(tile.placementLastActionUtc);
  if (Number.isNaN(lastMs)) {
    return 0;
  }
  const elapsed = Math.max(0, (nowMs - lastMs) / 1000);
  if (elapsed < interval) {
    return 0;
  }
  const cycles = Math.floor(elapsed / interval);
  const cap = maxCycles ?? 30;
  return Math.min(cycles, cap);
}

export function estimateReadyAnimalSlots(snap: FarmSnapshot, nowMs = Date.now()): number {
  const serverMs = Date.parse(snap.serverTimeUtc);
  const snapshotServerMs = Number.isNaN(serverMs) ? null : serverMs;
  let total = 0;

  for (const tile of snap.tiles) {
    if (tile.placementKind !== 'animal' || !tile.placementIsAnchor || tile.placementTypeId == null) {
      continue;
    }
    const remaining = computePlacementSecondsRemaining(tile, nowMs, snapshotServerMs);
    if (remaining == null || remaining !== 0) {
      continue;
    }
    const def = snap.animalCatalog.find((a) => a.id === tile.placementTypeId);
    if (!def) {
      continue;
    }
    const cycles = estimateBankedAnimalCycles(
      tile,
      def.productionIntervalSeconds,
      nowMs,
      maxBankedAnimalCycles(snap),
    );
    total += Math.max(0, cycles * def.productQuantity);
  }

  return total;
}

export function estimateReadyFactorySlots(snap: FarmSnapshot): number {
  let total = 0;

  for (const tile of snap.tiles) {
    if (tile.placementKind !== 'factory' || !tile.placementIsAnchor || tile.placementTypeId == null) {
      continue;
    }
    const def = snap.factoryCatalog.find((f) => f.id === tile.placementTypeId);
    if (!def || (def.isBarn ?? false)) {
      continue;
    }
    if (factoryPlacementState(tile) !== 'done') {
      continue;
    }
    const runs = Math.max(1, tile.placementBatchRuns ?? 1);
    total += def.outputQuantity * runs;
  }

  return total;
}
