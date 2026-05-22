import Phaser from 'phaser';
import { FARM_SPRITE_FILES, queueFarmSpriteLoads } from './farmAssets';
import { registerFarmProceduralSprites } from './farmProceduralSprites';
import { prepareFarmTextures } from './farmTexturePrep';

/** Loads PNG farm art when present; procedural sprites fill any missing keys. */
export class PreloadScene extends Phaser.Scene {
  private readonly failedKeys = new Set<string>();

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.load.on('loaderror', (file: { key?: string }) => {
      if (file.key) {
        this.failedKeys.add(file.key);
      }
    });
    queueFarmSpriteLoads(this);
  }

  create(): void {
    for (const { key } of FARM_SPRITE_FILES) {
      if (!this.textures.exists(key)) {
        this.failedKeys.add(key);
      }
    }

    registerFarmProceduralSprites(this);
    prepareFarmTextures(this);
    this.registry.set('farmPngSpriteKeys', [
      ...FARM_SPRITE_FILES.map((f) => f.key).filter((k) => !this.failedKeys.has(k)),
    ]);
    this.scene.start('FarmScene');
  }
}
