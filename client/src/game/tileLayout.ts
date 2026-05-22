import { TILE_DEPTH, TILE_HALF_H, TILE_HALF_W } from './isometric';

/** Soil diamond is drawn at container origin (grid tile center). */
export const SOIL_SCALE = 1.0;

/**
 * Target on-screen base size for PNG art (display pixels after fitFarmSpriteDisplay).
 * Author bases at the bottom center of the canvas; width ≈ values below.
 *
 * | Footprint | Base width × depth (px) |
 * |-----------|-------------------------|
 * | 1×1       | 72 × 36                 |
 * | 2×1       | 108 × 54                |
 * | 2×2       | 144 × 54                |
 */
export const TILE_SOIL_WIDTH_PX = Math.round(TILE_HALF_W * 2 * SOIL_SCALE);
export const TILE_SOIL_DEPTH_PX = Math.round(TILE_HALF_H * 2 * SOIL_SCALE);
export const SOIL_TOP_Y = -TILE_HALF_H * SOIL_SCALE;

/**
 * Where props "stand" on the iso tile — south corner of the soil diamond (toward camera).
 * Container (0,0) is the tile center; this is the front foot point.
 */
export const TILE_ANCHOR_X = 0;
/** South vertex of the soil top face (one tile). */
export const TILE_ANCHOR_Y = TILE_HALF_H * SOIL_SCALE;
/** Front of the extruded soil face — use for crops & props on a single tile. */
export const TILE_SOIL_FRONT_Y = TILE_ANCHOR_Y + TILE_DEPTH;

/** @deprecated Use TILE_ANCHOR_* — kept for imports during transition */
export const TILE_FACE_X = TILE_ANCHOR_X;
export const TILE_FACE_Y = TILE_ANCHOR_Y;

/** Target sprite size on tile (from iso tile geometry). */
export const TILE_SPRITE_TARGET_HEIGHT = Math.round(TILE_HALF_H * 4.8);
export const TILE_SPRITE_MAX_WIDTH = Math.round(TILE_HALF_W * 2.4 * SOIL_SCALE);

/** Hit area matches full soil tile. */
export const TILE_HIT_HW = TILE_HALF_W;
export const TILE_HIT_HH = TILE_HALF_H;
