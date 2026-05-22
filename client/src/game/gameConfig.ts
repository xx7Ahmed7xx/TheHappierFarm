import type { FarmSnapshot, GameConfigState } from '../types';

export const DEFAULT_GAME_CONFIG: GameConfigState = {
  maxBankedAnimalCycles: 30,
  barnFactoryTypeId: 2,
  baseStorageCapacity: 50,
  storagePerLevel: 10,
  defaultGridSize: 9,
};

export function gameConfigFromSnapshot(snap: FarmSnapshot): GameConfigState {
  return snap.gameConfig ?? DEFAULT_GAME_CONFIG;
}

export function maxBankedAnimalCycles(snap: FarmSnapshot): number {
  return gameConfigFromSnapshot(snap).maxBankedAnimalCycles;
}

export function barnFactoryTypeId(snap: FarmSnapshot): number {
  return gameConfigFromSnapshot(snap).barnFactoryTypeId;
}
