import { formatDuration, initI18n, onLocaleChange, t } from './i18n';
import {
  bindHudLogElement,
  setHudLog,
  setHudLogParamResolver,
  setHudLogRaw,
} from './i18n/hudLog';
import { bindDomLocale, setLangSwitcherPlacement } from './i18n/dom';
import { validateAuthInputs } from './i18n/formValidation';
import {
  catalogAnimalName,
  catalogCropName,
  catalogDecorationName,
  catalogFactoryName,
  catalogResourceName,
} from './i18n/catalogNames';
import { animalEmoji, factoryEmoji } from './game/catalogVisuals';
import Phaser from 'phaser';
import { HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr';
import {
  FarmScene,
  FARM_CANVAS_HEIGHT,
  FARM_CANVAS_WIDTH,
  PENDING_FARM_SNAPSHOT_KEY,
  type TileCoord,
} from './game/FarmScene';
import { catalogFootprint, findPlaceAnchorInSelection } from './game/farmFootprint';
import { findPlacedTilesInSelection, tilePlacement } from './game/tileSelection';
import { PreloadScene } from './game/PreloadScene';
import * as Network from './network';
import type { BuildItemSelection, FarmSnapshot, FarmTileDto } from './types';
import {
  playBuy,
  playCollect,
  playError,
  playHarvest,
  playPlant,
  setBgmForScreen,
  unlockAudio,
} from './audio';
import {
  applyFarmSnapshot,
  optimisticHarvest,
  optimisticPickup,
  optimisticPlace,
  optimisticPlant,
} from './farmSnapshotApply';
import { isCropRipe } from './growth';
import {
  equipCrop,
  getActiveTool,
  getSelectedBuildItem,
  getSelectedCropId,
  initGameHud,
  updateGameHudFromSnapshot,
} from './ui/gameHud';
import {
  barnCollectableSlots,
  barnHasSpace,
  barnSpaceError,
  storageTotals,
} from './game/barnStorage';
import {
  estimateBankedAnimalCycles,
  estimateReadyAnimalSlots,
  estimateReadyFactorySlots,
} from './game/collectEstimates';
import { gameConfigFromSnapshot, maxBankedAnimalCycles } from './game/gameConfig';
import { factoryPlacementState } from './game/placementLabels';
import { formatQtyResource, formatRecipeLine, resourceLabelFromSnap } from './game/recipeFormat';
import { applyBetaBadge, hideBetaBadge } from './ui/betaBadge';
import {
  isFarmModalOpen,
  showFarmAlert,
  showFarmBatchPick,
  showFarmConfirm,
} from './ui/confirmModal';
import { registerFarmInputHooks } from './ui/farmInputLock';
import { hideBootScreen, runBootSequence, showBootScreen, type BootStep } from './ui/bootLoader';
import { hubGameUrl, loadRuntimeConfig } from './runtimeConfig';
import { initMobileMenu } from './ui/mobileMenu';

function resourceLabel(code: string, snap?: FarmSnapshot): string {
  if (snap) {
    return resourceLabelFromSnap(snap, code);
  }
  return catalogResourceName(code);
}

function placeMinLevel(snap: FarmSnapshot, build: BuildItemSelection): number {
  if (build.kind === 'animal') {
    return snap.animalCatalog.find((a) => a.id === build.typeId)?.minLevelRequired ?? 1;
  }
  if (build.kind === 'factory') {
    return snap.factoryCatalog.find((f) => f.id === build.typeId)?.minLevelRequired ?? 1;
  }
  return snap.decorationCatalog.find((d) => d.id === build.typeId)?.minLevelRequired ?? 1;
}

function placeDisplayName(snap: FarmSnapshot, build: BuildItemSelection): string {
  if (build.kind === 'animal') {
    const a = snap.animalCatalog.find((x) => x.id === build.typeId);
    return a ? catalogAnimalName(a.id, a.name, a) : t('hand.animal');
  }
  if (build.kind === 'factory') {
    const f = snap.factoryCatalog.find((x) => x.id === build.typeId);
    return f ? catalogFactoryName(f.id, f.name, f) : t('hand.building');
  }
  const d = snap.decorationCatalog.find((x) => x.id === build.typeId);
  return d ? catalogDecorationName(d.id, d.name, d) : t('hand.decor');
}

function blockIfLevelTooLow(snap: FarmSnapshot, minLevel: number, itemName: string): boolean {
  if (snap.level >= minLevel) {
    return false;
  }
  playError();
  setHudLog('log.levelRequired', {
    level: minLevel,
    current: snap.level,
    name: itemName,
  });
  return true;
}

function barnStorageLine(snap: FarmSnapshot): string {
  const used =
    snap.storageUsed ?? snap.resources.reduce((n, r) => n + r.quantity, 0);
  const capacity =
    snap.storageCapacity;
  const full = used >= capacity;
  return `${used}/${capacity}${full ? ` ${t('game.barnFullParen')}` : ''}`;
}

/** Dev: bust aggressive browser cache on static brand PNG (edit source → run npm run brand:sync). */
function bustBrandLogoCache(): void {
  if (!import.meta.env.DEV) {
    return;
  }
  const stamp = Date.now();
  document.querySelectorAll<HTMLImageElement>('img.boot-logo, img.auth-logo-img').forEach((img) => {
    const base = img.getAttribute('src')?.split('?')[0];
    if (base?.includes('happier-farm-logo')) {
      img.src = `${base}?v=${stamp}`;
    }
  });
  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (icon?.href.includes('happier-farm-logo')) {
    const base = icon.href.split('?')[0];
    icon.href = `${base}?v=${stamp}`;
  }
}

initI18n();
bindDomLocale();
bustBrandLogoCache();

const pageLogin = document.querySelector<HTMLDivElement>('#page-login')!;
const pageRegister = document.querySelector<HTMLDivElement>('#page-register')!;
const appEl = document.querySelector<HTMLDivElement>('#app')!;

const loginEmail = document.querySelector<HTMLInputElement>('#login-email')!;
const loginPassword = document.querySelector<HTMLInputElement>('#login-password')!;
const loginLog = document.querySelector<HTMLParagraphElement>('#login-log')!;

const registerEmail = document.querySelector<HTMLInputElement>('#register-email')!;
const registerPassword = document.querySelector<HTMLInputElement>('#register-password')!;
const registerDisplayName = document.querySelector<HTMLInputElement>('#register-display-name')!;
const registerLog = document.querySelector<HTMLParagraphElement>('#register-log')!;

const hudFarmerName = document.querySelector<HTMLHeadingElement>('#hud-farmer-name')!;
const hudStatus = document.querySelector<HTMLParagraphElement>('#hud-status')!;
const hudGold = document.querySelector<HTMLSpanElement>('#hud-gold')!;
const hudDinars = document.querySelector<HTMLSpanElement>('#hud-dinars')!;
const hudXp = document.querySelector<HTMLSpanElement>('#hud-xp')!;
const hudLevel = document.querySelector<HTMLSpanElement>('#hud-level')!;
const logLine = document.querySelector<HTMLParagraphElement>('#hud-log')!;

bindHudLogElement(logLine);
setHudLogParamResolver((path, params) => {
  const p = { ...params };
  if (typeof p.labelKey === 'string') {
    p.code = t(p.labelKey);
    delete p.labelKey;
  }
  if (typeof p.resource === 'string') {
    const label = resourceLabel(p.resource);
    if (path === 'game.collected') {
      p.code = label;
    } else if (path === 'game.factoryStarted') {
      p.product = label;
    }
    delete p.resource;
  }
  return p;
});
onLocaleChange(() => {
  getFarmScene()?.refreshLocaleLabels();
});

let farmScene: FarmScene | null = null;
let phaserGame: Phaser.Game | null = null;
let dragActionPending = false;
let farmRefreshChain: Promise<void> = Promise.resolve();
let hubRefreshTimer: ReturnType<typeof setTimeout> | null = null;
let lastKnownLevel: number | null = null;

function loginMessage(message: string): void {
  loginLog.textContent = message;
}

function registerMessage(message: string): void {
  registerLog.textContent = message;
}

/** Server / unknown errors — not re-translated on locale change. */
function log(message: string): void {
  setHudLogRaw(message);
}

function syncFarmCursor(): void {
  if (!phaserGame) {
    return;
  }
  const tool = getActiveTool();
  const cropId = getSelectedCropId();
  phaserGame.registry.set('farmDragTool', tool);
  phaserGame.registry.set(
    'farmCursor',
    tool === 'pan'
      ? 'pan'
      : tool === 'harvest'
        ? 'harvest'
        : tool === 'place'
          ? 'place'
          : tool === 'pickup'
            ? 'pickup'
            : cropId !== null
              ? 'plant'
              : 'default',
  );
  farmScene?.refreshCursors();
}

function buildHubConnection() {
  return new HubConnectionBuilder()
    .withUrl(hubGameUrl(), {
      accessTokenFactory: () => Network.getAccessToken() ?? '',
      transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}

let hub: ReturnType<typeof buildHubConnection> | null = null;

function initHub(): void {
  hub = buildHubConnection();
  wireHubHandlers(hub);
}

function wireHubHandlers(connection: ReturnType<typeof buildHubConnection>): void {
  connection.on('farmStateChanged', () => {
    if (dragActionPending) {
      return;
    }
    if (hubRefreshTimer !== null) {
      clearTimeout(hubRefreshTimer);
    }
    hubRefreshTimer = setTimeout(() => {
      hubRefreshTimer = null;
      void refreshFarm().catch((err: unknown) => {
        log(err instanceof Error ? err.message : String(err));
      });
    }, 200);
  });
}

function bindAudioUnlock(): void {
  const unlock = () => unlockAudio();
  document.addEventListener('pointerdown', unlock, { capture: true });
  document.addEventListener('keydown', unlock, { capture: true });
}

bindAudioUnlock();

document.querySelector<HTMLButtonElement>('#btn-zoom-in')?.addEventListener('click', () => {
  getFarmScene()?.adjustZoom(0.1);
});
document.querySelector<HTMLButtonElement>('#btn-zoom-out')?.addEventListener('click', () => {
  getFarmScene()?.adjustZoom(-0.1);
});

registerFarmInputHooks({
  suspend: () => {
    phaserGame?.registry.set('farmInputSuspended', true);
    getFarmScene()?.cancelInteraction();
    if (phaserGame) {
      phaserGame.input.enabled = false;
    }
  },
  resume: () => {
    phaserGame?.registry.set('farmInputSuspended', false);
    if (phaserGame) {
      phaserGame.input.enabled = true;
    }
  },
});

initGameHud({
  onEquipCrop: (cropTypeId) => {
    const snap = getRegistrySnapshot();
    const crop = snap?.cropCatalog.find((c) => c.id === cropTypeId);
    if (
      snap &&
      crop &&
      blockIfLevelTooLow(
        snap,
        crop.minLevelRequired ?? 1,
        catalogCropName(crop.id, crop.name, crop),
      )
    ) {
      return;
    }
    equipCrop(cropTypeId);
    setHudLog(
      crop ? 'log.equippedCrop' : 'log.equippedCropFallback',
      crop ? { name: catalogCropName(crop.id, crop.name, crop), price: crop.buyPrice } : undefined,
    );
  },
  onBuyAnimal: (animalTypeId) => {
    void buyAnimal(animalTypeId);
  },
  onBuyFactory: (factoryTypeId) => {
    void buyFactory(factoryTypeId);
  },
  onBuyDecoration: (decorationTypeId) => {
    void buyDecoration(decorationTypeId);
  },
  onBuyExpansion: () => {
    void buyExpansion();
  },
  onCollectAnimals: () => {
    void collectAnimals();
  },
  onCollectFactories: () => {
    void collectFactories();
  },
  onUpgradeBarn: () => {
    void upgradeBarnFromHud();
  },
  onSellResource: (code, qty) => {
    void sellResource(code, qty);
  },
  onRefresh: () => {
    void refreshFarm().then(() => setHudLog('log.farmSynced'));
  },
  onToolChange: () => syncFarmCursor(),
  onSeedSelected: () => syncFarmCursor(),
  onBuildSelected: () => syncFarmCursor(),
});

function showLoginPage(): void {
  pageLogin.hidden = false;
  pageRegister.hidden = true;
  appEl.hidden = true;
  appEl.classList.remove('app--booting');
  hideBetaBadge();
  setLangSwitcherPlacement('overlay');
  setBgmForScreen('menu');
}

function showRegisterPage(): void {
  pageLogin.hidden = true;
  pageRegister.hidden = false;
  appEl.hidden = true;
  appEl.classList.remove('app--booting');
  hideBetaBadge();
  setLangSwitcherPlacement('overlay');
  setBgmForScreen('menu');
}

function showApp(): void {
  pageLogin.hidden = true;
  pageRegister.hidden = true;
  appEl.hidden = false;
  appEl.classList.remove('app--booting');
  setLangSwitcherPlacement('hud');
  setBgmForScreen('farm');
}

function destroyPhaser(): void {
  if (phaserGame) {
    phaserGame.destroy(true);
    phaserGame = null;
    farmScene = null;
  }
}

const FARM_SCENE_KEY = 'FarmScene';
const BOOT_ENGINE_TIMEOUT_MS = 90_000;

function applyPendingSnapshotToFarm(game: Phaser.Game): void {
  const scene = game.scene.getScene(FARM_SCENE_KEY) as FarmScene | undefined;
  if (!scene?.scene.isActive()) {
    return;
  }
  farmScene = scene;
  syncFarmCursor();
  const pending = game.registry.get(PENDING_FARM_SNAPSHOT_KEY) as FarmSnapshot | undefined;
  if (pending) {
    farmScene.applySnapshot(pending);
  }
}

function whenFarmSceneActive(game: Phaser.Game): Promise<Phaser.Game> {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    const tick = (): void => {
      const scene = game.scene.getScene(FARM_SCENE_KEY);
      if (scene?.scene.isActive()) {
        applyPendingSnapshotToFarm(game);
        resolve(game);
        return;
      }
      if (Date.now() - started > BOOT_ENGINE_TIMEOUT_MS) {
        reject(new Error(t('boot.engineTimeout')));
        return;
      }
      requestAnimationFrame(tick);
    };

    tick();
  });
}

function createPhaserGame(): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-container',
    width: FARM_CANVAS_WIDTH,
    height: FARM_CANVAS_HEIGHT,
    backgroundColor: '#4a8f3c',
    antialias: true,
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
    audio: {
      noAudio: true,
    },
    scene: [PreloadScene, FarmScene],
    callbacks: {
      preBoot: (g) => {
        g.registry.set('onTilesDrag', handleTilesDrag);
        g.registry.set('farmCursor', 'default');
      },
    },
  });
}

function ensurePhaserReady(): Promise<Phaser.Game> {
  if (phaserGame) {
    const existing = phaserGame.scene.getScene(FARM_SCENE_KEY);
    if (existing?.scene.isActive()) {
      applyPendingSnapshotToFarm(phaserGame);
      return Promise.resolve(phaserGame);
    }
    return whenFarmSceneActive(phaserGame);
  }

  const game = createPhaserGame();
  phaserGame = game;
  return whenFarmSceneActive(game);
}

function setFarmerHud(displayName: string, email: string): void {
  hudFarmerName.textContent = displayName;
  hudStatus.textContent = email;
}

async function startLive(): Promise<void> {
  const userId = Network.getUserId();
  const token = Network.getAccessToken();
  if (!userId || !token) {
    return;
  }

  if (hub?.state === 'Connected') {
    try {
      await hub.invoke('LeaveFarm', userId);
    } catch {
      /* ignore */
    }
    await hub.stop();
  }

  initHub();
  await hub!.start();
  await hub!.invoke('JoinFarm', userId);
}

function renderMeta(snap: FarmSnapshot): void {
  if (lastKnownLevel !== null && snap.level > lastKnownLevel) {
    const cap = snap.storageCapacity;
    playBuy();
    setHudLog('log.levelUp', { level: snap.level, cap });
  }
  lastKnownLevel = snap.level;

  setFarmerHud(snap.displayName, snap.email);
  hudGold.textContent = String(snap.gold);
  hudDinars.textContent = String(snap.dinars ?? 0);
  hudXp.textContent = String(snap.xp);
  hudLevel.textContent = String(snap.level);
  localStorage.setItem('happierFarmDisplayName', snap.displayName);
  updateGameHudFromSnapshot(snap);
  applyBetaBadge(snap);
  syncFarmCursor();

  const timing = snap.gameTiming;
  const panHintEl = document.querySelector<HTMLElement>('#farm-pan-hint');
  if (panHintEl) {
    if (timing?.activeEventName && timing.activeEventMessage) {
      panHintEl.textContent = t('farm.eventTimingBanner', {
        name: timing.activeEventName,
        message: timing.activeEventMessage,
        percent: timing.effectiveTimePercent,
      });
    } else {
      panHintEl.textContent = t('farm.panHint');
    }
  }
}

function getRegistrySnapshot(): FarmSnapshot | undefined {
  return phaserGame?.registry.get(PENDING_FARM_SNAPSHOT_KEY) as FarmSnapshot | undefined;
}

function getFarmScene(): FarmScene | null {
  if (!phaserGame) {
    return null;
  }
  const scene = phaserGame.scene.getScene('FarmScene');
  if (!scene || scene.scene.key !== 'FarmScene') {
    return null;
  }
  return scene as FarmScene;
}

function pushFarmSnapshot(snap: FarmSnapshot): void {
  applyFarmSnapshot(snap, {
    renderMeta,
    setRegistry: (s) => phaserGame?.registry.set(PENDING_FARM_SNAPSHOT_KEY, s),
    applyScene: (s) => getFarmScene()?.applySnapshot(s),
  });
  const scene = getFarmScene();
  if (scene) {
    farmScene = scene;
    scene.applySavedZoom();
  }
}

function applyOptimistic(patch: (snap: FarmSnapshot) => FarmSnapshot): void {
  const cur = getRegistrySnapshot();
  if (!cur) {
    return;
  }
  pushFarmSnapshot(patch(cur));
}

async function refreshFarm(): Promise<void> {
  const run = async (): Promise<void> => {
    const snap = await Network.getFarm();
    pushFarmSnapshot(snap);
  };
  farmRefreshChain = farmRefreshChain.then(run, run);
  return farmRefreshChain;
}

async function handleTilesDrag(coords: TileCoord[], isComplete: boolean): Promise<void> {
  if (!Network.getAccessToken() || coords.length === 0) {
    return;
  }

  if (!isComplete) {
    return;
  }

  if (isFarmModalOpen() || dragActionPending) {
    farmScene?.cancelInteraction();
    return;
  }

  dragActionPending = true;
  unlockAudio();
  farmScene?.cancelInteraction();

  try {
    const snap = await Network.getFarm();
    const tool = getActiveTool();

    if (
      coords.length === 1 &&
      tool !== 'place' &&
      tool !== 'pickup' &&
      tool !== 'pan'
    ) {
      const first = coords[0];
      if (!first) {
        return;
      }
      const hit = snap.tiles.find((t) => t.x === first.x && t.y === first.y);
      const animalTile = resolvePlacementTile(snap, hit, 'animal');
      if (animalTile) {
        await interactWithAnimal(snap, animalTile);
        await refreshFarm();
        return;
      }
      const factoryTile = resolvePlacementTile(snap, hit, 'factory');
      if (factoryTile) {
        await interactWithFactory(snap, factoryTile);
        await refreshFarm();
        return;
      }
    }

    if (tool === 'place' || tool === 'pickup') {
      if (coords.length === 0) {
        return;
      }

      if (tool === 'place') {
        const build = getSelectedBuildItem();
        if (!build) {
          setHudLog('log.selectBuild');
          return;
        }
        const fp = catalogFootprint(snap, build);
        const target = findPlaceAnchorInSelection(snap, coords, fp);
        if (!target) {
          setHudLog('log.placeFootprintNeed', { w: fp.width, h: fp.height });
          return;
        }
        const minLevel = placeMinLevel(snap, build);
        const placeName = placeDisplayName(snap, build);
        if (blockIfLevelTooLow(snap, minLevel, placeName)) {
          return;
        }
        await Network.placeItem(build.kind, build.typeId, target.x, target.y);
        applyOptimistic((s) =>
          optimisticPlace(s, target.x, target.y, build.kind, build.typeId),
        );
        setHudLog('log.placed');
      } else {
        const targets = findPlacedTilesInSelection(snap, coords);
        if (targets.length === 0) {
          setHudLog('log.noAnimalInArea');
          return;
        }
        for (const { x, y } of targets) {
          await Network.pickupItem(x, y);
        }
        applyOptimistic((s) => optimisticPickup(s, targets));
        setHudLog(
          targets.length === 1 ? 'log.pickupOne' : 'log.pickupMany',
          targets.length === 1 ? undefined : { n: targets.length },
        );
      }

      await refreshFarm();
      return;
    }

    if (tool === 'harvest') {
      const serverMs = Date.parse(snap.serverTimeUtc);
      const nowMs = Number.isNaN(serverMs) ? Date.now() : serverMs;
      const ripe = coords.filter((c) => {
        const t = snap.tiles.find((tile) => tile.x === c.x && tile.y === c.y);
        return t ? isCropRipe(t, nowMs) : false;
      });
      if (ripe.length === 0) {
        setHudLog('log.noRipeInBox');
        return;
      }
      const result = await Network.harvestBatch(ripe);
      if (result.successCount > 0) {
        applyOptimistic((s) => optimisticHarvest(s, ripe));
      }
      playHarvest();
      setHudLog('log.harvested', { n: result.successCount });
    } else {
      const cropTypeId = getSelectedCropId();
      if (cropTypeId === null) {
        setHudLog('log.equipCropHint');
        return;
      }

      const cropDef = snap.cropCatalog.find((c) => c.id === cropTypeId);
      if (!cropDef) {
        return;
      }
      if (
        blockIfLevelTooLow(
          snap,
          cropDef.minLevelRequired ?? 1,
          catalogCropName(cropDef.id, cropDef.name, cropDef),
        )
      ) {
        return;
      }

      const empty = coords.filter((c) => {
        const t = snap.tiles.find((tile) => tile.x === c.x && tile.y === c.y);
        if (!t) {
          return false;
        }
        const { kind } = tilePlacement(t);
        return t.phase === 'Empty' && !kind && t.cropTypeId === null;
      });
      if (empty.length === 0) {
        setHudLog('log.noEmptySoil');
        return;
      }

      const plantCost = cropDef.buyPrice * empty.length;
      if (snap.gold < cropDef.buyPrice) {
        setHudLog('log.needGoldPlant', {
          price: cropDef.buyPrice,
          name: catalogCropName(cropDef.id, cropDef.name),
        });
        return;
      }
      if (snap.gold < plantCost) {
        setHudLog('log.notEnoughGoldTiles', { n: empty.length, cost: plantCost });
      }

      const result = await Network.plantBatch(cropTypeId, empty);
      if (result.successCount > 0) {
        const planted = empty.slice(0, result.successCount);
        applyOptimistic((s) => optimisticPlant(s, planted, cropTypeId));
      }
      if (result.successCount === 0) {
        if (coords.length === 1) {
          const t = snap.tiles.find((tile) => tile.x === coords[0]!.x && tile.y === coords[0]!.y);
          const { kind } = t ? tilePlacement(t) : { kind: null };
          if (t?.cropTypeId !== null) {
            setHudLog('log.tileHasCrop');
          } else if (kind) {
            setHudLog('log.removeBuildingFirst');
          } else {
            setHudLog('log.plantFailed');
          }
        } else {
          setHudLog('log.noBareSoil');
        }
        return;
      }
      playPlant();
      const where = empty
        .slice(0, result.successCount)
        .map((c) => `(${c.x},${c.y})`)
        .join(', ');
      const spent = cropDef.buyPrice * result.successCount;
      setHudLog('log.planted', { n: result.successCount, where, spent });
    }

    await refreshFarm();
  } catch (err: unknown) {
    playError();
    log(err instanceof Error ? err.message : String(err));
  } finally {
    dragActionPending = false;
  }
}

async function buyAnimal(animalTypeId: number): Promise<void> {
  try {
    const snap = await Network.getFarm();
    const def = snap.animalCatalog.find((a) => a.id === animalTypeId);
    if (
      def &&
      blockIfLevelTooLow(
        snap,
        def.minLevelRequired ?? 1,
        catalogAnimalName(def.id, def.name, def),
      )
    ) {
      return;
    }
    unlockAudio();
    await Network.buyAnimal(animalTypeId, 1);
    playBuy();
    setHudLog('log.animalStash');
    await refreshFarm();
  } catch (err: unknown) {
    playError();
    log(err instanceof Error ? err.message : String(err));
  }
}

async function buyDecoration(decorationTypeId: number): Promise<void> {
  try {
    const snap = await Network.getFarm();
    const def = snap.decorationCatalog.find((d) => d.id === decorationTypeId);
    if (
      def &&
      blockIfLevelTooLow(
        snap,
        def.minLevelRequired ?? 1,
        catalogDecorationName(def.id, def.name, def),
      )
    ) {
      return;
    }
    unlockAudio();
    await Network.buyDecoration(decorationTypeId, 1);
    playBuy();
    setHudLog('log.decorStash');
    await refreshFarm();
  } catch (err: unknown) {
    playError();
    log(err instanceof Error ? err.message : String(err));
  }
}

async function buyExpansion(): Promise<void> {
  try {
    unlockAudio();
    await Network.buyFarmExpansion();
    playBuy();
    setHudLog('log.expanded');
    await refreshFarm();
  } catch (err: unknown) {
    playError();
    log(err instanceof Error ? err.message : String(err));
  }
}

async function buyFactory(factoryTypeId: number): Promise<void> {
  try {
    const snap = await Network.getFarm();
    const def = snap.factoryCatalog.find((f) => f.id === factoryTypeId);
    if (
      def &&
      blockIfLevelTooLow(
        snap,
        def.minLevelRequired ?? 1,
        catalogFactoryName(def.id, def.name, def),
      )
    ) {
      return;
    }
    unlockAudio();
    await Network.buyFactory(factoryTypeId, 1);
    playBuy();
    setHudLog('log.buildingStash');
    await refreshFarm();
  } catch (err: unknown) {
    playError();
    log(err instanceof Error ? err.message : String(err));
  }
}

async function collectAnimals(): Promise<void> {
  const snap = getRegistrySnapshot();
  if (!snap) {
    return;
  }

  const slots = estimateReadyAnimalSlots(snap);
  if (slots < 1) {
    setHudLog('game.animalProducing');
    return;
  }
  const { free } = storageTotals(snap);
  if (free < 1) {
    playError();
    setHudLogRaw(barnSpaceError(snap, slots));
    return;
  }

  try {
    unlockAudio();
    const n = await Network.collectAnimals();
    playCollect();
    const partial = n < slots;
    setHudLog(partial ? 'game.collectedPartial' : 'game.collected', {
      n,
      labelKey: 'inventory.animal',
    });
    await refreshFarm();
  } catch (err: unknown) {
    playError();
    log(err instanceof Error ? err.message : String(err));
  }
}

async function collectFactories(): Promise<void> {
  const snap = getRegistrySnapshot();
  if (!snap) {
    return;
  }

  const slots = estimateReadyFactorySlots(snap);
  if (slots < 1) {
    setHudLog('game.factoryBusy');
    return;
  }
  const { free } = storageTotals(snap);
  if (free < 1) {
    playError();
    setHudLogRaw(barnSpaceError(snap, slots));
    return;
  }

  try {
    unlockAudio();
    const n = await Network.collectFactories();
    playCollect();
    const partial = n < slots;
    setHudLog(partial ? 'game.collectedPartial' : 'game.collected', {
      n,
      labelKey: 'inventory.factory',
    });
    await refreshFarm();
  } catch (err: unknown) {
    playError();
    log(err instanceof Error ? err.message : String(err));
  }
}

function resolvePlacementTile(
  snap: FarmSnapshot,
  tile: FarmTileDto | undefined,
  kind: 'animal' | 'factory',
): FarmTileDto | null {
  if (!tile || tile.placementKind !== kind || tile.placementTypeId == null) {
    return null;
  }
  if (tile.placementIsAnchor) {
    return tile;
  }
  const ax = tile.placementAnchorX ?? tile.x;
  const ay = tile.placementAnchorY ?? tile.y;
  return (
    snap.tiles.find((t) => t.x === ax && t.y === ay && t.placementKind === kind) ?? tile
  );
}

async function interactWithAnimal(snap: FarmSnapshot, tile: FarmTileDto): Promise<void> {
  const typeId = tile.placementTypeId!;
  const def = snap.animalCatalog.find((a) => a.id === typeId);
  if (!def) {
    return;
  }

  const needsFeed =
    !tile.placementLastActionUtc || tile.placementLastActionUtc === '';

  if (needsFeed) {
    const feedCode = def.feedResourceCode;
    const feedQty = Math.max(1, def.feedQuantity ?? 1);
    const have =
      snap.resources.find((r) => r.resourceCode === feedCode)?.quantity ?? 0;
    const feedName = resourceLabel(feedCode, snap);

    if (have < feedQty) {
      playError();
      await showFarmAlert({
        title: catalogAnimalName(def.id, def.name, def),
        emoji: animalEmoji(def.id),
        message: t('game.animalFeedNeedMore', { qty: feedQty, feed: feedName }),
        details: [
          { label: t('game.needInBarn'), value: `${feedQty} ${feedName}` },
          { label: t('game.youHave'), value: `${have} ${feedName}` },
        ],
        okLabel: t('modal.ok'),
      });
      return;
    }

    const ok = await showFarmConfirm({
      title: catalogAnimalName(def.id, def.name, def),
      emoji: animalEmoji(def.id),
      message: t('game.animalFeedPrompt', { qty: feedQty, feed: feedName }),
      details: [
        { label: t('game.usesFromBarn'), value: `${feedQty} ${feedName}` },
        {
          label: t('game.thenProduces'),
          value: `${def.productQuantity} ${resourceLabel(def.productCode, snap)}`,
        },
        {
          label: t('game.workTime'),
          value: formatDuration(def.productionIntervalSeconds),
        },
      ],
      confirmLabel: t('modal.feedAnimal'),
      cancelLabel: t('modal.notNow'),
      variant: 'collect',
    });
    if (!ok) {
      return;
    }

    try {
      unlockAudio();
      await Network.feedAnimalAt(typeId, tile.x, tile.y);
      playCollect();
      setHudLog('game.animalFed', { feed: feedName, qty: feedQty });
      await refreshFarm();
    } catch (err: unknown) {
      playError();
      log(err instanceof Error ? err.message : String(err));
    }
    return;
  }

  const remaining = tile.placementSecondsRemaining ?? 0;
  const ready = remaining <= 0;

  if (!ready) {
    await showFarmAlert({
      title: catalogAnimalName(def.id, def.name, def),
      emoji: animalEmoji(def.id),
      message: t('game.animalProducing'),
      details: [
        {
          label: t('game.timeLeft'),
          value:
            tile.placementSecondsRemaining != null && tile.placementSecondsRemaining > 0
              ? formatDuration(tile.placementSecondsRemaining)
              : t('game.almostReady'),
        },
        {
          label: t('game.thenCollect'),
          value: `${def.productQuantity} ${resourceLabel(def.productCode, snap)}`,
        },
      ],
      okLabel: t('modal.ok'),
    });
    return;
  }

  const product = resourceLabel(def.productCode, snap);
  const cycles = estimateBankedAnimalCycles(tile, def.productionIntervalSeconds);
  const pendingQty = Math.max(def.productQuantity, cycles * def.productQuantity);
  const collectQty = barnCollectableSlots(snap, pendingQty);
  const penFull = cycles >= maxBankedAnimalCycles(snap);

  if (collectQty < 1) {
    playError();
    setHudLogRaw(barnSpaceError(snap, pendingQty));
    return;
  }

  const ok = await showFarmConfirm({
    title: catalogAnimalName(def.id, def.name, def),
    emoji: animalEmoji(def.id),
    message: penFull
      ? t('game.animalPenFull')
      : collectQty < pendingQty
        ? t('game.animalReadyPartial')
        : t('game.animalReady'),
    details: [
      {
        label: t('game.youReceive'),
        value:
          collectQty < pendingQty
            ? `${collectQty} / ${pendingQty} ${product}`
            : `${collectQty} ${product}`,
      },
      { label: t('game.barnStorage'), value: barnStorageLine(snap) },
      {
        label: t('game.nextCycle'),
        value: formatDuration(def.productionIntervalSeconds),
      },
    ],
    confirmLabel: t('modal.collect'),
    cancelLabel: t('modal.notNow'),
    variant: 'collect',
  });
  if (!ok) {
    return;
  }

  try {
    unlockAudio();
    const n = await Network.collectAnimalAt(typeId, tile.x, tile.y);
    playCollect();
    setHudLog(
      n < pendingQty ? 'game.collectedPartialOne' : 'game.collected',
      { n, resource: def.productCode },
    );
    await refreshFarm();
  } catch (err: unknown) {
    playError();
    log(err instanceof Error ? err.message : String(err));
  }
}

async function showBarnStatusPopup(snap: FarmSnapshot): Promise<void> {
  const used =
    snap.storageUsed ?? snap.resources.reduce((n, r) => n + r.quantity, 0);
  const capacity =
    snap.storageCapacity;
  const full = used >= capacity;
  const tier = snap.barnUpgradeTier ?? 0;
  const offer = snap.nextBarnUpgrade;
  const maxTier = 3;

  await showFarmAlert({
    title: t('game.barnStatusTitle'),
    emoji: '🏚️',
    message: full
      ? t('game.barnStatusFull')
      : offer
        ? t('game.barnStatusOk')
        : t('game.barnStatusMaxed'),
    details: [
      { label: t('game.barnStorage'), value: barnStorageLine(snap) },
      {
        label: t('game.barnUpgradeTier'),
        value: t('game.barnTierValue', { tier, max: maxTier }),
      },
      {
        label: t('game.barnBonus'),
        value: `+${Math.max(0, capacity - (gameConfigFromSnapshot(snap).baseStorageCapacity + Math.max(0, snap.level - 1) * gameConfigFromSnapshot(snap).storagePerLevel))}`,
      },
      { label: t('game.yourGold'), value: `${snap.gold}` },
      ...(offer
        ? [
            {
              label: t('game.nextUpgrade'),
              value: t('game.barnNextUpgrade', {
                slots: offer.bonusSlots,
                cost: offer.goldCost,
              }),
            },
          ]
        : []),
    ],
    okLabel: t('modal.ok'),
  });
}

async function upgradeBarnFromHud(snap?: FarmSnapshot): Promise<void> {
  const cur = snap ?? getRegistrySnapshot();
  if (!cur) {
    return;
  }

  const offer = cur.nextBarnUpgrade;
  if (!offer) {
    await showBarnStatusPopup(cur);
    return;
  }

  if (!cur.barnPlacedOnFarm) {
    setHudLog('game.placeBarnFirst');
    return;
  }

  if (cur.gold < offer.goldCost) {
    setHudLog('game.needGoldBarn', { cost: offer.goldCost, slots: offer.bonusSlots });
    return;
  }

  const ok = await showFarmConfirm({
    title: t('game.upgradeTitle'),
    emoji: '🏚️',
    message: t('game.upgradeMsg'),
    details: [
      { label: t('game.capacityGain'), value: `+${offer.bonusSlots}` },
      { label: t('game.totalBarnBonus'), value: `${offer.totalBarnBonus}` },
      { label: t('game.cost'), value: `${offer.goldCost}` },
      { label: t('game.yourGold'), value: `${cur.gold}` },
      { label: t('game.barnNow'), value: barnStorageLine(cur) },
    ],
    confirmLabel: t('modal.upgrade', { slots: offer.bonusSlots }),
    cancelLabel: t('modal.cancel'),
    variant: 'upgrade',
  });
  if (!ok) {
    return;
  }

  try {
    unlockAudio();
    const capacity = await Network.upgradeBarn();
    playBuy();
    setHudLog('game.barnUpgraded', { n: capacity });
    await refreshFarm();
  } catch (err: unknown) {
    playError();
    log(err instanceof Error ? err.message : String(err));
  }
}

async function interactWithFactory(snap: FarmSnapshot, tile: FarmTileDto): Promise<void> {
  const typeId = tile.placementTypeId!;
  const def = snap.factoryCatalog.find((f) => f.id === typeId);
  if (!def) {
    return;
  }

  if (def.isBarn ?? false) {
    if (!snap.nextBarnUpgrade) {
      await showBarnStatusPopup(snap);
      return;
    }
    await upgradeBarnFromHud(snap);
    return;
  }

  const recipe = formatRecipeLine(
    snap,
    def.inputResourceCode,
    def.inputQuantity,
    def.outputResourceCode,
    def.outputQuantity,
  );
  const state = factoryPlacementState(tile);
  const factoryTitle = catalogFactoryName(def.id, def.name, def);

  if (state === 'working') {
    const remaining = tile.placementSecondsRemaining ?? 0;
    await showFarmAlert({
      title: factoryTitle,
      emoji: factoryEmoji(def.id, false),
      message: t('game.factoryBusy'),
      details: [
        {
          label: t('game.timeLeft'),
          value: remaining > 0 ? formatDuration(remaining) : t('game.almostReady'),
        },
        {
          label: t('game.output'),
          value: formatQtyResource(
            snap,
            def.outputResourceCode,
            def.outputQuantity * Math.max(1, tile.placementBatchRuns ?? 1),
          ),
        },
        {
          label: t('game.workTime'),
          value: formatDuration(
            def.processSeconds * Math.max(1, tile.placementBatchRuns ?? 1),
          ),
        },
      ],
      okLabel: t('modal.ok'),
    });
    return;
  }

  const inputName = resourceLabelFromSnap(snap, def.inputResourceCode);

  if (state === 'done') {
    const runs = Math.max(1, tile.placementBatchRuns ?? 1);
    const outputQty = def.outputQuantity * runs;
    if (!barnHasSpace(snap, outputQty)) {
      playError();
      setHudLogRaw(barnSpaceError(snap, outputQty));
      return;
    }

    const ok = await showFarmConfirm({
      title: factoryTitle,
      emoji: factoryEmoji(def.id, false),
      message: t('game.factoryReady'),
      details: [
        { label: t('game.recipe'), value: recipe },
        {
          label: t('game.youReceive'),
          value: formatQtyResource(snap, def.outputResourceCode, outputQty),
        },
        { label: t('game.barnStorage'), value: barnStorageLine(snap) },
      ],
      confirmLabel: t('modal.collect'),
      cancelLabel: t('modal.notNow'),
      variant: 'collect',
    });
    if (!ok) {
      return;
    }

    try {
      unlockAudio();
      const n = await Network.processFactory(typeId, tile.x, tile.y, 1);
      playCollect();
      setHudLog('game.collected', { n, resource: def.outputResourceCode });
      await refreshFarm();
    } catch (err: unknown) {
      playError();
      log(err instanceof Error ? err.message : String(err));
    }
    return;
  }

  {
    const inputQty =
      snap.resources.find((r) => r.resourceCode === def.inputResourceCode)?.quantity ?? 0;
    if (inputQty < def.inputQuantity) {
      await showFarmAlert({
        title: factoryTitle,
        emoji: factoryEmoji(def.id, false),
        message: t('game.factoryNeedIngredients'),
        details: [
          { label: t('game.recipe'), value: recipe },
          {
            label: t('game.needInBarn'),
            value: formatQtyResource(snap, def.inputResourceCode, def.inputQuantity),
          },
          {
            label: t('game.youHave'),
            value: formatQtyResource(snap, def.inputResourceCode, inputQty),
          },
        ],
        okLabel: t('modal.ok'),
      });
      return;
    }

    const maxRuns = Math.min(10, Math.floor(inputQty / def.inputQuantity));
    if (maxRuns < 1) {
      return;
    }

    const formatBatchLabel = (runs: number) =>
      t('game.factoryStartBatch', {
        runs,
        input: `${def.inputQuantity * runs} ${inputName}`,
        time: formatDuration(def.processSeconds * runs),
      });

    const runOptions = [...new Set([1, 5, 10, maxRuns])]
      .filter((n) => n >= 1 && n <= maxRuns)
      .sort((a, b) => a - b);
    const choices = runOptions.map((runs) => ({
      runs,
      label: formatBatchLabel(runs),
    }));

    const batchRuns = await showFarmBatchPick({
      title: factoryTitle,
      emoji: factoryEmoji(def.id, false),
      message: t('game.factoryStart'),
      details: [
        { label: t('game.recipe'), value: recipe },
        {
          label: t('game.youHave'),
          value: formatQtyResource(snap, def.inputResourceCode, inputQty),
        },
        {
          label: t('game.workTime'),
          value: t('game.factoryWorkTimePerRun', {
            time: formatDuration(def.processSeconds),
          }),
        },
        {
          label: t('game.thenCollect'),
          value: formatQtyResource(snap, def.outputResourceCode, def.outputQuantity),
        },
        { label: t('game.barnStorage'), value: barnStorageLine(snap) },
      ],
      choices,
      cancelLabel: t('modal.cancel'),
    });
    if (batchRuns == null) {
      return;
    }

    try {
      unlockAudio();
      await Network.processFactory(typeId, tile.x, tile.y, batchRuns);
      playCollect();
      setHudLog('game.factoryStarted', {
        runs: batchRuns,
        time: formatDuration(def.processSeconds * batchRuns),
        resource: def.outputResourceCode,
      });
      await refreshFarm();
    } catch (err: unknown) {
      playError();
      log(err instanceof Error ? err.message : String(err));
    }
  }
}

async function sellResource(code: string, quantity: number): Promise<void> {
  if (quantity < 1) {
    return;
  }
  try {
    unlockAudio();
    const gold = await Network.sellResource(code, quantity);
    playBuy();
    setHudLog('game.sold', { gold });
    await refreshFarm();
  } catch (err: unknown) {
    playError();
    log(err instanceof Error ? err.message : String(err));
  }
}

async function enterGame(displayName: string, email: string): Promise<void> {
  pageLogin.hidden = true;
  pageRegister.hidden = true;
  setLangSwitcherPlacement('overlay');
  setBgmForScreen('menu');
  appEl.hidden = false;
  appEl.classList.add('app--booting');
  showBootScreen();
  setFarmerHud(displayName, email);

  const steps: BootStep[] = [
    {
      id: 'engine',
      labelKey: 'boot.engine',
      run: async () => {
        await ensurePhaserReady();
      },
    },
    {
      id: 'farm',
      labelKey: 'boot.farm',
      run: async () => {
        await refreshFarm();
      },
    },
    {
      id: 'live',
      labelKey: 'boot.live',
      run: async () => {
        await startLive();
      },
    },
  ];

  try {
    await runBootSequence(steps);
    hideBootScreen();
    showApp();
    setHudLog('log.welcomeHint');
  } catch (err: unknown) {
    hideBootScreen();
    appEl.classList.remove('app--booting');
    showLoginPage();
    loginMessage(err instanceof Error ? err.message : String(err));
  }
}

async function onAuthSuccess(displayName: string, email: string): Promise<void> {
  loginMessage('');
  registerMessage('');
  await enterGame(displayName, email);
}

document.querySelector<HTMLButtonElement>('#go-register')!.addEventListener('click', () => {
  registerMessage('');
  showRegisterPage();
});

document.querySelector<HTMLButtonElement>('#go-login')!.addEventListener('click', () => {
  loginMessage('');
  showLoginPage();
});

document.querySelector<HTMLButtonElement>('#btn-register')!.addEventListener('click', () => {
  void (async () => {
    if (
      !validateAuthInputs([
        'register-display-name',
        'register-email',
        'register-password',
      ])
    ) {
      return;
    }

    const displayName = registerDisplayName.value.trim();
    if (displayName.length < 2) {
      registerMessage(t('validation.displayNameTooShort'));
      return;
    }

    try {
      const auth = await Network.register(
        registerEmail.value.trim(),
        registerPassword.value,
        displayName,
      );
      Network.setSession(auth);
      await onAuthSuccess(auth.displayName, auth.email);
    } catch (err: unknown) {
      registerMessage(err instanceof Error ? err.message : String(err));
    }
  })();
});

document.querySelector<HTMLButtonElement>('#btn-login')!.addEventListener('click', () => {
  void (async () => {
    if (!validateAuthInputs(['login-email', 'login-password'])) {
      return;
    }

    try {
      const auth = await Network.login(loginEmail.value.trim(), loginPassword.value);
      Network.setSession(auth);
      await onAuthSuccess(auth.displayName, auth.email);
    } catch (err: unknown) {
      loginMessage(err instanceof Error ? err.message : String(err));
    }
  })();
});

function wireLogout(): void {
  const handler = () => {
  void (async () => {
    const uid = Network.getUserId();
    if (hub?.state === 'Connected' && uid) {
      try {
        await hub.invoke('LeaveFarm', uid);
      } catch {
        /* ignore */
      }
      await hub.stop();
    }
    Network.clearSession();
    lastKnownLevel = null;
    destroyPhaser();
    showLoginPage();
    loginMessage(t('log.signedOut'));
  })();
  };
  document.querySelector<HTMLButtonElement>('#btn-logout')?.addEventListener('click', handler);
  document.querySelector<HTMLButtonElement>('#btn-logout-mobile')?.addEventListener('click', handler);
}

wireLogout();

function wireRefresh(): void {
  const handler = () => {
    void refreshFarm()
      .then(() => setHudLog('log.farmSynced'))
      .catch((err: unknown) => log(err instanceof Error ? err.message : String(err)));
  };
  document.querySelector<HTMLButtonElement>('#btn-refresh')?.addEventListener('click', handler);
  document.querySelector<HTMLButtonElement>('#btn-refresh-mobile')?.addEventListener('click', handler);
}

wireRefresh();

window.setInterval(() => {
  if (!Network.getAccessToken() || appEl.hidden || dragActionPending) {
    return;
  }

  void refreshFarm().catch(() => {
    /* offline */
  });
}, 8000);

void (async () => {
  await loadRuntimeConfig();
  initHub();
  initMobileMenu();

  if (Network.getAccessToken()) {
    try {
      const profile = await Network.getProfile();
      await enterGame(profile.displayName, profile.email);
    } catch {
      Network.clearSession();
      showLoginPage();
      loginMessage(t('log.sessionExpired'));
    }
    return;
  }

  showLoginPage();
})();
