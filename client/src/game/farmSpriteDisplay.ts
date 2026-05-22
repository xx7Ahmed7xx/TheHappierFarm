import Phaser from 'phaser';
import { footprintScreenBounds } from './farmFootprint';

/**
 * Scale sprite to exact footprint width on screen; height from art aspect ratio.
 * Origin should be (0.5, 1) at footprintSpriteAnchor.
 */
export function fitFarmSpriteDisplay(
  sprite: Phaser.GameObjects.Image,
  footprintW = 1,
  footprintH = 1,
): void {
  const frame = sprite.frame;
  const natW = frame.width;
  const natH = frame.height;
  if (natW <= 0 || natH <= 0) {
    return;
  }

  const bounds = footprintScreenBounds(footprintW, footprintH);
  const scale = bounds.width / natW;
  const displayW = bounds.width;
  const displayH = Math.max(1, Math.round(natH * scale));

  sprite.setDisplaySize(displayW, displayH);
}
