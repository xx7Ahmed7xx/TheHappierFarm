import type { BuildItemSelection, FarmSnapshot } from '../types';
import type { TileCoord } from './FarmScene';
import { gridToScreen, TILE_HALF_H, TILE_HALF_W } from './isometric';
import { SOIL_SCALE, TILE_ANCHOR_X, TILE_ANCHOR_Y } from './tileLayout';
import { tilePlacement } from './tileSelection';

export interface Footprint {
  width: number;
  height: number;
}

/** Screen-space box for a w×h footprint (anchor tile center = 0,0). */
export type FootprintScreenBounds = {
  width: number;
  height: number;
  /** Bottom-center anchor — sprite origin (0.5, 1) sits here. */
  anchorX: number;
  anchorY: number;
};

export function catalogFootprint(snap: FarmSnapshot, build: BuildItemSelection): Footprint {
  if (build.kind === 'animal') {
    const a = snap.animalCatalog.find((x) => x.id === build.typeId);
    return { width: a?.footprintWidth ?? 1, height: a?.footprintHeight ?? 1 };
  }
  if (build.kind === 'factory') {
    const f = snap.factoryCatalog.find((x) => x.id === build.typeId);
    return { width: f?.footprintWidth ?? 1, height: f?.footprintHeight ?? 1 };
  }
  const d = snap.decorationCatalog.find((x) => x.id === build.typeId);
  return { width: d?.footprintWidth ?? 1, height: d?.footprintHeight ?? 1 };
}

export function cellsInFootprint(anchorX: number, anchorY: number, fp: Footprint): TileCoord[] {
  const out: TileCoord[] = [];
  for (let dy = 0; dy < fp.height; dy++) {
    for (let dx = 0; dx < fp.width; dx++) {
      out.push({ x: anchorX + dx, y: anchorY + dy });
    }
  }
  return out;
}

export function footprintFits(
  snap: FarmSnapshot,
  anchorX: number,
  anchorY: number,
  fp: Footprint,
): boolean {
  if (
    anchorX < 0
    || anchorY < 0
    || anchorX + fp.width > snap.gridSize
    || anchorY + fp.height > snap.gridSize
  ) {
    return false;
  }

  for (const { x, y } of cellsInFootprint(anchorX, anchorY, fp)) {
    const tile = snap.tiles.find((t) => t.x === x && t.y === y);
    if (!tile) {
      return false;
    }
    const { kind } = tilePlacement(tile);
    if (kind || tile.cropTypeId !== null || tile.phase !== 'Empty') {
      return false;
    }
  }

  return true;
}

export function findPlaceAnchorInSelection(
  snap: FarmSnapshot,
  coords: TileCoord[],
  fp: Footprint,
): TileCoord | null {
  if (coords.length === 0) {
    return null;
  }

  const minX = Math.min(...coords.map((c) => c.x));
  const minY = Math.min(...coords.map((c) => c.y));
  if (footprintFits(snap, minX, minY, fp)) {
    return { x: minX, y: minY };
  }

  for (const c of coords) {
    if (footprintFits(snap, c.x, c.y, fp)) {
      return c;
    }
  }

  return null;
}

/**
 * Exact iso footprint on screen for w×h tiles (anchor at top-left cell center = 0,0).
 */
export function footprintScreenBounds(
  footprintW: number,
  footprintH: number,
): FootprintScreenBounds {
  const w = Math.max(1, footprintW);
  const h = Math.max(1, footprintH);
  const tileW = TILE_HALF_W * 2 * SOIL_SCALE;
  const tileH = TILE_HALF_H * 2 * SOIL_SCALE;

  const corners = [
    gridToScreen(0, 0),
    gridToScreen(w - 1, 0),
    gridToScreen(0, h - 1),
    gridToScreen(w - 1, h - 1),
  ];
  const minX = Math.min(...corners.map((c) => c.x));
  const maxX = Math.max(...corners.map((c) => c.x));
  const minY = Math.min(...corners.map((c) => c.y));
  const maxY = Math.max(...corners.map((c) => c.y));

  const width = Math.round(maxX - minX + tileW);
  const height = Math.round(maxY - minY + tileH);

  let anchorX = TILE_ANCHOR_X;
  let anchorY = TILE_ANCHOR_Y;

  if (w > 1 || h > 1) {
    let southMinX = Infinity;
    let southMaxX = -Infinity;
    let southFootY = -Infinity;
    for (let dx = 0; dx < w; dx++) {
      const p = gridToScreen(dx, h - 1);
      southMinX = Math.min(southMinX, p.x);
      southMaxX = Math.max(southMaxX, p.x);
      southFootY = Math.max(southFootY, p.y + TILE_ANCHOR_Y);
    }
    anchorX = (southMinX + southMaxX) / 2;
    // Wide 2×1 rows share one grid Y — use anchor tile foot, not the eastern cell’s deeper vertex.
    anchorY = h === 1 ? gridToScreen(0, 0).y + TILE_ANCHOR_Y : southFootY;
  }

  return { width, height, anchorX, anchorY };
}

/** Screen anchor — bottom-center of footprint (relative to anchor tile center). */
export function footprintSpriteAnchor(
  footprintW: number,
  footprintH: number,
): { x: number; y: number } {
  const w = Math.max(1, footprintW);
  const h = Math.max(1, footprintH);
  if (w === 1 && h === 1) {
    return { x: TILE_ANCHOR_X, y: TILE_ANCHOR_Y };
  }
  const b = footprintScreenBounds(w, h);
  return { x: b.anchorX, y: b.anchorY };
}

export function footprintDisplaySize(
  footprintW: number,
  footprintH: number,
): { width: number; height: number } {
  const b = footprintScreenBounds(footprintW, footprintH);
  return { width: b.width, height: b.height };
}

/** Southernmost grid sort key for a w×h block (higher = drawn in front). */
export function footprintFrontSortKey(
  anchorGridX: number,
  anchorGridY: number,
  footprintW: number,
  footprintH: number,
): number {
  const w = Math.max(1, footprintW);
  const h = Math.max(1, footprintH);
  return anchorGridX + w - 1 + (anchorGridY + h - 1);
}

/**
 * Phaser depth for a tile stack. Container depth sorts the whole stack vs neighbors;
 * child sprite depth does not escape the container.
 */
export function footprintStackDepth(
  gridX: number,
  gridY: number,
  anchorGridX: number,
  anchorGridY: number,
  footprintW: number,
  footprintH: number,
  isAnchor: boolean,
): number {
  const w = Math.max(1, footprintW);
  const h = Math.max(1, footprintH);
  if (w === 1 && h === 1) {
    return gridX + gridY;
  }
  const front = footprintFrontSortKey(anchorGridX, anchorGridY, w, h);
  if (isAnchor) {
    // Feet/base extend ~1 cell past the footprint on screen; empty tiles south/east use gridX+gridY.
    return front + w + h + 0.1 + anchorGridX * 0.0001;
  }
  return gridX + gridY - 0.01;
}
