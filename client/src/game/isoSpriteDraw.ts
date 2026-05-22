import Phaser from 'phaser';

/** Canvas space for procedural farm sprites (trimmed after bake). */
export const ISO_TEX_W = 88;
export const ISO_TEX_H = 96;
export const ISO_FEET_Y = ISO_TEX_H - 4;
export const ISO_CX = ISO_TEX_W / 2;

export type IsoColors = { top: number; left: number; right: number };

export function hexColor(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export function shade(color: number, amount: number): number {
  const r = Phaser.Math.Clamp(((color >> 16) & 0xff) + amount, 0, 255);
  const g = Phaser.Math.Clamp(((color >> 8) & 0xff) + amount, 0, 255);
  const b = Phaser.Math.Clamp((color & 0xff) + amount, 0, 255);
  return (r << 16) | (g << 8) | b;
}

export function isoShadow(
  g: Phaser.GameObjects.Graphics,
  cx = ISO_CX,
  foot = ISO_FEET_Y,
  rx = 34,
  ry = 12,
): void {
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(cx, foot + 2, rx, ry);
}

/** 2:1 isometric box anchored at south ground edge (cx, foot). */
export function isoBox(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  foot: number,
  fw: number,
  dep: number,
  bh: number,
  colors: IsoColors,
): void {
  const hw = fw / 2;
  const hd = dep / 2;
  const sw = cx - hw;
  const se = cx + hw;
  const nw = sw - dep;
  const ne = se + dep;
  const nfy = foot - hd;
  const swty = foot - bh;
  const nwty = foot - bh - hd;
  const nety = foot - bh - hd;

  g.fillStyle(colors.left, 1);
  g.beginPath();
  g.moveTo(sw, foot);
  g.lineTo(nw, nfy);
  g.lineTo(nw, nwty);
  g.lineTo(sw, swty);
  g.closePath();
  g.fillPath();

  g.fillStyle(colors.right, 1);
  g.beginPath();
  g.moveTo(se, foot);
  g.lineTo(ne, nfy);
  g.lineTo(ne, nety);
  g.lineTo(se, swty);
  g.closePath();
  g.fillPath();

  g.fillStyle(colors.top, 1);
  g.beginPath();
  g.moveTo(sw, swty);
  g.lineTo(se, swty);
  g.lineTo(ne, nety);
  g.lineTo(nw, nwty);
  g.closePath();
  g.fillPath();
}

export function isoOutline(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  foot: number,
  fw: number,
  dep: number,
  bh: number,
  color: number,
  alpha = 0.45,
): void {
  const hw = fw / 2;
  const hd = dep / 2;
  const sw = cx - hw;
  const se = cx + hw;
  const nw = sw - dep;
  const ne = se + dep;
  const nfy = foot - hd;
  const swty = foot - bh;
  const nwty = foot - bh - hd;
  const nety = foot - bh - hd;

  g.lineStyle(1, color, alpha);
  g.beginPath();
  g.moveTo(sw, foot);
  g.lineTo(nw, nfy);
  g.lineTo(nw, nwty);
  g.lineTo(sw, swty);
  g.lineTo(se, swty);
  g.lineTo(ne, nety);
  g.lineTo(ne, nfy);
  g.lineTo(se, foot);
  g.closePath();
  g.strokePath();
}

/** Gabled roof sitting on top of a box (south edge at y = baseY). */
export function isoGableRoof(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  baseY: number,
  fw: number,
  dep: number,
  peakH: number,
  colors: IsoColors,
): void {
  const hw = fw / 2;
  const hd = dep / 2;
  const sw = cx - hw;
  const se = cx + hw;
  const nw = sw - dep;
  const ne = se + dep;
  const ridgeY = baseY - hd * 2 - peakH;
  const midBackY = baseY - hd * 2;

  g.fillStyle(colors.left, 1);
  g.beginPath();
  g.moveTo(sw, baseY);
  g.lineTo(nw, baseY - hd);
  g.lineTo(cx, ridgeY);
  g.lineTo(cx, midBackY);
  g.closePath();
  g.fillPath();

  g.fillStyle(colors.right, 1);
  g.beginPath();
  g.moveTo(se, baseY);
  g.lineTo(ne, baseY - hd);
  g.lineTo(cx, ridgeY);
  g.lineTo(cx, midBackY);
  g.closePath();
  g.fillPath();

  g.fillStyle(colors.top, 1);
  g.beginPath();
  g.moveTo(sw, baseY);
  g.lineTo(se, baseY);
  g.lineTo(cx, ridgeY);
  g.closePath();
  g.fillPath();
}

/** Flat tilled mound (crop seed bed). */
export function isoTilledMound(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  foot: number,
  w = 22,
): void {
  isoShadow(g, cx, foot, w * 0.9, 8);
  g.fillStyle(0x5d4037, 1);
  g.fillEllipse(cx, foot - 1, w, w * 0.42);
  g.fillStyle(0x795548, 1);
  g.fillEllipse(cx, foot - 3, w * 0.88, w * 0.36);
  g.fillStyle(0x8d6e63, 1);
  g.fillEllipse(cx, foot - 5, w * 0.72, w * 0.28);
}

/** Cylinder (hay bale, tree trunk) on ground. */
export function isoCylinder(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  foot: number,
  rw: number,
  rh: number,
  bodyH: number,
  top: number,
  side: number,
): void {
  const topY = foot - bodyH;
  g.fillStyle(side, 1);
  g.fillRect(cx - rw, topY + rh * 0.35, rw * 2, bodyH - rh * 0.35);
  g.fillStyle(top, 1);
  g.fillEllipse(cx, topY, rw, rh);
  g.fillStyle(shade(top, -18), 1);
  g.fillEllipse(cx, foot - 1, rw, rh * 0.85);
}

export function isoWindow(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  g.fillStyle(0x4fc3f7, 0.85);
  g.fillRect(x, y, w, h);
  g.lineStyle(1, 0x263238, 0.6);
  g.strokeRect(x, y, w, h);
  g.lineBetween(x + w / 2, y, x + w / 2, y + h);
  g.lineBetween(x, y + h / 2, x + w, y + h / 2);
}

export function isoDoor(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  g.fillStyle(0x4e342e, 1);
  g.fillRect(x, y, w, h);
  g.fillStyle(0xffd54f, 1);
  g.fillCircle(x + w - 3, y + h / 2, 2);
}
