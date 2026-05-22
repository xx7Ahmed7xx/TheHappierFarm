import type { FarmSnapshot } from '../types';

/** Canonical sell price per barn resource code (from server ResourceDefinitions). */
export function sellPriceForResourceCode(
  snap: FarmSnapshot,
  code: string,
): number | undefined {
  const normalized = code.trim().toLowerCase();
  const row = snap.resourceCatalog.find((r) => r.code === normalized);
  if (!row || row.sellValue <= 0) {
    return undefined;
  }
  return row.sellValue;
}
