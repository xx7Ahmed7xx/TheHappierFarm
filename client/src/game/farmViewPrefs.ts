import { getUserId } from '../network';

const ZOOM_KEY_PREFIX = 'happierFarmZoom:';

export const FARM_ZOOM_MIN = 0.55;
export const FARM_ZOOM_MAX = 1.85;

/** Last camera zoom for the signed-in player (local only). */
export function loadFarmZoom(): number | null {
  const userId = getUserId();
  if (!userId) {
    return null;
  }
  const raw = localStorage.getItem(`${ZOOM_KEY_PREFIX}${userId}`);
  if (raw === null) {
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return null;
  }
  return Math.min(FARM_ZOOM_MAX, Math.max(FARM_ZOOM_MIN, n));
}

export function saveFarmZoom(zoom: number): void {
  const userId = getUserId();
  if (!userId) {
    return;
  }
  const clamped = Math.min(FARM_ZOOM_MAX, Math.max(FARM_ZOOM_MIN, zoom));
  localStorage.setItem(`${ZOOM_KEY_PREFIX}${userId}`, String(clamped));
}
