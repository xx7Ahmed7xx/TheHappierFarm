import type { FarmSnapshot } from '../types';
import { t } from '../i18n';

export function storageTotals(snap: FarmSnapshot): { used: number; capacity: number; free: number } {
  const used =
    snap.storageUsed ?? snap.resources.reduce((n, r) => n + r.quantity, 0);
  const capacity = snap.storageCapacity;
  return { used, capacity, free: Math.max(0, capacity - used) };
}

export function barnHasSpace(snap: FarmSnapshot, slotsNeeded: number): boolean {
  return storageTotals(snap).free >= slotsNeeded;
}

/** How many slots can be collected right now (partial fill). */
export function barnCollectableSlots(snap: FarmSnapshot, slotsWanted: number): number {
  const { free } = storageTotals(snap);
  return Math.max(0, Math.min(slotsWanted, free));
}

export function barnSpaceError(snap: FarmSnapshot, slotsNeeded: number): string {
  const { used, capacity, free } = storageTotals(snap);
  return t('game.barnNotEnoughSpace', { need: slotsNeeded, free, used, capacity });
}
