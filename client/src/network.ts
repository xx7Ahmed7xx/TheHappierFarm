import type {
  AuthResponse,
  BatchActionResult,
  FarmSnapshot,
  FarmTileDto,
  PlayerProfile,
} from './types';
import { apiUrl } from './runtimeConfig';

function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** API should be camelCase; normalize in case of casing mismatches. */
function normalizeTile(raw: Record<string, unknown>): FarmTileDto {
  const crop = raw.cropTypeId ?? raw.CropTypeId;
  const planted = raw.plantedAtUtc ?? raw.PlantedAtUtc;
  const pk = raw.placementKind ?? raw.PlacementKind;
  const pt = raw.placementTypeId ?? raw.PlacementTypeId;
  return {
    x: Number(raw.x ?? raw.X ?? 0),
    y: Number(raw.y ?? raw.Y ?? 0),
    phase: String(raw.phase ?? raw.Phase ?? 'Empty'),
    cropTypeId: crop === null || crop === undefined ? null : Number(crop),
    cropName: (raw.cropName ?? raw.CropName ?? null) as string | null,
    plantedAtUtc: (planted ?? null) as string | null,
    growthDurationSeconds: numOrNull(raw.growthDurationSeconds ?? raw.GrowthDurationSeconds),
    progress01: numOrNull(raw.progress01 ?? raw.Progress01),
    secondsRemaining: numOrNull(raw.secondsRemaining ?? raw.SecondsRemaining),
    placementKind: pk === null || pk === undefined ? null : String(pk),
    placementTypeId: pt === null || pt === undefined ? null : Number(pt),
    placementName: (raw.placementName ?? raw.PlacementName ?? null) as string | null,
    placementLastActionUtc: (raw.placementLastActionUtc ??
      raw.PlacementLastActionUtc ??
      null) as string | null,
    placementCooldownSeconds: numOrNull(
      raw.placementCooldownSeconds ?? raw.PlacementCooldownSeconds,
    ),
    placementSecondsRemaining: numOrNull(
      raw.placementSecondsRemaining ?? raw.PlacementSecondsRemaining,
    ),
    placementBatchRuns: numOrNull(raw.placementBatchRuns ?? raw.PlacementBatchRuns),
    placementAnchorX: numOrNull(raw.placementAnchorX ?? raw.PlacementAnchorX),
    placementAnchorY: numOrNull(raw.placementAnchorY ?? raw.PlacementAnchorY),
    placementFootprintW: numOrNull(raw.placementFootprintW ?? raw.PlacementFootprintW),
    placementFootprintH: numOrNull(raw.placementFootprintH ?? raw.PlacementFootprintH),
    placementIsAnchor: Boolean(
      raw.placementIsAnchor
        ?? raw.PlacementIsAnchor
        ?? (pk != null
          && Number(raw.placementAnchorX ?? raw.PlacementAnchorX ?? raw.x ?? raw.X) === Number(raw.x ?? raw.X)
          && Number(raw.placementAnchorY ?? raw.PlacementAnchorY ?? raw.y ?? raw.Y) === Number(raw.y ?? raw.Y)),
    ),
  };
}

function normalizeFarmSnapshot(raw: Record<string, unknown>): FarmSnapshot {
  const tilesRaw = (raw.tiles ?? raw.Tiles ?? []) as Record<string, unknown>[];
  const base = raw as unknown as FarmSnapshot;
  const expansionRaw = (raw.expansionOffer ?? raw.ExpansionOffer) as Record<string, unknown> | null;
  const expansionOffer =
    expansionRaw && expansionRaw.nextSize !== undefined
      ? {
          nextSize: Number(expansionRaw.nextSize ?? expansionRaw.NextSize ?? 0),
          price: Number(expansionRaw.price ?? expansionRaw.Price ?? 0),
        }
      : expansionRaw && expansionRaw.NextSize !== undefined
        ? {
            nextSize: Number(expansionRaw.NextSize),
            price: Number(expansionRaw.Price ?? 0),
          }
        : null;

  const nextBarnRaw = (raw.nextBarnUpgrade ?? raw.NextBarnUpgrade) as Record<string, unknown> | null;
  const nextBarnUpgrade =
    nextBarnRaw && nextBarnRaw.bonusSlots !== undefined
      ? {
          nextTier: Number(nextBarnRaw.nextTier ?? nextBarnRaw.NextTier ?? 0),
          bonusSlots: Number(nextBarnRaw.bonusSlots ?? nextBarnRaw.BonusSlots ?? 0),
          goldCost: Number(nextBarnRaw.goldCost ?? nextBarnRaw.GoldCost ?? 0),
          totalBarnBonus: Number(
            nextBarnRaw.totalBarnBonus ?? nextBarnRaw.TotalBarnBonus ?? 0,
          ),
        }
      : nextBarnRaw && nextBarnRaw.BonusSlots !== undefined
        ? {
            nextTier: Number(nextBarnRaw.NextTier ?? 0),
            bonusSlots: Number(nextBarnRaw.BonusSlots ?? 0),
            goldCost: Number(nextBarnRaw.GoldCost ?? 0),
            totalBarnBonus: Number(nextBarnRaw.TotalBarnBonus ?? 0),
          }
        : null;

  const barnTier = Number(raw.barnUpgradeTier ?? raw.BarnUpgradeTier ?? 0);
  const level = Number(raw.level ?? raw.Level ?? 1);
  const timingRaw = (raw.gameTiming ?? raw.GameTiming) as Record<string, unknown> | undefined;
  const gameTiming = timingRaw
    ? {
        globalTimePercent: Number(timingRaw.globalTimePercent ?? timingRaw.GlobalTimePercent ?? 100),
        effectiveTimePercent: Number(
          timingRaw.effectiveTimePercent ?? timingRaw.EffectiveTimePercent ?? 100,
        ),
        activeEventName: (timingRaw.activeEventName ?? timingRaw.ActiveEventName ?? null) as
          | string
          | null,
        activeEventMessage: (timingRaw.activeEventMessage ?? timingRaw.ActiveEventMessage ?? null) as
          | string
          | null,
      }
    : undefined;

  return {
    ...base,
    tiles: tilesRaw.filter((t) => t != null).map(normalizeTile),
    serverTimeUtc: String(raw.serverTimeUtc ?? raw.ServerTimeUtc ?? ''),
    gridSize: Number(raw.gridSize ?? raw.GridSize ?? 9),
    gold: Number(raw.gold ?? raw.Gold ?? 0),
    dinars: Number(raw.dinars ?? raw.Dinars ?? 0),
    xp: Number(raw.xp ?? raw.Xp ?? raw.XP ?? 0),
    level,
    barnUpgradeTier: barnTier,
    barnPlacedOnFarm: Boolean(raw.barnPlacedOnFarm ?? raw.BarnPlacedOnFarm ?? false),
    nextBarnUpgrade,
    storageCapacity: Number(raw.storageCapacity ?? raw.StorageCapacity ?? 0),
    storageUsed: Number(
      raw.storageUsed ??
        raw.StorageUsed ??
        ((raw.resources ?? raw.Resources ?? []) as { quantity?: number }[]).reduce(
          (n, r) => n + Number(r.quantity ?? 0),
          0,
        ),
    ),
    decorationCatalog: (raw.decorationCatalog ?? raw.DecorationCatalog ?? []) as FarmSnapshot['decorationCatalog'],
    decorations: (raw.decorations ?? raw.Decorations ?? []) as FarmSnapshot['decorations'],
    resourceCatalog: normalizeResourceCatalog(raw.resourceCatalog ?? raw.ResourceCatalog),
    gameConfig: normalizeGameConfig(raw.gameConfig ?? raw.GameConfig),
    clientPresentation: normalizeClientPresentation(
      raw.clientPresentation ?? raw.ClientPresentation,
    ),
    expansionOffer,
    gameTiming,
  };
}

function normalizeClientPresentation(raw: unknown): FarmSnapshot['clientPresentation'] {
  const r = raw as Record<string, unknown> | undefined;
  if (!r) {
    return undefined;
  }
  return {
    showBetaBadge: Boolean(r.showBetaBadge ?? r.ShowBetaBadge ?? false),
    betaBadgeLabelEn: String(r.betaBadgeLabelEn ?? r.BetaBadgeLabelEn ?? 'Beta'),
    betaBadgeLabelAr: String(r.betaBadgeLabelAr ?? r.BetaBadgeLabelAr ?? 'نسخة تجريبية'),
  };
}

function normalizeGameConfig(raw: unknown): FarmSnapshot['gameConfig'] {
  const r = raw as Record<string, unknown> | undefined;
  if (!r) {
    return undefined;
  }
  return {
    maxBankedAnimalCycles: Number(
      r.maxBankedAnimalCycles ?? r.MaxBankedAnimalCycles ?? 30,
    ),
    barnFactoryTypeId: Number(r.barnFactoryTypeId ?? r.BarnFactoryTypeId ?? 2),
    baseStorageCapacity: Number(r.baseStorageCapacity ?? r.BaseStorageCapacity ?? 50),
    storagePerLevel: Number(r.storagePerLevel ?? r.StoragePerLevel ?? 10),
    defaultGridSize: Number(r.defaultGridSize ?? r.DefaultGridSize ?? 9),
  };
}

function normalizeResourceCatalog(raw: unknown): FarmSnapshot['resourceCatalog'] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      code: String(r.code ?? r.Code ?? '').trim().toLowerCase(),
      sellValue: Number(r.sellValue ?? r.SellValue ?? 0),
      category: String(r.category ?? r.Category ?? ''),
      displayNameEn: String(r.displayNameEn ?? r.DisplayNameEn ?? ''),
      displayNameAr: String(r.displayNameAr ?? r.DisplayNameAr ?? ''),
    };
  });
}

const jsonHeaders = { 'Content-Type': 'application/json' } as const;

const TOKEN_KEY = 'happierFarmJwt';
const USER_ID_KEY = 'happierFarmUserId';
const DISPLAY_NAME_KEY = 'happierFarmDisplayName';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

export function getDisplayName(): string | null {
  return localStorage.getItem(DISPLAY_NAME_KEY);
}

export function setSession(auth: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, auth.accessToken);
  localStorage.setItem(USER_ID_KEY, auth.userId);
  localStorage.setItem(DISPLAY_NAME_KEY, auth.displayName);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(DISPLAY_NAME_KEY);
}

function authHeaders(): Record<string, string> {
  const t = getAccessToken();
  const headers: Record<string, string> = { ...jsonHeaders };
  if (t) {
    headers.Authorization = `Bearer ${t}`;
  }
  return headers;
}

function requireToken(): string {
  const t = getAccessToken();
  if (!t) {
    throw new Error('Sign in or register first.');
  }
  return t;
}

export async function register(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResponse> {
  const res = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { ...jsonHeaders },
    body: JSON.stringify({ email, password, displayName: displayName.trim() }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    const msg =
      body && 'error' in body && typeof body.error === 'string'
        ? body.error
        : formatErrors(body);
    throw new Error(msg ?? `Register failed (${res.status})`);
  }

  return (await res.json()) as AuthResponse;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { ...jsonHeaders },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(
      (body && 'error' in body && typeof body.error === 'string' && body.error) ||
        `Login failed (${res.status})`,
    );
  }

  return (await res.json()) as AuthResponse;
}

export async function getProfile(): Promise<PlayerProfile> {
  const res = await fetch(apiUrl('/api/auth/me'), { headers: authHeaders() });

  if (res.status === 401) {
    clearSession();
    throw new Error('Session expired — please sign in again.');
  }

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Profile load failed (${res.status})`);
  }

  return (await res.json()) as PlayerProfile;
}

export async function getFarm(): Promise<FarmSnapshot> {
  const res = await fetch(apiUrl('/api/farm'), {
    headers: authHeaders(),
    cache: 'no-store',
  });

  if (res.status === 401) {
    clearSession();
    throw new Error('Session expired — please sign in again.');
  }

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Load farm failed (${res.status})`);
  }

  const raw = (await res.json()) as Record<string, unknown>;
  return normalizeFarmSnapshot(raw);
}

export async function buySeeds(cropTypeId: number, quantity: number): Promise<void> {
  requireToken();
  const res = await fetch(apiUrl('/api/shop/buy-seeds'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ cropTypeId, quantity }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Buy seeds failed (${res.status})`);
  }
}

export async function plantCrop(x: number, y: number, cropTypeId: number): Promise<void> {
  requireToken();
  const res = await fetch(apiUrl('/api/farm/plant'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ x, y, cropTypeId }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Plant failed (${res.status})`);
  }
}

export async function harvestCrop(x: number, y: number): Promise<void> {
  requireToken();
  const res = await fetch(apiUrl('/api/farm/harvest'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ x, y }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Harvest failed (${res.status})`);
  }
}

export async function plantBatch(
  cropTypeId: number,
  tiles: { x: number; y: number }[],
): Promise<BatchActionResult> {
  requireToken();
  const res = await fetch(apiUrl('/api/farm/plant-batch'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ cropTypeId, tiles }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Plant batch failed (${res.status})`);
  }

  return (await res.json()) as BatchActionResult;
}

export async function harvestBatch(tiles: { x: number; y: number }[]): Promise<BatchActionResult> {
  requireToken();
  const res = await fetch(apiUrl('/api/farm/harvest-batch'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ tiles }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Harvest batch failed (${res.status})`);
  }

  return (await res.json()) as BatchActionResult;
}

export async function buyAnimal(animalTypeId: number, quantity: number): Promise<void> {
  requireToken();
  const res = await fetch(apiUrl('/api/shop/buy-animal'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ animalTypeId, quantity }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Buy animal failed (${res.status})`);
  }
}

export async function buyFactory(factoryTypeId: number, quantity: number): Promise<void> {
  requireToken();
  const res = await fetch(apiUrl('/api/shop/buy-factory'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ factoryTypeId, quantity }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Buy factory failed (${res.status})`);
  }
}

export async function buyDecoration(decorationTypeId: number, quantity: number): Promise<void> {
  requireToken();
  const res = await fetch(apiUrl('/api/shop/buy-decoration'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ decorationTypeId, quantity }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Buy decoration failed (${res.status})`);
  }
}

export async function buyFarmExpansion(): Promise<void> {
  requireToken();
  const res = await fetch(apiUrl('/api/shop/buy-expansion'), {
    method: 'POST',
    headers: authHeaders(),
    body: '{}',
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Expansion failed (${res.status})`);
  }
}

export async function upgradeBarn(): Promise<number> {
  requireToken();
  const res = await fetch(apiUrl('/api/barn/upgrade'), {
    method: 'POST',
    headers: authHeaders(),
    body: '{}',
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Barn upgrade failed (${res.status})`);
  }

  const data = (await res.json()) as { storageCapacity: number };
  return data.storageCapacity;
}

export async function collectAnimals(): Promise<number> {
  requireToken();
  const res = await fetch(apiUrl('/api/barn/collect-animals'), {
    method: 'POST',
    headers: authHeaders(),
    body: '{}',
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Collect failed (${res.status})`);
  }

  const data = (await res.json()) as { produced: number };
  return data.produced;
}

export async function feedAnimalAt(
  animalTypeId: number,
  x: number,
  y: number,
): Promise<void> {
  requireToken();
  const res = await fetch(apiUrl('/api/barn/feed-animal'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ animalTypeId, x, y }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Feed failed (${res.status})`);
  }
}

export async function collectAnimalAt(
  animalTypeId: number,
  x: number,
  y: number,
): Promise<number> {
  requireToken();
  const res = await fetch(apiUrl('/api/barn/collect-animal'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ animalTypeId, x, y }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Collect failed (${res.status})`);
  }

  const data = (await res.json()) as { produced: number };
  return data.produced;
}

export async function placeItem(
  kind: string,
  typeId: number,
  x: number,
  y: number,
): Promise<void> {
  requireToken();
  const res = await fetch(apiUrl('/api/farm/place'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ kind, typeId, x, y }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Place failed (${res.status})`);
  }
}

export async function pickupItem(x: number, y: number): Promise<void> {
  requireToken();
  const res = await fetch(apiUrl('/api/farm/pickup'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ x, y }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Pickup failed (${res.status})`);
  }
}

export async function processFactory(
  factoryTypeId: number,
  x: number,
  y: number,
  batchRuns = 1,
): Promise<number> {
  requireToken();
  const res = await fetch(apiUrl('/api/barn/process-factory'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ factoryTypeId, x, y, batchRuns }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Process failed (${res.status})`);
  }

  const data = (await res.json()) as { produced: number };
  return data.produced;
}

export async function collectFactories(): Promise<number> {
  requireToken();
  const res = await fetch(apiUrl('/api/barn/collect-factories'), {
    method: 'POST',
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Collect factories failed (${res.status})`);
  }

  const data = (await res.json()) as { produced: number };
  return data.produced;
}

export async function sellResource(resourceCode: string, quantity: number): Promise<number> {
  requireToken();
  const res = await fetch(apiUrl('/api/barn/sell-resource'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ resourceCode, quantity }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error ?? `Sell failed (${res.status})`);
  }

  const data = (await res.json()) as { goldEarned: number };
  return data.goldEarned;
}

async function safeJson(res: Response): Promise<{ error?: string; errors?: string[] } | null> {
  try {
    return (await res.json()) as { error?: string; errors?: string[] };
  } catch {
    return null;
  }
}

function formatErrors(body: { errors?: string[] } | null): string | undefined {
  if (!body?.errors?.length) {
    return undefined;
  }
  return body.errors.join(' ');
}
