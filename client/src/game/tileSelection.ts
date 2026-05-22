import type { FarmSnapshot, FarmTileDto } from '../types';

export type TileCoord = { x: number; y: number };

export function tilePlacement(tile: FarmTileDto): { kind: string | null; typeId: number | null } {
  const raw = tile as FarmTileDto & { PlacementKind?: string; PlacementTypeId?: number };
  return {
    kind: tile.placementKind ?? raw.PlacementKind ?? null,
    typeId: tile.placementTypeId ?? raw.PlacementTypeId ?? null,
  };
}

export function findTile(snap: FarmSnapshot, x: number, y: number): FarmTileDto | undefined {
  return snap.tiles.find((t) => t.x === x && t.y === y);
}

/** Placement anchors in the drag box (one per multi-tile object). */
export function findPlacedTilesInSelection(snap: FarmSnapshot, coords: TileCoord[]): TileCoord[] {
  const out: TileCoord[] = [];
  const seen = new Set<string>();
  for (const { x, y } of coords) {
    const tile = findTile(snap, x, y);
    if (!tile || !tilePlacement(tile).kind) {
      continue;
    }
    const ax = tile.placementAnchorX ?? x;
    const ay = tile.placementAnchorY ?? y;
    const key = `${ax},${ay}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push({ x: ax, y: ay });
  }
  return out;
}

/** First empty soil tile in selection (no crop, no placement). */
export function findFirstEmptySoilInSelection(
  snap: FarmSnapshot,
  coords: TileCoord[],
): TileCoord | null {
  for (const { x, y } of coords) {
    const tile = findTile(snap, x, y);
    if (!tile) {
      continue;
    }
    const { kind } = tilePlacement(tile);
    if (tile.phase === 'Empty' && !kind && tile.cropTypeId === null) {
      return { x, y };
    }
  }
  return null;
}
