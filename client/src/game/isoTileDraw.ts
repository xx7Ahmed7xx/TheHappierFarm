import { SOIL_COLOR } from '../growth';
import { darken, TILE_DEPTH, TILE_HALF_H, TILE_HALF_W } from './isometric';
import { SOIL_SCALE } from './tileLayout';

/** Matches Phaser field background (#4a8f3c). */
export const FIELD_GREEN = 0x4a8f3c;

export type IsoTilePalette = {
  top: number;
  edge: number;
  sideLeft: number;
  sideRight: number;
};

export type IsoTileVariant = 'soil' | 'natural';

/** Rich tilled earth (empty plots & crops). */
export const SOIL_PALETTE: IsoTilePalette = {
  top: SOIL_COLOR,
  edge: 0x3d2816,
  sideLeft: 0x4a321c,
  sideRight: 0x553820,
};

/** Living pasture — animals, open ground (field-toned, not neon lawn). */
export const MEADOW_PALETTE: IsoTilePalette = {
  top: 0x528a46,
  edge: 0x3a6534,
  sideLeft: 0x42683c,
  sideRight: 0x4a7244,
};

/** Worn farm yard under buildings — same family, a bit more earth. */
export const YARD_PALETTE: IsoTilePalette = {
  top: 0x5a8448,
  edge: 0x3f5a36,
  sideLeft: 0x475c3e,
  sideRight: 0x506646,
};

/** @deprecated */
export const GRASS_PALETTE = MEADOW_PALETTE;
export const HAY_PALETTE = MEADOW_PALETTE;
export const PAVEMENT_PALETTE = YARD_PALETTE;

export function tileVariantSeed(gridX: number, gridY: number): number {
  return ((gridX * 92837111) ^ (gridY * 689287499)) >>> 0;
}

function seeded(seed: number, slot: number): number {
  return ((seed * 1103515245 + 12345 + slot * 7919) >>> 0) / 0xffffffff;
}

function strokeRhombus(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  hw: number,
  hh: number,
  color: number,
  alpha: number,
  width = 1,
): void {
  g.lineStyle(width, color, alpha);
  g.beginPath();
  g.moveTo(x, y - hh);
  g.lineTo(x + hw, y);
  g.lineTo(x, y + hh);
  g.lineTo(x - hw, y);
  g.closePath();
  g.strokePath();
}

function drawIsoPrism(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  hw: number,
  hh: number,
  palette: IsoTilePalette,
  shallow = false,
): void {
  const d = shallow ? Math.max(4, Math.round(TILE_DEPTH * 0.45)) : TILE_DEPTH;

  g.fillStyle(palette.top, 1);
  g.beginPath();
  g.moveTo(x, y - hh);
  g.lineTo(x + hw, y);
  g.lineTo(x, y + hh);
  g.lineTo(x - hw, y);
  g.closePath();
  g.fillPath();

  strokeRhombus(g, x, y, hw, hh, palette.edge, shallow ? 0.35 : 0.75, 0.8);

  g.fillStyle(palette.sideRight, 1);
  g.beginPath();
  g.moveTo(x + hw, y);
  g.lineTo(x + hw, y + d);
  g.lineTo(x, y + hh + d);
  g.lineTo(x, y + hh);
  g.closePath();
  g.fillPath();

  g.fillStyle(palette.sideLeft, 1);
  g.beginPath();
  g.moveTo(x - hw, y);
  g.lineTo(x - hw, y + d);
  g.lineTo(x, y + hh + d);
  g.lineTo(x, y + hh);
  g.closePath();
  g.fillPath();
}

/** Soft organic patches — no glossy highlights or sharp strokes. */
function splat(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  hw: number,
  hh: number,
  color: number,
  alpha: number,
  rx: number,
  ry: number,
): void {
  g.fillStyle(color, alpha);
  g.fillEllipse(x, y, hw * rx, hh * ry);
}

function paintSoilDetail(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  hw: number,
  hh: number,
  palette: IsoTilePalette,
  seed: number,
): void {
  const r0 = seeded(seed, 0);

  g.lineStyle(1, darken(palette.top, 24), 0.12);
  for (let i = -2; i <= 2; i++) {
    const t = i * 0.2 + r0 * 0.06;
    g.beginPath();
    g.moveTo(x + (i - 1) * hw * 0.16, y + hh * (t - 0.1));
    g.lineTo(x + (i + 1) * hw * 0.2, y + hh * (t + 0.14));
    g.strokePath();
  }

  const pebbleCount = 4 + Math.floor(seeded(seed, 1) * 3);
  for (let i = 0; i < pebbleCount; i++) {
    const pr = seeded(seed, 10 + i);
    splat(
      g,
      x + (pr - 0.5) * hw,
      y + (seeded(seed, 20 + i) - 0.5) * hh * 0.85,
      hw,
      hh,
      darken(palette.top, pr > 0.5 ? 18 : -8),
      0.12 + pr * 0.1,
      0.05 + pr * 0.04,
      0.07 + pr * 0.05,
    );
  }

  splat(g, x - hw * 0.2, y + hh * 0.06, hw, hh, darken(palette.top, 14), 0.1, 0.38, 0.3);
  splat(g, x + hw * 0.15, y - hh * 0.04, hw, hh, darken(palette.top, -6), 0.08, 0.3, 0.24);
}

/**
 * Field-like meadow: muted greens, dry straw flecks, optional worn dirt (yards).
 * Matches the organic look around crop bases, not plastic turf or stone pavers.
 */
function paintNaturalDetail(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  hw: number,
  hh: number,
  palette: IsoTilePalette,
  seed: number,
  earthWear: number,
): void {
  splat(g, x, y, hw, hh, FIELD_GREEN, 0.22, 0.95, 0.88);
  splat(g, x - hw * 0.12, y + hh * 0.04, hw, hh, darken(palette.top, -6), 0.14, 0.72, 0.62);
  splat(g, x + hw * 0.1, y - hh * 0.06, hw, hh, darken(palette.top, 8), 0.12, 0.65, 0.55);

  const patchCount = 9 + Math.floor(seeded(seed, 2) * 5);
  for (let i = 0; i < patchCount; i++) {
    const pr = seeded(seed, 30 + i);
    const px = x + (pr - 0.5) * hw * 0.95;
    const py = y + (seeded(seed, 60 + i) - 0.5) * hh * 0.85;
    const tone =
      pr < 0.35
        ? darken(FIELD_GREEN, -4)
        : pr < 0.7
          ? darken(palette.top, pr > 0.5 ? 6 : -10)
          : darken(palette.top, 16);
    splat(g, px, py, hw, hh, tone, 0.07 + pr * 0.08, 0.14 + pr * 0.1, 0.1 + pr * 0.08);
  }

  const fleckCount = 6 + Math.floor(seeded(seed, 3) * 4);
  for (let i = 0; i < fleckCount; i++) {
    const fr = seeded(seed, 90 + i);
    splat(
      g,
      x + (fr - 0.5) * hw,
      y + (seeded(seed, 120 + i) - 0.5) * hh * 0.7,
      hw,
      hh,
      fr > 0.55 ? 0x8a9a52 : 0xc4b87a,
      0.06,
      0.04,
      0.03,
    );
  }

  if (earthWear > 0) {
    const dirtPatches = 3 + Math.floor(seeded(seed, 4) * 3);
    for (let i = 0; i < dirtPatches; i++) {
      const dr = seeded(seed, 150 + i);
      splat(
        g,
        x + (dr - 0.5) * hw * 0.7,
        y + (seeded(seed, 170 + i) - 0.3) * hh * 0.5,
        hw,
        hh,
        darken(SOIL_COLOR, dr > 0.5 ? 8 : 22),
        0.08 + earthWear * 0.12,
        0.2 + dr * 0.12,
        0.14 + dr * 0.1,
      );
    }
    g.lineStyle(1, darken(SOIL_COLOR, 20), 0.06 * earthWear);
    g.beginPath();
    g.moveTo(x - hw * 0.35, y + hh * 0.05);
    g.lineTo(x + hw * 0.3, y + hh * 0.1);
    g.strokePath();
  }

  g.lineStyle(1, darken(palette.top, 22), 0.06);
  g.beginPath();
  g.moveTo(x - hw * 0.45, y + hh * 0.08);
  g.lineTo(x + hw * 0.4, y - hh * 0.06);
  g.strokePath();
}

/** Draw one iso ground tile (center at x,y). */
export function paintIsoTile(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  palette: IsoTilePalette,
  variant: IsoTileVariant,
  seed = 0,
  naturalWear = 0,
): void {
  const hw = TILE_HALF_W * SOIL_SCALE;
  const hh = TILE_HALF_H * SOIL_SCALE;
  const shallow = variant === 'natural';

  drawIsoPrism(g, x, y, hw, hh, palette, shallow);

  if (variant === 'soil') {
    paintSoilDetail(g, x, y, hw, hh, palette, seed);
  } else {
    paintNaturalDetail(g, x, y, hw, hh, palette, seed, naturalWear);
  }
}
