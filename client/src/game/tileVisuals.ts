import { animalEmoji, cropVisual, factoryEmoji, resourceDisplay } from './catalogVisuals';

const CROP_PHASE_EMOJI: Record<number, Record<string, string>> = {
  1: { Seedling: '🌱', Growing: '🌿', Mature: '🌾', Ripe: '✨' },
  2: { Seedling: '🌱', Growing: '🥕', Mature: '🥕', Ripe: '✨' },
  3: { Seedling: '🌱', Growing: '🌿', Mature: '🌾', Ripe: '✨' },
  4: { Seedling: '🌱', Growing: '🍅', Mature: '🍅', Ripe: '✨' },
  5: { Seedling: '🌱', Growing: '🎃', Mature: '🎃', Ripe: '✨' },
};

function cropStageSlug(phase: string): 'seed' | 'grow' | 'ripe' {
  if (phase === 'Ripe') {
    return 'ripe';
  }
  if (phase === 'Seedling') {
    return 'seed';
  }
  return 'grow';
}

/** Texture key for a crop growth stage. */
export function cropSpriteKey(cropTypeId: number, phase: string): string {
  return `farm-crop-${cropTypeId}-${cropStageSlug(phase)}`;
}

export function placementSpriteKey(kind: string, typeId: number | null): string | null {
  if (kind === 'animal' && typeId != null) {
    return `farm-animal-${typeId}`;
  }
  if (kind === 'factory' && typeId != null) {
    return `farm-factory-${typeId}`;
  }
  if (kind === 'decoration' && typeId != null) {
    return `farm-decoration-${typeId}`;
  }
  return null;
}

export function cropPhaseEmoji(cropTypeId: number, phase: string): string {
  const vis = cropVisual(cropTypeId);
  return CROP_PHASE_EMOJI[cropTypeId]?.[phase] ?? vis.emoji;
}

export function placementEmoji(
  kind: string,
  typeId: number | null = null,
  isBarn = false,
): string {
  switch (kind) {
    case 'animal':
      return typeId != null ? animalEmoji(typeId) : '🐾';
    case 'factory':
      return typeId != null ? factoryEmoji(typeId, isBarn) : '🏭';
    case 'decoration':
      if (typeId === 2) {
        return '🪵';
      }
      if (typeId === 3) {
        return '🌾';
      }
      return '🌻';
    default:
      return '📦';
  }
}

/** Emoji for a barn resource code in UI. */
export function resourceEmoji(code: string): string {
  return resourceDisplay(code).emoji;
}
