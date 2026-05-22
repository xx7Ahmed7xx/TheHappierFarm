import type { CropCatalogDto } from '../types';

export { cropVisual, type CropVisual } from '../game/catalogVisuals';

import { formatDuration } from '../i18n';

export function formatGrowTime(seconds: number): string {
  return formatDuration(seconds);
}

export function canAfford(gold: number, crop: CropCatalogDto): boolean {
  return gold >= crop.buyPrice;
}
