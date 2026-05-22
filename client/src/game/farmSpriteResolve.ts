/** Procedural farm sprites only (no external asset packs). */

import { cropSpriteKey, placementSpriteKey } from './tileVisuals';

export const FARM_SOIL_TEXTURE_KEY = 'farm-soil-tile';

export function resolveCropSpriteKey(cropTypeId: number, phase: string): string {
  return cropSpriteKey(cropTypeId, phase);
}

export function resolvePlacementSpriteKey(
  kind: string,
  typeId: number | null,
): string | null {
  return placementSpriteKey(kind, typeId);
}

export function resolveSoilTextureKey(): string {
  return FARM_SOIL_TEXTURE_KEY;
}
