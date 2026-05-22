/** Farm sprites: optional PNGs under /assets/farm; procedural fallbacks fill gaps. */

import {
  ANIMAL_TYPE_IDS,
  CROP_TYPE_IDS,
  DECORATION_TYPE_IDS,
  FACTORY_TYPE_IDS,
} from './catalogVisuals';

const CROP_STAGES = ['seed', 'grow', 'ripe'] as const;

function buildFarmSpriteFiles(): { key: string; url: string }[] {
  const files: { key: string; url: string }[] = [];

  for (const id of CROP_TYPE_IDS) {
    for (const stage of CROP_STAGES) {
      const key = `farm-crop-${id}-${stage}`;
      files.push({ key, url: `/assets/farm/${key}.png` });
    }
  }

  for (const id of ANIMAL_TYPE_IDS) {
    const key = `farm-animal-${id}`;
    files.push({ key, url: `/assets/farm/${key}.png` });
  }
  files.push({ key: 'farm-animal-cow', url: '/assets/farm/farm-animal-1.png' });

  for (const id of FACTORY_TYPE_IDS) {
    const key = `farm-factory-${id}`;
    files.push({ key, url: `/assets/farm/${key}.png` });
  }
  files.push({ key: 'farm-factory-press', url: '/assets/farm/farm-factory-press.png' });

  for (const id of DECORATION_TYPE_IDS) {
    const key = `farm-decoration-${id}`;
    files.push({ key, url: `/assets/farm/${key}.png` });
  }

  return files;
}

export function allFarmSpriteKeys(): string[] {
  return FARM_SPRITE_FILES.map((f) => f.key);
}

export const FARM_SPRITE_FILES = buildFarmSpriteFiles();

/** Optional: load PNG overrides when files exist under public/assets/farm/. Not used by default. */
export function queueFarmSpriteLoads(scene: Phaser.Scene): void {
  for (const { key, url } of FARM_SPRITE_FILES) {
    if (!scene.textures.exists(key)) {
      scene.load.image(key, url);
    }
  }
}
