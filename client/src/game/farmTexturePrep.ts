import { FARM_SPRITE_FILES } from './farmAssets';
import { isProceduralFarmTexture } from './farmProceduralSprites';

export const FARM_SPRITE_ANCHOR_PREFIX = 'farmSpriteAnchor:';
export const FARM_SPRITE_FOOT_PREFIX = 'farmSpriteFoot:';

export type SpriteAnchor = { ox: number; oy: number };

/** Opaque width at the foot row and height from foot to top (texture pixels). */
export type SpriteFootMetrics = {
  footSpanPx: number;
  bodyHeightPx: number;
};

/** Bottom-center of opaque art in texture space (0–1), for iso foot placement. */
export function computeSpriteAnchor(canvas: HTMLCanvasElement): SpriteAnchor {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { ox: 0.5, oy: 1 };
  }

  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  const minOpaque = Math.max(3, Math.floor(w * 0.035));

  let footY = h - 1;
  for (let y = h - 1; y >= 0; y--) {
    let count = 0;
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3]! > 16) {
        count++;
      }
    }
    if (count >= minOpaque) {
      footY = y;
      break;
    }
  }

  let minX = w;
  let maxX = -1;
  for (let x = 0; x < w; x++) {
    if (data[(footY * w + x) * 4 + 3]! > 16) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
  }

  const ox = maxX >= minX ? (minX + maxX + 1) / (2 * w) : 0.5;
  const oy = (footY + 1) / h;
  return { ox, oy };
}

export function getFarmSpriteAnchor(scene: Phaser.Scene, key: string): SpriteAnchor {
  return (
    (scene.registry.get(`${FARM_SPRITE_ANCHOR_PREFIX}${key}`) as SpriteAnchor | undefined) ?? {
      ox: 0.5,
      oy: 1,
    }
  );
}

export function measureSpriteFootMetrics(canvas: HTMLCanvasElement): SpriteFootMetrics {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { footSpanPx: canvas.width, bodyHeightPx: canvas.height };
  }

  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  const minOpaque = Math.max(3, Math.floor(w * 0.035));

  let footY = h - 1;
  for (let y = h - 1; y >= 0; y--) {
    let count = 0;
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3]! > 16) {
        count++;
      }
    }
    if (count >= minOpaque) {
      footY = y;
      break;
    }
  }

  const bandRows = Math.max(2, Math.floor(h * 0.14));
  const bandStart = Math.max(0, footY - bandRows);
  let footMinX = w;
  let footMaxX = -1;
  for (let y = bandStart; y <= footY; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3]! > 16) {
        footMinX = Math.min(footMinX, x);
        footMaxX = Math.max(footMaxX, x);
      }
    }
  }

  let topY = footY;
  for (let y = 0; y <= footY; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3]! > 16) {
        topY = Math.min(topY, y);
      }
    }
  }

  const footSpanPx = footMaxX >= footMinX ? footMaxX - footMinX + 1 : w;
  const bodyHeightPx = Math.max(1, footY - topY + 1);

  return { footSpanPx, bodyHeightPx };
}

export function getFarmSpriteFootMetrics(
  scene: Phaser.Scene,
  key: string,
  fallbackW: number,
  fallbackH: number,
): SpriteFootMetrics {
  const stored = scene.registry.get(`${FARM_SPRITE_FOOT_PREFIX}${key}`) as
    | SpriteFootMetrics
    | undefined;
  if (stored && stored.footSpanPx > 0) {
    return stored;
  }
  return {
    footSpanPx: Math.max(8, fallbackW * 0.55),
    bodyHeightPx: Math.max(8, fallbackH * 0.85),
  };
}

export function setFarmSpriteFootMetrics(
  scene: Phaser.Scene,
  key: string,
  metrics: SpriteFootMetrics,
): void {
  scene.registry.set(`${FARM_SPRITE_FOOT_PREFIX}${key}`, metrics);
}

/** White/gray PNG backdrop + AI grass mats (must match game field #4a8f3c). */
function isBackgroundColor(r: number, g: number, b: number, a: number): boolean {
  if (a < 8) {
    return true;
  }
  if (r > 248 && g > 248 && b > 248) {
    return true;
  }
  if (r > 165 && g > 165 && b > 165 && r < 252) {
    const spread = Math.max(r, g, b) - Math.min(r, g, b);
    if (spread < 24) {
      return true;
    }
  }
  if (g > r + 18 && g > b + 12 && g > 72) {
    return true;
  }
  if (Math.abs(r - 74) < 50 && Math.abs(g - 143) < 60 && Math.abs(b - 60) < 50) {
    return true;
  }
  return false;
}

function punchGreenPixels(d: Uint8ClampedArray): void {
  for (let p = 0; p < d.length; p += 4) {
    if (isBackgroundColor(d[p]!, d[p + 1]!, d[p + 2]!, d[p + 3]!)) {
      d[p + 3] = 0;
    }
  }
}

function stripBackgroundToCanvas(source: HTMLImageElement | HTMLCanvasElement): HTMLCanvasElement {
  const w = source.width;
  const h = source.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return canvas;
  }

  ctx.drawImage(source, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  const pushIfBg = (x: number, y: number): void => {
    const i = y * w + x;
    if (visited[i]) {
      return;
    }
    const p = i * 4;
    if (!isBackgroundColor(d[p]!, d[p + 1]!, d[p + 2]!, d[p + 3]!)) {
      return;
    }
    visited[i] = 1;
    queue.push(x, y);
  };

  for (let x = 0; x < w; x++) {
    pushIfBg(x, 0);
    pushIfBg(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushIfBg(0, y);
    pushIfBg(w - 1, y);
  }

  while (queue.length > 0) {
    const y = queue.pop()!;
    const x = queue.pop()!;
    const p = (y * w + x) * 4;
    d[p + 3] = 0;

    if (x > 0) {
      pushIfBg(x - 1, y);
    }
    if (x < w - 1) {
      pushIfBg(x + 1, y);
    }
    if (y > 0) {
      pushIfBg(x, y - 1);
    }
    if (y < h - 1) {
      pushIfBg(x, y + 1);
    }
  }

  punchGreenPixels(d);
  ctx.putImageData(imageData, 0, 0);
  return trimCanvasToContent(canvas);
}

/** Crop transparent padding so iso sprites scale to visible art, not the full canvas. */
export function trimCanvasToContent(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return canvas;
  }

  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3]!;
      if (a > 16) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return canvas;
  }

  const pad = 6;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);

  const tw = maxX - minX + 1;
  const th = maxY - minY + 1;
  const trimmed = document.createElement('canvas');
  trimmed.width = tw;
  trimmed.height = th;
  const tctx = trimmed.getContext('2d', { willReadFrequently: false });
  if (!tctx) {
    return canvas;
  }
  tctx.drawImage(canvas, minX, minY, tw, th, 0, 0, tw, th);
  return trimmed;
}

/** Replace loaded PNG textures with transparent canvas versions (removes white/green backdrop). */
const PREPARED_REGISTRY_KEY = 'farmTexturesPrepared';
const PREPARED_VERSION = 6;

export function prepareFarmTextures(scene: Phaser.Scene): void {
  if (scene.registry.get(PREPARED_REGISTRY_KEY) === PREPARED_VERSION) {
    return;
  }

  for (const { key } of FARM_SPRITE_FILES) {
    if (!scene.textures.exists(key) || isProceduralFarmTexture(scene, key)) {
      continue;
    }

    const texture = scene.textures.get(key);
    const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | null;
    if (!source || !('width' in source) || source.width < 1) {
      continue;
    }

    const cleaned = stripBackgroundToCanvas(source);
    if (scene.textures.exists(key)) {
      scene.textures.remove(key);
    }
    scene.textures.addCanvas(key, cleaned);
    scene.registry.set(`${FARM_SPRITE_ANCHOR_PREFIX}${key}`, computeSpriteAnchor(cleaned));
    setFarmSpriteFootMetrics(scene, key, measureSpriteFootMetrics(cleaned));
  }

  scene.registry.set(PREPARED_REGISTRY_KEY, PREPARED_VERSION);
}
