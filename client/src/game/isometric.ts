/** 2:1 isometric helpers — grid (x,y) maps to rhombus tiles on screen. */

/** Half-width / half-height of the top diamond face (classic 2:1 iso). */
export const TILE_HALF_W = 36;
export const TILE_HALF_H = 18;

/** Vertical extrusion for the “cubic” side faces. */
export const TILE_DEPTH = 10;

export interface IsoPoint {
  x: number;
  y: number;
}

export function gridToScreen(gridX: number, gridY: number): IsoPoint {
  return {
    x: (gridX - gridY) * TILE_HALF_W,
    y: (gridX + gridY) * TILE_HALF_H,
  };
}

export function screenToGrid(screenX: number, screenY: number): IsoPoint {
  const gx = (screenX / TILE_HALF_W + screenY / TILE_HALF_H) / 2;
  const gy = (screenY / TILE_HALF_H - screenX / TILE_HALF_W) / 2;
  return { x: Math.floor(gx), y: Math.floor(gy) };
}

/** All grid cells in the axis-aligned rectangle between two corners (inclusive). */
export function gridRectTiles(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  gridSize: number,
): { x: number; y: number }[] {
  const minX = Math.max(0, Math.min(x0, x1));
  const maxX = Math.min(gridSize - 1, Math.max(x0, x1));
  const minY = Math.max(0, Math.min(y0, y1));
  const maxY = Math.min(gridSize - 1, Math.max(y0, y1));
  const tiles: { x: number; y: number }[] = [];

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      tiles.push({ x, y });
    }
  }

  return tiles;
}

/** Top-left anchor for tile (0,0) in farm world local space (grows right/down with grid). */
export function farmGridOrigin(): IsoPoint {
  const margin = 72;
  return { x: margin, y: margin + TILE_DEPTH };
}

export interface FarmWorldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/** Screen-space bounds of the whole farm (local to farm world container). */
export function farmWorldBounds(gridSize: number, origin: IsoPoint): FarmWorldBounds {
  const boundsPadX = TILE_HALF_W * 2;
  const boundsPadY = TILE_HALF_H * 4 + 80;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const padTop = TILE_HALF_H + 56;
  const padBottom = TILE_HALF_H + TILE_DEPTH + 56;
  const padX = TILE_HALF_W + 24;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const p = gridToScreen(x, y);
      const wx = origin.x + p.x;
      const wy = origin.y + p.y;
      minX = Math.min(minX, wx - padX);
      maxX = Math.max(maxX, wx + padX);
      minY = Math.min(minY, wy - padTop);
      maxY = Math.max(maxY, wy + padBottom);
    }
  }

  if (!Number.isFinite(minX)) {
    minX = origin.x;
    maxX = origin.x + boundsPadX;
    minY = origin.y;
    maxY = origin.y + boundsPadY;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + boundsPadX,
    height: maxY - minY + boundsPadY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

/** Visual center of the iso diamond (for camera / background). */
export function farmDiamondCenter(gridSize: number, origin: IsoPoint): IsoPoint {
  const n = Math.max(0, gridSize - 1);
  const north = gridToScreen(0, 0);
  const east = gridToScreen(n, 0);
  const west = gridToScreen(0, n);
  const south = gridToScreen(n, n);
  return {
    x: origin.x + (north.x + east.x + west.x + south.x) / 4,
    y: origin.y + (north.y + east.y + west.y + south.y) / 4 + TILE_HALF_H * 0.35,
  };
}

/** Place the farm so the iso diamond sits in the middle of the viewport. */
export function farmOrigin(
  canvasWidth: number,
  canvasHeight: number,
  gridSize: number = 9,
): IsoPoint {
  const rel = farmDiamondCenter(gridSize, { x: 0, y: 0 });
  return {
    x: canvasWidth / 2 - rel.x,
    y: canvasHeight / 2 - rel.y,
  };
}

export function darken(hex: number, amount: number): number {
  const r = Math.max(0, ((hex >> 16) & 0xff) - amount);
  const g = Math.max(0, ((hex >> 8) & 0xff) - amount);
  const b = Math.max(0, (hex & 0xff) - amount);
  return (r << 16) | (g << 8) | b;
}
