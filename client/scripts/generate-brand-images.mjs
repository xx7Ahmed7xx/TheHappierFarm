/**
 * Builds square favicons + social preview PNGs from happier-farm-logo.png.
 * Output: public/assets/brand/favicon-*.png, og-share.png
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const brandDir = join(root, 'public', 'assets', 'brand');
const source = join(brandDir, 'happier-farm-logo.png');

const BG = { r: 13, g: 40, b: 24 }; // #0d2818
const BG_LIGHT = { r: 26, g: 92, b: 58 }; // accent for OG gradient

function readPng(path) {
  return PNG.sync.read(readFileSync(path));
}

function writePng(path, png) {
  writeFileSync(path, PNG.sync.write(png));
}

function clonePng(w, h) {
  const png = new PNG({ width: w, height: h });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i + 3] = 255;
  }
  return png;
}

function contentBounds(png, alphaMin = 12) {
  let minX = png.width;
  let minY = png.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const i = (png.width * y + x) << 2;
      if (png.data[i + 3] >= alphaMin) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) {
    return { x: 0, y: 0, w: png.width, h: png.height };
  }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function crop(png, x, y, w, h) {
  const out = new PNG({ width: w, height: h });
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const sx = x + dx;
      const sy = y + dy;
      const si = (png.width * sy + sx) << 2;
      const di = (w * dy + dx) << 2;
      out.data[di] = png.data[si];
      out.data[di + 1] = png.data[si + 1];
      out.data[di + 2] = png.data[si + 2];
      out.data[di + 3] = png.data[si + 3];
    }
  }
  return out;
}

function cropSquare(png, paddingRatio = 0.06) {
  const b = contentBounds(png);
  const side = Math.max(b.w, b.h);
  const pad = Math.round(side * paddingRatio);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  let x = Math.round(cx - side / 2) - pad;
  let y = Math.round(cy - side / 2) - pad;
  let sideP = side + pad * 2;
  x = Math.max(0, x);
  y = Math.max(0, y);
  if (x + sideP > png.width) sideP = png.width - x;
  if (y + sideP > png.height) sideP = png.height - y;
  return crop(png, x, y, sideP, sideP);
}

function sample(src, sx, sy) {
  const x = Math.min(src.width - 1, Math.max(0, Math.floor(sx)));
  const y = Math.min(src.height - 1, Math.max(0, Math.floor(sy)));
  const i = (src.width * y + x) << 2;
  return [src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]];
}

function resize(src, width, height) {
  const out = new PNG({ width, height });
  const xScale = src.width / width;
  const yScale = src.height / height;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = sample(src, (x + 0.5) * xScale - 0.5, (y + 0.5) * yScale - 0.5);
      const di = (width * y + x) << 2;
      out.data[di] = r;
      out.data[di + 1] = g;
      out.data[di + 2] = b;
      out.data[di + 3] = a;
    }
  }
  return out;
}

function fillSolid(png, color) {
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = color.r;
    png.data[i + 1] = color.g;
    png.data[i + 2] = color.b;
    png.data[i + 3] = 255;
  }
}

function fillVerticalGradient(png, top, bottom) {
  for (let y = 0; y < png.height; y++) {
    const t = y / Math.max(1, png.height - 1);
    const r = Math.round(top.r + (bottom.r - top.r) * t);
    const g = Math.round(top.g + (bottom.g - top.g) * t);
    const b = Math.round(top.b + (bottom.b - top.b) * t);
    for (let x = 0; x < png.width; x++) {
      const i = (png.width * y + x) << 2;
      png.data[i] = r;
      png.data[i + 1] = g;
      png.data[i + 2] = b;
      png.data[i + 3] = 255;
    }
  }
}

function blitCenter(dest, src, scale = 0.78) {
  const maxW = Math.round(dest.width * scale);
  const maxH = Math.round(dest.height * scale);
  const ratio = Math.min(maxW / src.width, maxH / src.height);
  const dw = Math.round(src.width * ratio);
  const dh = Math.round(src.height * ratio);
  const scaled = resize(src, dw, dh);
  const ox = Math.round((dest.width - dw) / 2);
  const oy = Math.round((dest.height - dh) / 2);

  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const si = (dw * y + x) << 2;
      const sa = scaled.data[si + 3] / 255;
      if (sa <= 0) continue;
      const dx = ox + x;
      const dy = oy + y;
      if (dx < 0 || dy < 0 || dx >= dest.width || dy >= dest.height) continue;
      const di = (dest.width * dy + dx) << 2;
      const inv = 1 - sa;
      dest.data[di] = Math.round(scaled.data[si] * sa + dest.data[di] * inv);
      dest.data[di + 1] = Math.round(scaled.data[si + 1] * sa + dest.data[di + 1] * inv);
      dest.data[di + 2] = Math.round(scaled.data[si + 2] * sa + dest.data[di + 2] * inv);
      dest.data[di + 3] = 255;
    }
  }
}

function makeSquareIcon(squareSrc, size) {
  const canvas = clonePng(size, size);
  fillSolid(canvas, BG);
  blitCenter(canvas, squareSrc, 0.82);
  return canvas;
}

function makeOgShare(squareSrc) {
  const canvas = clonePng(1200, 630);
  fillVerticalGradient(canvas, BG_LIGHT, BG);
  blitCenter(canvas, squareSrc, 0.72);
  return canvas;
}

if (!existsSync(source)) {
  console.warn(`[brand-images] skip — not found: ${source}`);
  process.exit(0);
}

const logo = readPng(source);
const square = cropSquare(logo);

const outputs = [
  ['favicon-32.png', makeSquareIcon(square, 32)],
  ['favicon-192.png', makeSquareIcon(square, 192)],
  ['favicon-512.png', makeSquareIcon(square, 512)],
  ['og-share.png', makeOgShare(square)],
];

for (const [name, png] of outputs) {
  const out = join(brandDir, name);
  writePng(out, png);
  console.log(`[brand-images] ${out} (${png.width}x${png.height})`);
}
