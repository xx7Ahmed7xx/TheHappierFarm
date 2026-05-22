export interface ResourceCatalogDto {
  code: string;
  sellValue: number;
  category: string;
  displayNameEn: string;
  displayNameAr: string;
}

export interface GameConfigState {
  maxBankedAnimalCycles: number;
  barnFactoryTypeId: number;
  baseStorageCapacity: number;
  storagePerLevel: number;
  defaultGridSize: number;
}

export interface ClientPresentationState {
  showBetaBadge: boolean;
  betaBadgeLabelEn: string;
  betaBadgeLabelAr: string;
}

export interface CropCatalogDto {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  buyPrice: number;
  sellValue: number;
  growthDurationSeconds: number;
  xpReward: number;
  minLevelRequired: number;
  harvestResourceCode: string;
  baseYield: number;
}

export interface AnimalCatalogDto {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  buyPrice: number;
  productionIntervalSeconds: number;
  feedResourceCode: string;
  feedQuantity: number;
  productCode: string;
  productQuantity: number;
  productSellValue: number;
  maxOwned: number;
  maxPlaced: number;
  footprintWidth: number;
  footprintHeight: number;
  minLevelRequired: number;
}

export interface FactoryCatalogDto {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  buyPrice: number;
  inputResourceCode: string;
  inputQuantity: number;
  outputResourceCode: string;
  outputQuantity: number;
  processSeconds: number;
  sellValue: number;
  maxOwned: number;
  maxPlaced: number;
  footprintWidth: number;
  footprintHeight: number;
  minLevelRequired: number;
  isBarn: boolean;
}

export interface BarnUpgradeOfferDto {
  nextTier: number;
  bonusSlots: number;
  goldCost: number;
  totalBarnBonus: number;
}

export const BARN_FACTORY_TYPE_ID = 2;

export interface DecorationCatalogDto {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  buyPrice: number;
  footprintWidth: number;
  footprintHeight: number;
  maxOwned: number;
  maxPlaced: number;
  minLevelRequired: number;
}

export interface SeedStockDto {
  cropTypeId: number;
  cropName: string;
  quantity: number;
}

export interface PlayerAnimalDto {
  animalTypeId: number;
  name: string;
  stashQuantity: number;
  placedCount: number;
  productionIntervalSeconds: number;
}

export interface PlayerFactoryDto {
  factoryTypeId: number;
  name: string;
  stashQuantity: number;
  placedCount: number;
  processSeconds: number;
}

export interface PlayerDecorationDto {
  decorationTypeId: number;
  name: string;
  stashQuantity: number;
  placedCount: number;
}

export interface FarmExpansionOfferDto {
  nextSize: number;
  price: number;
}

export interface ResourceStockDto {
  resourceCode: string;
  quantity: number;
}

export interface FarmTileDto {
  x: number;
  y: number;
  phase: string;
  cropTypeId: number | null;
  cropName: string | null;
  plantedAtUtc: string | null;
  growthDurationSeconds: number | null;
  progress01: number | null;
  secondsRemaining: number | null;
  placementKind: string | null;
  placementTypeId: number | null;
  placementName: string | null;
  placementLastActionUtc: string | null;
  placementCooldownSeconds: number | null;
  /** 0 = ready to collect/process. */
  placementSecondsRemaining: number | null;
  /** Factory: output multiplier for the current run (when started). */
  placementBatchRuns: number | null;
  placementAnchorX: number | null;
  placementAnchorY: number | null;
  placementFootprintW: number | null;
  placementFootprintH: number | null;
  placementIsAnchor: boolean;
}

export interface GameTimingState {
  globalTimePercent: number;
  effectiveTimePercent: number;
  activeEventName: string | null;
  activeEventMessage: string | null;
}

export interface FarmSnapshot {
  serverTimeUtc: string;
  gridSize: number;
  displayName: string;
  email: string;
  gold: number;
  /** Premium currency (دنانير / Dinars). */
  dinars: number;
  xp: number;
  level: number;
  storageCapacity: number;
  storageUsed: number;
  barnUpgradeTier: number;
  barnPlacedOnFarm: boolean;
  nextBarnUpgrade: BarnUpgradeOfferDto | null;
  tiles: FarmTileDto[];
  seedStocks: SeedStockDto[];
  cropCatalog: CropCatalogDto[];
  animalCatalog: AnimalCatalogDto[];
  factoryCatalog: FactoryCatalogDto[];
  decorationCatalog: DecorationCatalogDto[];
  animals: PlayerAnimalDto[];
  factories: PlayerFactoryDto[];
  decorations: PlayerDecorationDto[];
  resources: ResourceStockDto[];
  resourceCatalog: ResourceCatalogDto[];
  expansionOffer: FarmExpansionOfferDto | null;
  gameTiming?: GameTimingState;
  gameConfig?: GameConfigState;
  clientPresentation?: ClientPresentationState;
}

export interface BatchActionResult {
  successCount: number;
  skippedCount: number;
}

export interface AuthResponse {
  userId: string;
  email: string;
  displayName: string;
  goldCoins: number;
  level: number;
  accessToken: string;
  accessTokenExpiresAtUtc: string;
}

export interface PlayerProfile {
  userId: string;
  email: string;
  displayName: string;
  goldCoins: number;
  level: number;
}

export type PlacementKind = 'animal' | 'factory' | 'decoration';

export interface BuildItemSelection {
  kind: PlacementKind;
  typeId: number;
}
