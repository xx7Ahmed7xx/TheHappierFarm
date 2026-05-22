import type { FarmSnapshot, FarmTileDto } from './types';
import type { TileCoord } from './game/FarmScene';
import type { PlacementKind } from './types';
import { cellsInFootprint, catalogFootprint } from './game/farmFootprint';
import { computePlacementSecondsRemaining } from './growth';
/** Apply snapshot to HUD + Phaser without fetching. */
export function applyFarmSnapshot(
  snap: FarmSnapshot,
  deps: {
    renderMeta: (snap: FarmSnapshot) => void;
    setRegistry: (snap: FarmSnapshot) => void;
    applyScene: (snap: FarmSnapshot) => void;
  },
): void {
  deps.renderMeta(snap);
  deps.setRegistry(snap);
  deps.applyScene(snap);
}

function patchTile(
  tile: FarmTileDto,
  patch: Partial<FarmTileDto>,
): FarmTileDto {
  return { ...tile, ...patch };
}

/** Reset server-time anchor so live timers count down from this moment. */
function withFreshServerTime(snap: FarmSnapshot): FarmSnapshot {
  return { ...snap, serverTimeUtc: new Date().toISOString() };
}

function placementFieldsFor(
  snap: FarmSnapshot,
  anchorX: number,
  anchorY: number,
  kind: PlacementKind,
  typeId: number,
): Partial<FarmTileDto> {
  const fp = catalogFootprint(snap, { kind, typeId });
  const name =
    kind === 'animal'
      ? snap.animalCatalog.find((a) => a.id === typeId)?.name
      : kind === 'factory'
        ? snap.factoryCatalog.find((f) => f.id === typeId)?.name
        : snap.decorationCatalog.find((d) => d.id === typeId)?.name;
  const interval =
    kind === 'animal'
      ? snap.animalCatalog.find((a) => a.id === typeId)?.productionIntervalSeconds
      : kind === 'factory'
        ? snap.factoryCatalog.find((f) => f.id === typeId)?.processSeconds
        : null;

  return {
    placementKind: kind,
    placementTypeId: typeId,
    placementName: name ?? null,
    placementLastActionUtc:
      kind === 'decoration' || kind === 'animal' ? null : new Date().toISOString(),
    placementCooldownSeconds: interval ?? null,
    placementSecondsRemaining: kind === 'animal' ? null : (interval ?? null),
    placementAnchorX: anchorX,
    placementAnchorY: anchorY,
    placementFootprintW: fp.width,
    placementFootprintH: fp.height,
  };
}

export function optimisticPlant(
  snap: FarmSnapshot,
  coords: TileCoord[],
  cropTypeId: number,
): FarmSnapshot {
  const crop = snap.cropCatalog.find((c) => c.id === cropTypeId);
  const now = new Date().toISOString();
  const growth = crop?.growthDurationSeconds ?? 60;
  const coordSet = new Set(coords.map((c) => `${c.x},${c.y}`));
  const cost = (crop?.buyPrice ?? 0) * coordSet.size;

  return withFreshServerTime({
    ...snap,
    gold: Math.max(0, snap.gold - cost),
    tiles: snap.tiles.map((t) => {
      if (!coordSet.has(`${t.x},${t.y}`)) {
        return t;
      }
      return patchTile(t, {
        phase: 'Seedling',
        cropTypeId,
        cropName: crop?.name ?? null,
        plantedAtUtc: now,
        growthDurationSeconds: growth,
        progress01: 0,
        secondsRemaining: growth,
      });
    }),
  });
}

function bumpResource(
  resources: FarmSnapshot['resources'],
  code: string,
  amount: number,
): FarmSnapshot['resources'] {
  if (amount < 1) {
    return resources;
  }
  const list = [...resources];
  const row = list.find((r) => r.resourceCode === code);
  if (row) {
    return list.map((r) =>
      r.resourceCode === code ? { ...r, quantity: r.quantity + amount } : r,
    );
  }
  return [...list, { resourceCode: code, quantity: amount }];
}

export function optimisticHarvest(snap: FarmSnapshot, coords: TileCoord[]): FarmSnapshot {
  const coordSet = new Set(coords.map((c) => `${c.x},${c.y}`));
  let resources = snap.resources;
  let storageUsed = snap.storageUsed ?? resources.reduce((n, r) => n + r.quantity, 0);

  for (const c of coords) {
    const tile = snap.tiles.find((t) => t.x === c.x && t.y === c.y);
    if (!tile?.cropTypeId) {
      continue;
    }
    const crop = snap.cropCatalog.find((x) => x.id === tile.cropTypeId);
    if (!crop?.harvestResourceCode) {
      continue;
    }
    const yieldQty = Math.max(1, crop.baseYield ?? 1);
    resources = bumpResource(resources, crop.harvestResourceCode, yieldQty);
    storageUsed += yieldQty;
  }

  return withFreshServerTime({
    ...snap,
    resources,
    storageUsed,
    tiles: snap.tiles.map((t) => {
      if (!coordSet.has(`${t.x},${t.y}`)) {
        return t;
      }
      return patchTile(t, {
        phase: 'Empty',
        cropTypeId: null,
        cropName: null,
        plantedAtUtc: null,
        growthDurationSeconds: null,
        progress01: null,
        secondsRemaining: null,
      });
    }),
  });
}

export function optimisticPlace(
  snap: FarmSnapshot,
  anchorX: number,
  anchorY: number,
  kind: PlacementKind,
  typeId: number,
): FarmSnapshot {
  const fp = catalogFootprint(snap, { kind, typeId });
  const cells = new Set(cellsInFootprint(anchorX, anchorY, fp).map((c) => `${c.x},${c.y}`));
  const base = placementFieldsFor(snap, anchorX, anchorY, kind, typeId);

  return withFreshServerTime({
    ...snap,
    tiles: snap.tiles.map((t) => {
      if (!cells.has(`${t.x},${t.y}`)) {
        return t;
      }
      return patchTile(t, {
        ...base,
        placementIsAnchor: t.x === anchorX && t.y === anchorY,
      });
    }),
  });
}

/** After a successful barn collect — restart production timers on placed animals. */
export function optimisticCollectAnimals(snap: FarmSnapshot): FarmSnapshot {
  return withFreshServerTime({
    ...snap,
    tiles: snap.tiles.map((t) => {
      if (t.placementKind !== 'animal') {
        return t;
      }
      const remaining =
        t.placementSecondsRemaining ??
        computePlacementSecondsRemaining(t, Date.now(), Date.parse(snap.serverTimeUtc) || null);
      if (remaining == null || remaining !== 0) {
        return t;
      }
      return patchTile(t, {
        placementLastActionUtc: null,
        placementSecondsRemaining: null,
      });
    }),
  });
}

export function optimisticPickup(snap: FarmSnapshot, anchors: TileCoord[]): FarmSnapshot {
  const anchorKeys = new Set(anchors.map((a) => `${a.x},${a.y}`));
  const clearKeys = new Set<string>();

  for (const tile of snap.tiles) {
    if (!tile.placementKind) {
      continue;
    }
    const ax = tile.placementAnchorX ?? tile.x;
    const ay = tile.placementAnchorY ?? tile.y;
    if (anchorKeys.has(`${ax},${ay}`)) {
      const w = tile.placementFootprintW ?? 1;
      const h = tile.placementFootprintH ?? 1;
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          clearKeys.add(`${ax + dx},${ay + dy}`);
        }
      }
    }
  }

  return withFreshServerTime({
    ...snap,
    tiles: snap.tiles.map((t) => {
      if (!clearKeys.has(`${t.x},${t.y}`)) {
        return t;
      }
      return patchTile(t, {
        placementKind: null,
        placementTypeId: null,
        placementName: null,
        placementLastActionUtc: null,
        placementCooldownSeconds: null,
        placementSecondsRemaining: null,
        placementAnchorX: null,
        placementAnchorY: null,
        placementFootprintW: null,
        placementFootprintH: null,
        placementIsAnchor: false,
      });
    }),
  });
}
