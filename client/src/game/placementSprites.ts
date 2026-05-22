import Phaser from 'phaser';
import { fitFarmSpriteDisplay } from './farmSpriteDisplay';
import { footprintStackDepth } from './farmFootprint';

/** Scene-level sprites for multi-tile placements (sort above all tile containers). */
export class PlacementSpriteLayer {
  private readonly sprites = new Map<string, Phaser.GameObjects.Image>();
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  private key(anchorGx: number, anchorGy: number): string {
    return `${anchorGx},${anchorGy}`;
  }

  sync(
    anchorGx: number,
    anchorGy: number,
    worldX: number,
    worldY: number,
    textureKey: string | null,
    footprintW: number,
    footprintH: number,
  ): void {
    const k = this.key(anchorGx, anchorGy);
    if (!textureKey || !this.scene.textures.exists(textureKey)) {
      this.remove(anchorGx, anchorGy);
      return;
    }

    let img = this.sprites.get(k);
    if (!img) {
      img = this.scene.add.image(worldX, worldY, textureKey);
      img.setOrigin(0.5, 1);
      this.sprites.set(k, img);
    } else {
      img.setTexture(textureKey);
      img.setPosition(worldX, worldY);
      img.setVisible(true);
    }

    fitFarmSpriteDisplay(img, footprintW, footprintH);
    img.setDepth(
      footprintStackDepth(anchorGx, anchorGy, anchorGx, anchorGy, footprintW, footprintH, true),
    );
  }

  reposition(anchorGx: number, anchorGy: number, worldX: number, worldY: number): void {
    const img = this.sprites.get(this.key(anchorGx, anchorGy));
    if (img) {
      img.setPosition(worldX, worldY);
    }
  }

  remove(anchorGx: number, anchorGy: number): void {
    const k = this.key(anchorGx, anchorGy);
    this.sprites.get(k)?.destroy();
    this.sprites.delete(k);
  }

  clear(): void {
    for (const img of this.sprites.values()) {
      img.destroy();
    }
    this.sprites.clear();
  }
}
