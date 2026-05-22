import type { FarmTileDto } from './types';

/** Rich brown tilled soil (empty plot). */
export const SOIL_COLOR = 0x6b4a2e;

/** Mirrors server-side growth buckets for smooth visuals between polls. */
export function computeVisualPhase(
  tile: Pick<FarmTileDto, 'phase' | 'plantedAtUtc' | 'growthDurationSeconds'>,
  nowMs: number = Date.now(),
): string {
  if (tile.phase === 'Empty' || !tile.plantedAtUtc || !tile.growthDurationSeconds) {
    return 'Empty';
  }

  const planted = Date.parse(tile.plantedAtUtc);
  if (Number.isNaN(planted)) {
    return 'Empty';
  }

  const elapsed = Math.max(0, (nowMs - planted) / 1000);
  const growth = tile.growthDurationSeconds;
  if (elapsed >= growth) {
    return 'Ripe';
  }

  const p = elapsed / growth;
  if (p < 1 / 3) {
    return 'Seedling';
  }

  if (p < 2 / 3) {
    return 'Growing';
  }

  return 'Mature';
}

/** Ripe for harvest (client-side, uses same buckets as growth visuals). */
export function isCropRipe(
  tile: Pick<FarmTileDto, 'phase' | 'cropTypeId' | 'plantedAtUtc' | 'growthDurationSeconds'>,
  nowMs: number = Date.now(),
): boolean {
  if (tile.cropTypeId === null) {
    return false;
  }
  if (tile.phase === 'Ripe') {
    return true;
  }
  return computeVisualPhase(tile, nowMs) === 'Ripe';
}

/**
 * Countdown until ripe — anchored to server snapshot time when available.
 */
export function computeCropSecondsRemaining(
  tile: Pick<FarmTileDto, 'plantedAtUtc' | 'growthDurationSeconds' | 'secondsRemaining'>,
  nowMs: number = Date.now(),
  snapshotServerMs: number | null = null,
): number | null {
  if (
    tile.secondsRemaining != null &&
    snapshotServerMs !== null &&
    !Number.isNaN(snapshotServerMs)
  ) {
    const elapsed = Math.max(0, (nowMs - snapshotServerMs) / 1000);
    const left = tile.secondsRemaining - elapsed;
    return left <= 0 ? 0 : Math.ceil(left);
  }

  if (!tile.plantedAtUtc || !tile.growthDurationSeconds) {
    return null;
  }

  const planted = Date.parse(tile.plantedAtUtc);
  if (Number.isNaN(planted)) {
    return null;
  }

  const elapsed = Math.max(0, (nowMs - planted) / 1000);
  const left = tile.growthDurationSeconds - elapsed;
  if (left <= 0) {
    return 0;
  }

  return Math.ceil(left);
}

/**
 * Production countdown — anchored to server snapshot so "Ready" matches collect API.
 */
export function computePlacementSecondsRemaining(
  tile: Pick<
    FarmTileDto,
    'placementLastActionUtc' | 'placementCooldownSeconds' | 'placementSecondsRemaining'
  >,
  nowMs: number = Date.now(),
  snapshotServerMs: number | null = null,
): number | null {
  const cooldown = tile.placementCooldownSeconds;
  if (!cooldown || cooldown <= 0) {
    return null;
  }

  if (
    tile.placementSecondsRemaining != null &&
    snapshotServerMs !== null &&
    !Number.isNaN(snapshotServerMs)
  ) {
    const elapsed = Math.max(0, (nowMs - snapshotServerMs) / 1000);
    const left = tile.placementSecondsRemaining - elapsed;
    return left <= 0 ? 0 : Math.ceil(left);
  }

  if (!tile.placementLastActionUtc) {
    if (tile.placementSecondsRemaining == null) {
      return null;
    }
    return tile.placementSecondsRemaining;
  }

  const lastMs = Date.parse(tile.placementLastActionUtc);
  if (Number.isNaN(lastMs)) {
    return null;
  }

  const elapsed = Math.max(0, (nowMs - lastMs) / 1000);
  const left = cooldown - elapsed;
  return left <= 0 ? 0 : Math.ceil(left);
}

const PHASE_COLORS: Record<string, number> = {
  Seedling: 0x9cdb6b,
  Growing: 0x4caf50,
  Mature: 0x2e7d32,
  Ripe: 0xf6a800,
};

/** Per-crop growth colors shown on top of brown soil until stage sprites exist. */
const CROP_PHASE_COLORS: Record<number, Record<string, number>> = {
  1: {
    Seedling: 0xb8d894,
    Growing: 0x7cb342,
    Mature: 0x558b2f,
    Ripe: 0xffc107,
  },
  2: {
    Seedling: 0xffe0b2,
    Growing: 0xffb74d,
    Mature: 0xff9800,
    Ripe: 0xff6d00,
  },
};

export function colorForPhase(phase: string): number {
  return PHASE_COLORS[phase] ?? SOIL_COLOR;
}

export function colorForCropPhase(cropTypeId: number, phase: string): number {
  const crop = CROP_PHASE_COLORS[cropTypeId];
  if (crop?.[phase]) {
    return crop[phase];
  }
  return colorForPhase(phase);
}
