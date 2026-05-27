import Phaser from 'phaser';
import type { FarmWorldBounds } from './isometric';

/** Fraction of the visible world (at current zoom) used as extra pan room beyond the farm bounds. */
const PAN_SLACK_FRAC = 0.55;

/**
 * Map a browser (client) point to camera viewport pixels.
 * Needed because the canvas is CSS-stretched; raw input coords can drift toward a corner.
 */
export function clientToCameraPoint(
  scene: Phaser.Scene,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const cam = scene.cameras.main;
  const rect = scene.game.canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: cam.width * 0.5, y: cam.height * 0.5 };
  }
  return {
    x: Phaser.Math.Clamp(((clientX - rect.left) / rect.width) * cam.width, 0, cam.width),
    y: Phaser.Math.Clamp(((clientY - rect.top) / rect.height) * cam.height, 0, cam.height),
  };
}

/**
 * Clamp camera scroll with generous slack that scales with zoom
 * (world slack shrinks when zoomed in, so screen-space pan range stays usable).
 */
export function clampFarmCameraScroll(
  cam: Phaser.Cameras.Scene2D.Camera,
  bounds: FarmWorldBounds,
  pad = 24,
): void {
  const viewW = cam.width / cam.zoom;
  const viewH = cam.height / cam.zoom;
  const slackX = Math.max(pad, viewW * PAN_SLACK_FRAC);
  const slackY = Math.max(pad, viewH * PAN_SLACK_FRAC);

  let minSX = bounds.minX - slackX;
  let maxSX = bounds.maxX - viewW + slackX;
  let minSY = bounds.minY - slackY;
  let maxSY = bounds.maxY - viewH + slackY;

  // Viewport wider than farm: keep roughly centered but still allow pan slack.
  if (viewW >= bounds.width) {
    const centeredX = bounds.centerX - viewW / 2;
    cam.scrollX = Phaser.Math.Clamp(cam.scrollX, centeredX - slackX, centeredX + slackX);
  } else if (maxSX < minSX) {
    cam.scrollX = (minSX + maxSX) / 2;
  } else {
    cam.scrollX = Phaser.Math.Clamp(cam.scrollX, minSX, maxSX);
  }

  if (viewH >= bounds.height) {
    const centeredY = bounds.centerY - viewH / 2;
    cam.scrollY = Phaser.Math.Clamp(cam.scrollY, centeredY - slackY, centeredY + slackY);
  } else if (maxSY < minSY) {
    cam.scrollY = (minSY + maxSY) / 2;
  } else {
    cam.scrollY = Phaser.Math.Clamp(cam.scrollY, minSY, maxSY);
  }
}

/** Place the farm diamond in the middle of the current viewport. */
export function centerFarmCamera(
  cam: Phaser.Cameras.Scene2D.Camera,
  bounds: FarmWorldBounds,
): void {
  if (cam.width < 1 || cam.height < 1) {
    return;
  }
  const viewW = cam.width / cam.zoom;
  const viewH = cam.height / cam.zoom;
  cam.scrollX = bounds.centerX - viewW / 2;
  cam.scrollY = bounds.centerY - viewH / 2;
  clampFarmCameraScroll(cam, bounds);
}

/** Keep the world point under (screenX, screenY) fixed while changing zoom. */
export function setCameraZoomAt(
  cam: Phaser.Cameras.Scene2D.Camera,
  newZoom: number,
  screenX: number,
  screenY: number,
): void {
  const wx = cam.scrollX + screenX / cam.zoom;
  const wy = cam.scrollY + screenY / cam.zoom;
  cam.setZoom(newZoom);
  cam.scrollX = wx - screenX / newZoom;
  cam.scrollY = wy - screenY / newZoom;
}

/** Pan in screen pixels — divide by zoom so speed feels the same at any magnification. */
export function applyCameraPanScreenDelta(
  cam: Phaser.Cameras.Scene2D.Camera,
  startScrollX: number,
  startScrollY: number,
  screenDx: number,
  screenDy: number,
): void {
  const z = cam.zoom;
  cam.scrollX = startScrollX - screenDx / z;
  cam.scrollY = startScrollY - screenDy / z;
}
