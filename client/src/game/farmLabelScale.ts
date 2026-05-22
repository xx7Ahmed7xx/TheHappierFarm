import Phaser from 'phaser';
import { footprintScreenBounds } from './farmFootprint';
import { TILE_HALF_H, TILE_HALF_W } from './isometric';

const ZOOM_MIN = 0.55;
const ZOOM_MAX = 1.85;

/** 1×1 tile diamond size on screen in pixels (world units × zoom). */
export function tileScreenSize(zoom: number): { width: number; height: number } {
  const z = Phaser.Math.Clamp(zoom, ZOOM_MIN, ZOOM_MAX);
  return {
    width: TILE_HALF_W * 2 * z,
    height: TILE_HALF_H * 2 * z,
  };
}

function footprintScreenSize(
  footprintW: number,
  footprintH: number,
  zoom: number,
): { width: number; height: number } {
  const b = footprintScreenBounds(footprintW, footprintH);
  const z = Phaser.Math.Clamp(zoom, ZOOM_MIN, ZOOM_MAX);
  return { width: b.width * z, height: b.height * z };
}

/** Font size from on-screen tile/footprint width — stays small when zoomed in. */
export function labelFontSizePx(
  zoom: number,
  footprintW = 1,
  footprintH = 1,
  opts?: { widthFrac?: number; minPx?: number; maxPx?: number },
): number {
  const { widthFrac = 0.12, minPx = 8, maxPx = 12 } = opts ?? {};
  const fp = footprintScreenSize(footprintW, footprintH, zoom);
  const single = tileScreenSize(zoom);
  const refW = Math.max(single.width, fp.width * 0.65);
  return Phaser.Math.Clamp(Math.round(refW * widthFrac), minPx, maxPx);
}

export function timerLabelFontSize(zoom: number, footprintW = 1, footprintH = 1): string {
  return `${labelFontSizePx(zoom, footprintW, footprintH, {
    widthFrac: 0.11,
    minPx: 8,
    maxPx: 12,
  })}px`;
}

export function emojiLabelFontSize(zoom: number, footprintW = 1, footprintH = 1): string {
  return `${labelFontSizePx(zoom, footprintW, footprintH, {
    widthFrac: 0.16,
    minPx: 10,
    maxPx: 15,
  })}px`;
}

/**
 * Vertical gap above sprite top in world units (same screen gap at any zoom).
 */
export function labelLiftWorld(zoom: number, footprintW = 1, footprintH = 1): number {
  const fp = footprintScreenSize(footprintW, footprintH, zoom);
  const single = tileScreenSize(zoom);
  const refH = Math.max(single.height, fp.height * 0.5);
  const screenGap = Phaser.Math.Clamp(Math.round(refH * 0.28 + 5), 7, 14);
  const z = Phaser.Math.Clamp(zoom, ZOOM_MIN, ZOOM_MAX);
  return screenGap / z;
}

/** Text background padding scaled to label size. */
export function labelTextPadding(zoom: number, footprintW = 1, footprintH = 1): { x: number; y: number } {
  const px = labelFontSizePx(zoom, footprintW, footprintH);
  return { x: Math.max(2, Math.round(px * 0.35)), y: Math.max(1, Math.round(px * 0.12)) };
}
