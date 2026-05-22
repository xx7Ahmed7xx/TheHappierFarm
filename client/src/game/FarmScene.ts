import Phaser from 'phaser';
import { formatDuration, t } from '../i18n';
import type { FarmSnapshot, FarmTileDto } from '../types';
import {
  computeCropSecondsRemaining,
  computeVisualPhase,
  isCropRipe,
} from '../growth';
import { placementTimerLabel } from './placementLabels';
import { tilePlacement } from './tileSelection';
import { ensureFarmProceduralSprites } from './farmProceduralSprites';
import { prepareFarmTextures } from './farmTexturePrep';
import { resolveCropSpriteKey, resolvePlacementSpriteKey } from './farmSpriteResolve';
import { cropPhaseEmoji, placementEmoji } from './tileVisuals';
import {
  footprintScreenBounds,
  footprintSpriteAnchor,
  footprintStackDepth,
} from './farmFootprint';
import {
  MEADOW_PALETTE,
  paintIsoTile,
  SOIL_PALETTE,
  tileVariantSeed,
  YARD_PALETTE,
} from './isoTileDraw';
import {
  farmGridOrigin,
  farmDiamondCenter,
  farmWorldBounds,
  gridRectTiles,
  gridToScreen,
  screenToGrid,
  TILE_DEPTH,
  TILE_HALF_H,
  TILE_HALF_W,
} from './isometric';
import {
  applyCameraPanScreenDelta,
  clampFarmCameraScroll,
  clientToCameraPoint,
  setCameraZoomAt,
} from './farmCamera';
import { fitFarmSpriteDisplay } from './farmSpriteDisplay';
import {
  emojiLabelFontSize,
  labelLiftWorld,
  labelTextPadding,
  timerLabelFontSize,
} from './farmLabelScale';
import { loadFarmZoom, saveFarmZoom } from './farmViewPrefs';
import { PlacementLabelLayer } from './placementLabelLayer';
import { PlacementSpriteLayer } from './placementSprites';
import {
  TILE_ANCHOR_X,
  TILE_ANCHOR_Y,
  TILE_HIT_HH,
  TILE_HIT_HW,
} from './tileLayout';

export type TileCoord = { x: number; y: number };

export type TilesDragHandler = (coords: TileCoord[], isComplete: boolean) => void;

export type DragTool = 'plant' | 'harvest' | 'place' | 'pickup' | 'pan';

export const PENDING_FARM_SNAPSHOT_KEY = 'pendingFarmSnapshot';

const PENDING_SNAPSHOT_KEY = PENDING_FARM_SNAPSHOT_KEY;

const EMOJI_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif',
  fontSize: '28px',
  color: '#ffffff',
  stroke: '#1b1b1b',
  strokeThickness: 4,
  align: 'center',
};

const TIMER_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'Segoe UI, system-ui, sans-serif',
  fontSize: '10px',
  fontStyle: 'bold',
  color: '#fffde7',
  stroke: '#37474f',
  strokeThickness: 1,
  align: 'center',
  backgroundColor: '#00000099',
  padding: { x: 3, y: 1 },
};

const DEPTH_UI_DRAG = 500;

function drawRhombus(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  hw: number,
  hh: number,
  color: number,
  alpha: number,
): void {
  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(x, y - hh);
  g.lineTo(x + hw, y);
  g.lineTo(x, y + hh);
  g.lineTo(x - hw, y);
  g.closePath();
  g.fillPath();
}

function strokeRhombus(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  hw: number,
  hh: number,
  color: number,
  alpha: number,
  width = 1,
): void {
  g.lineStyle(width, color, alpha);
  g.beginPath();
  g.moveTo(x, y - hh);
  g.lineTo(x + hw, y);
  g.lineTo(x, y + hh);
  g.lineTo(x - hw, y);
  g.closePath();
  g.strokePath();
}

function tileAnchor(origin: { x: number; y: number }, gridX: number, gridY: number): { x: number; y: number } {
  const p = gridToScreen(gridX, gridY);
  return { x: origin.x + p.x, y: origin.y + p.y };
}

function formatCropTimerLabel(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds <= 0) {
    return '';
  }
  return t('game.timerLeft', { time: formatDuration(seconds) });
}

/**
 * One grid cell — all art in a single container (layer 0 soil, layer 1 content, layer 2 labels).
 */
class TileStack extends Phaser.GameObjects.Container {
  readonly gridX: number;
  readonly gridY: number;
  private readonly soilGfx: Phaser.GameObjects.Graphics;
  private readonly soilSprite: Phaser.GameObjects.Image;
  private readonly contentSprite: Phaser.GameObjects.Image;
  private readonly emojiText: Phaser.GameObjects.Text;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly hitGfx: Phaser.GameObjects.Graphics;
  private contentAnchorX = TILE_ANCHOR_X;
  private contentAnchorY = TILE_ANCHOR_Y;
  private contentFootprintW = 1;
  private contentFootprintH = 1;
  private overlayAnchorGx = -1;
  private overlayAnchorGy = -1;

  constructor(
    scene: Phaser.Scene,
    gridX: number,
    gridY: number,
    worldX: number,
    worldY: number,
    onPointerDown: (pointer: Phaser.Input.Pointer) => void,
    onPointerOver: () => void,
  ) {
    super(scene, worldX, worldY);
    this.gridX = gridX;
    this.gridY = gridY;
    this.setDepth(gridX + gridY);

    this.soilGfx = scene.add.graphics();
    this.soilSprite = scene.add
      .image(TILE_ANCHOR_X, TILE_ANCHOR_Y, 'farm-crop-1-seed')
      .setOrigin(0.5, 1)
      .setVisible(false);
    this.contentSprite = scene.add
      .image(TILE_ANCHOR_X, TILE_ANCHOR_Y, 'farm-crop-1-seed')
      .setOrigin(0.5, 1)
      .setVisible(false);
    this.emojiText = scene.add
      .text(TILE_ANCHOR_X, TILE_ANCHOR_Y, '', EMOJI_STYLE)
      .setOrigin(0.5, 1)
      .setFontSize(26);
    this.timerText = scene.add.text(TILE_ANCHOR_X, TILE_ANCHOR_Y - 48, '', TIMER_STYLE).setOrigin(0.5, 1);
    this.hitGfx = scene.add.graphics();

    this.add([this.soilGfx, this.soilSprite, this.contentSprite, this.emojiText, this.timerText, this.hitGfx]);

    const hw = TILE_HIT_HW;
    const hh = TILE_HIT_HH;
    drawRhombus(this.hitGfx, 0, 0, hw, hh, 0xffffff, 0.001);
    const hit = new Phaser.Geom.Polygon([0, -hh, hw, 0, 0, hh, -hw, 0]);
    this.hitGfx.setInteractive(hit, Phaser.Geom.Polygon.Contains);
    this.hitGfx.on('pointerdown', (pointer: Phaser.Input.Pointer) => onPointerDown(pointer));
    this.hitGfx.on('pointerover', onPointerOver);

    this.paintSoil(tileVariantSeed(this.gridX, this.gridY));
    this.emojiText.setVisible(false);
    this.timerText.setVisible(false);
  }

  private showSprite(
    key: string,
    anchorX = TILE_ANCHOR_X,
    anchorY = TILE_ANCHOR_Y,
    footprintW = 1,
    footprintH = 1,
  ): boolean {
    if (!this.scene.textures.exists(key)) {
      return false;
    }
    this.contentSprite.setDepth(10);
    this.contentAnchorX = anchorX;
    this.contentAnchorY = anchorY;
    this.contentFootprintW = footprintW;
    this.contentFootprintH = footprintH;
    this.contentSprite.setTexture(key);
    this.contentSprite.setOrigin(0.5, 1);
    this.contentSprite.setPosition(anchorX, anchorY);
    fitFarmSpriteDisplay(this.contentSprite, footprintW, footprintH);
    this.contentSprite.setVisible(true);
    this.syncTimerPosition();
    this.emojiText.setVisible(false);
    return true;
  }

  updateLabelZoom(zoom: number): void {
    const fpW = this.contentFootprintW;
    const fpH = this.contentFootprintH;
    const pad = labelTextPadding(zoom, fpW, fpH);
    if (this.timerText.visible) {
      this.timerText.setFontSize(timerLabelFontSize(zoom, fpW, fpH));
      this.timerText.setPadding(pad.x, pad.y);
      this.syncTimerPosition();
    }
    if (this.emojiText.visible) {
      this.emojiText.setFontSize(emojiLabelFontSize(zoom, fpW, fpH));
    }
  }

  private showEmoji(
    label: string,
    fontSize = '26px',
    anchorX = TILE_ANCHOR_X,
    anchorY = TILE_ANCHOR_Y,
    footprintW = 1,
    footprintH = 1,
  ): void {
    this.contentAnchorX = anchorX;
    this.contentAnchorY = anchorY;
    this.contentFootprintW = footprintW;
    this.contentFootprintH = footprintH;
    this.contentSprite.setVisible(false);
    this.emojiText.setText(label);
    this.emojiText.setFontSize(fontSize);
    this.emojiText.setPosition(anchorX, anchorY);
    this.emojiText.setOrigin(0.5, 1);
    this.emojiText.setVisible(true);
  }

  private hideContent(): void {
    if (this.overlayAnchorGx >= 0) {
      const farmScene = this.scene as FarmScene;
      farmScene.placementLayer.remove(this.overlayAnchorGx, this.overlayAnchorGy);
      farmScene.placementLabels.remove(this.overlayAnchorGx, this.overlayAnchorGy);
      this.overlayAnchorGx = -1;
      this.overlayAnchorGy = -1;
    }
    this.contentSprite.setVisible(false);
    this.emojiText.setVisible(false);
  }

  private syncTimerPosition(): void {
    const ax = this.contentAnchorX;
    const zoom = (this.scene as FarmScene).cameras.main.zoom;
    const lift = labelLiftWorld(zoom, this.contentFootprintW, this.contentFootprintH);
    this.timerText.setX(ax);
    const bounds = footprintScreenBounds(this.contentFootprintW, this.contentFootprintH);

    if (this.contentSprite.visible) {
      const top = this.contentAnchorY - this.contentSprite.displayHeight;
      this.timerText.setY(top - lift);
      return;
    }

    if (this.emojiText.visible) {
      const top = this.contentAnchorY - this.emojiText.height;
      this.timerText.setY(top - lift);
      return;
    }

    this.timerText.setY(this.contentAnchorY - bounds.height - lift);
  }

  /** Soil for crops; soft meadow for animals; worn yard for factories. */
  private refreshSoil(tile: FarmTileDto): void {
    const hasCrop = tile.cropTypeId !== null && tile.phase !== 'Empty';
    const { kind } = tilePlacement(tile);
    const seed = tileVariantSeed(this.gridX, this.gridY);

    if (kind === 'animal') {
      this.paintMeadowSoil(seed, 0);
      return;
    }
    if (kind === 'factory' && !hasCrop) {
      this.paintMeadowSoil(seed, 0.42);
      return;
    }
    if (kind && !hasCrop) {
      this.paintSoil(seed);
      return;
    }
    this.paintSoil(seed);
  }

  applyCursor(scene: Phaser.Scene): void {
    const mode = scene.game.registry.get('farmCursor') as string | undefined;
    if (!this.hitGfx.input) {
      return;
    }
    this.hitGfx.input.cursor =
      mode === 'pan'
        ? 'grab'
        : mode === 'plant' || mode === 'place'
          ? 'crosshair'
          : mode === 'harvest' || mode === 'pickup'
            ? 'pointer'
            : 'default';
  }

  private paintSoil(seed: number): void {
    this.soilSprite.setVisible(false);
    this.soilGfx.clear();
    paintIsoTile(this.soilGfx, 0, 0, SOIL_PALETTE, 'soil', seed);
  }

  private paintMeadowSoil(seed: number, earthWear: number): void {
    this.soilSprite.setVisible(false);
    this.soilGfx.clear();
    const palette = earthWear > 0.2 ? YARD_PALETTE : MEADOW_PALETTE;
    paintIsoTile(this.soilGfx, 0, 0, palette, 'natural', seed, earthWear);
  }

  /** Iso painter's algorithm: front corner of footprint + anchor above fill cells. */
  private applyStackDepth(tile: FarmTileDto): void {
    const fpW = tile.placementFootprintW ?? 1;
    const fpH = tile.placementFootprintH ?? 1;
    const anchorGx = tile.placementAnchorX ?? this.gridX;
    const anchorGy = tile.placementAnchorY ?? this.gridY;
    const isAnchor =
      tile.placementIsAnchor
      ?? (this.gridX === anchorGx && this.gridY === anchorGy);
    this.setDepth(
      footprintStackDepth(
        this.gridX,
        this.gridY,
        anchorGx,
        anchorGy,
        fpW,
        fpH,
        isAnchor,
      ),
    );
  }

  paintTile(tile: FarmTileDto, nowMs: number, snapshotServerMs: number | null): void {
    this.applyStackDepth(tile);
    let phase =
      tile.phase === 'Empty' || tile.cropTypeId === null
        ? 'Empty'
        : computeVisualPhase(tile, nowMs);
    if (tile.cropTypeId !== null && phase === 'Empty' && tile.phase !== 'Empty') {
      phase = tile.phase;
    }
    if (tile.cropTypeId !== null && phase === 'Empty') {
      phase = 'Seedling';
    }
    const { kind, typeId } = tilePlacement(tile);

    this.hideContent();
    this.timerText.setVisible(false);
    this.refreshSoil(tile);

    if (phase !== 'Empty' && tile.cropTypeId !== null) {
      this.contentFootprintW = 1;
      this.contentFootprintH = 1;
      this.contentAnchorX = TILE_ANCHOR_X;
      this.contentAnchorY = TILE_ANCHOR_Y;
      const spriteKey = resolveCropSpriteKey(tile.cropTypeId, phase);
      if (!this.showSprite(spriteKey, TILE_ANCHOR_X, TILE_ANCHOR_Y, 1, 1)) {
        this.showEmoji(cropPhaseEmoji(tile.cropTypeId, phase));
      }

      const cropRemaining = computeCropSecondsRemaining(tile, nowMs, snapshotServerMs);
      if (phase !== 'Ripe' && cropRemaining !== null && cropRemaining > 0) {
        this.timerText.setText(formatCropTimerLabel(cropRemaining));
        this.timerText.setVisible(true);
        this.syncTimerPosition();
      }
    } else if (kind) {
      if (!tile.placementIsAnchor) {
        this.refreshSoil(tile);
        return;
      }

      const fpW = tile.placementFootprintW ?? 1;
      const fpH = tile.placementFootprintH ?? 1;
      const { x: px, y: py } = footprintSpriteAnchor(fpW, fpH);
      const anchorGx = tile.placementAnchorX ?? this.gridX;
      const anchorGy = tile.placementAnchorY ?? this.gridY;

      const isBarn = kind === 'factory' && typeId === 2;
      const spriteKey = resolvePlacementSpriteKey(kind, typeId);
      const multiTile = fpW > 1 || fpH > 1;
      const farmScene = this.scene as FarmScene;

      if (!spriteKey || !this.showSprite(spriteKey, px, py, fpW, fpH)) {
        if (multiTile) {
          farmScene.placementLayer.remove(anchorGx, anchorGy);
        }
        this.showEmoji(
          placementEmoji(kind, typeId, isBarn),
          emojiLabelFontSize((this.scene as FarmScene).cameras.main.zoom, fpW, fpH),
          px,
          py,
          fpW,
          fpH,
        );
      } else if (multiTile) {
        this.contentSprite.setVisible(false);
        this.overlayAnchorGx = anchorGx;
        this.overlayAnchorGy = anchorGy;
        farmScene.placementLayer.sync(
          anchorGx,
          anchorGy,
          this.x + px,
          this.y + py,
          spriteKey,
          fpW,
          fpH,
        );
      }

      if (kind !== 'decoration') {
        const timerLabel = placementTimerLabel(
          tile,
          nowMs,
          snapshotServerMs,
          farmScene.farmSnapshot,
        );
        if (timerLabel) {
          if (multiTile) {
            this.timerText.setVisible(false);
            farmScene.placementLabels.sync(
              anchorGx,
              anchorGy,
              this.x + px,
              this.y + py,
              timerLabel,
              fpW,
              fpH,
            );
          } else {
            farmScene.placementLabels.remove(anchorGx, anchorGy);
            this.timerText.setText(timerLabel);
            this.timerText.setVisible(true);
            this.timerText.setDepth(30);
            this.syncTimerPosition();
          }
        } else if (multiTile) {
          farmScene.placementLabels.remove(anchorGx, anchorGy);
        }
      }
    }
  }

  /** Update countdown labels only (no graphics redraw). */
  updateTimerLabels(
    tile: FarmTileDto,
    nowMs: number,
    snapshotServerMs: number | null,
  ): void {
    const { kind } = tilePlacement(tile);

    if (kind && !tile.placementIsAnchor) {
      if (this.timerText.visible) {
        this.timerText.setVisible(false);
      }
      return;
    }

    let phase =
      tile.phase === 'Empty' || tile.cropTypeId === null
        ? 'Empty'
        : computeVisualPhase(tile, nowMs);
    if (tile.cropTypeId !== null && phase === 'Empty' && tile.phase !== 'Empty') {
      phase = tile.phase;
    }

    if (phase !== 'Empty' && tile.cropTypeId !== null) {
      const cropRemaining = computeCropSecondsRemaining(tile, nowMs, snapshotServerMs);
      if (phase !== 'Ripe' && cropRemaining !== null && cropRemaining > 0) {
        const label = formatCropTimerLabel(cropRemaining);
        if (this.timerText.text !== label || !this.timerText.visible) {
          this.timerText.setText(label);
          this.timerText.setVisible(true);
          this.syncTimerPosition();
        }
        return;
      }
      if (this.timerText.visible) {
        this.timerText.setVisible(false);
      }
      return;
    }

    if (kind && tile.placementIsAnchor) {
      const fpW = tile.placementFootprintW ?? 1;
      const fpH = tile.placementFootprintH ?? 1;
      const multiTile = fpW > 1 || fpH > 1;
      const farmScene = this.scene as FarmScene;
      const timerLabel = placementTimerLabel(
        tile,
        nowMs,
        snapshotServerMs,
        farmScene.farmSnapshot,
      );
      const anchorGx = tile.placementAnchorX ?? this.gridX;
      const anchorGy = tile.placementAnchorY ?? this.gridY;
      const { x: px, y: py } = footprintSpriteAnchor(fpW, fpH);

      if (multiTile) {
        if (timerLabel) {
          farmScene.placementLabels.sync(
            anchorGx,
            anchorGy,
            this.x + px,
            this.y + py,
            timerLabel,
            fpW,
            fpH,
          );
        } else {
          farmScene.placementLabels.remove(anchorGx, anchorGy);
        }
        if (this.timerText.visible) {
          this.timerText.setVisible(false);
        }
        return;
      }

      if (timerLabel) {
        const text = timerLabel;
        if (this.timerText.text !== text || !this.timerText.visible) {
          this.timerText.setText(text);
          this.timerText.setVisible(true);
          this.syncTimerPosition();
        }
        return;
      }
    }

    if (this.timerText.visible) {
      this.timerText.setVisible(false);
    }
  }
}

export class FarmScene extends Phaser.Scene {
  private readonly stacks = new Map<string, TileStack>();
  private farmWorld!: Phaser.GameObjects.Container;
  private origin = farmGridOrigin();
  private gridSize = 9;
  private groundBed!: Phaser.GameObjects.Graphics;
  private lastSnapshot: FarmSnapshot | null = null;

  /** Latest farm state (for tile labels, etc.). */
  get farmSnapshot(): FarmSnapshot | null {
    return this.lastSnapshot;
  }
  private serverClockOffsetMs = 0;
  private lastGrowthPaintMs = 0;
  private lastTimerPaintMs = 0;
  private readonly visualKeys = new Map<string, string>();
  private dragging = false;
  private dragAnchor: TileCoord | null = null;
  private dragEnd: TileCoord | null = null;
  private dragHighlightGfx!: Phaser.GameObjects.Graphics;
  private viewPanning = false;
  private touchPanning = false;
  private panPointerStart = { x: 0, y: 0 };
  private panCamStart = { x: 0, y: 0 };
  readonly placementLayer = new PlacementSpriteLayer(this);
  readonly placementLabels = new PlacementLabelLayer(this);
  private zoomLevel = loadFarmZoom() ?? 1;
  /** True after the scale manager has reported the real game-container size. */
  private viewportReady = false;
  private static readonly ZOOM_MIN = 0.55;
  private static readonly ZOOM_MAX = 1.85;
  private static readonly ZOOM_STEP = 0.1;

  constructor() {
    super({ key: 'FarmScene' });
  }

  create(): void {
    const onTilesDrag = this.game.registry.get('onTilesDrag') as TilesDragHandler | undefined;

    ensureFarmProceduralSprites(this);
    prepareFarmTextures(this);

    this.farmWorld = this.add.container(0, 0);
    this.groundBed = this.add.graphics();
    this.dragHighlightGfx = this.add.graphics();
    this.farmWorld.add([this.groundBed, this.dragHighlightGfx]);
    this.liftDragHighlight();

    this.cameras.main.setRoundPixels(true);
    this.input.mouse?.disableContextMenu();
    this.setupZoom();

    this.input.addPointer(2);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown()) {
        this.startViewPan(pointer);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isInputSuspended()) {
        return;
      }

      if (this.processTwoFingerPan()) {
        return;
      }

      if (this.viewPanning) {
        this.applyViewPan(pointer);
        return;
      }

      if (!this.dragging) {
        return;
      }
      const g = this.pointerToGrid(pointer);
      const gx = Phaser.Math.Clamp(g.x, 0, this.gridSize - 1);
      const gy = Phaser.Math.Clamp(g.y, 0, this.gridSize - 1);
      this.updateDragEnd(gx, gy);
    });

    this.input.on('pointerup', () => {
      if (this.isInputSuspended()) {
        this.cancelInteraction();
        return;
      }

      if (this.touchPanning) {
        if (!this.input.pointer1.isDown || !this.input.pointer2.isDown) {
          this.touchPanning = false;
          this.viewPanning = false;
        }
        return;
      }
      if (this.viewPanning) {
        this.viewPanning = false;
        return;
      }
      this.endDrag(onTilesDrag);
    });

    this.game.events.on('blur', () => {
      this.viewPanning = false;
      this.touchPanning = false;
      this.cancelDrag();
    });

    this.setGridSize(9);

    this.scale.on('resize', () => {
      if (!this.farmWorld) {
        return;
      }
      for (const stack of this.stacks.values()) {
        const { x: wx, y: wy } = tileAnchor(this.origin, stack.gridX, stack.gridY);
        stack.setPosition(wx, wy);
      }
      this.repositionPlacementSprites();
      this.repositionPlacementLabels();
      this.updateGroundBed();
      if (!this.viewportReady) {
        this.viewportReady = true;
        this.centerCameraOnFarm();
      } else {
        this.clampCameraScroll();
      }
    });

    const pending = this.game.registry.get(PENDING_SNAPSHOT_KEY) as FarmSnapshot | undefined;
    if (pending) {
      this.applySnapshot(pending);
    }
  }

  private setupZoom(): void {
    const cam = this.cameras.main;
    cam.setZoom(this.zoomLevel);
    this.refreshLabelZoom();

    this.input.on(
      'wheel',
      (
        _pointer: Phaser.Input.Pointer,
        _over: Phaser.GameObjects.GameObject[],
        _dx: number,
        dy: number,
        _dz: number,
        event: WheelEvent,
      ) => {
        if (this.isInputSuspended()) {
          return;
        }
        event.preventDefault();
        const delta = dy > 0 ? -0.08 : 0.08;
        const focus = clientToCameraPoint(this, event.clientX, event.clientY);
        this.adjustZoom(delta, focus.x, focus.y);
      },
    );

    const kb = this.input.keyboard;
    if (kb) {
      kb.on('keydown', (ev: KeyboardEvent) => {
        if (ev.key === '+' || ev.key === '=') {
          this.adjustZoom(FarmScene.ZOOM_STEP);
        } else if (ev.key === '-' || ev.key === '_') {
          this.adjustZoom(-FarmScene.ZOOM_STEP);
        }
      });
    }
  }

  /** Zoom toward a point in game canvas pixels (defaults to view center). */
  adjustZoom(delta: number, focusScreenX?: number, focusScreenY?: number): void {
    const cam = this.cameras.main;
    const prevZoom = cam.zoom;
    const newZoom = Phaser.Math.Clamp(prevZoom + delta, FarmScene.ZOOM_MIN, FarmScene.ZOOM_MAX);
    if (Math.abs(newZoom - prevZoom) < 0.001) {
      return;
    }
    const fx = focusScreenX ?? cam.width * 0.5;
    const fy = focusScreenY ?? cam.height * 0.5;
    setCameraZoomAt(cam, newZoom, fx, fy);
    this.zoomLevel = newZoom;
    this.clampCameraScroll();
    this.game.registry.set('farmZoomLevel', this.zoomLevel);
    saveFarmZoom(this.zoomLevel);
    this.refreshLabelZoom();
  }

  private refreshLabelZoom(): void {
    const z = this.cameras.main.zoom;
    this.placementLabels.setZoom(z);
    for (const stack of this.stacks.values()) {
      stack.updateLabelZoom(z);
    }
  }

  /** Apply saved zoom after login or when switching accounts. */
  applySavedZoom(): void {
    const saved = loadFarmZoom();
    if (saved === null) {
      return;
    }
    this.zoomLevel = saved;
    this.cameras.main.setZoom(saved);
    this.clampCameraScroll();
    this.game.registry.set('farmZoomLevel', this.zoomLevel);
    this.refreshLabelZoom();
  }

  private repositionPlacementSprites(): void {
    if (!this.lastSnapshot) {
      return;
    }
    for (const tile of this.lastSnapshot.tiles) {
      if (!tile.placementIsAnchor || !tile.placementKind) {
        continue;
      }
      const fpW = tile.placementFootprintW ?? 1;
      const fpH = tile.placementFootprintH ?? 1;
      if (fpW <= 1 && fpH <= 1) {
        continue;
      }
      const ax = tile.placementAnchorX ?? tile.x;
      const ay = tile.placementAnchorY ?? tile.y;
      const stack = this.stacks.get(`${ax},${ay}`);
      if (!stack) {
        continue;
      }
      const { x: px, y: py } = footprintSpriteAnchor(fpW, fpH);
      this.placementLayer.reposition(ax, ay, stack.x + px, stack.y + py);
    }
  }

  private repositionPlacementLabels(): void {
    if (!this.lastSnapshot) {
      return;
    }
    const nowMs = this.serverNowMs();
    const serverMs = this.snapshotServerMs();
    for (const tile of this.lastSnapshot.tiles) {
      if (!tile.placementIsAnchor || !tile.placementKind) {
        continue;
      }
      const fpW = tile.placementFootprintW ?? 1;
      const fpH = tile.placementFootprintH ?? 1;
      if (fpW <= 1 && fpH <= 1) {
        continue;
      }
      const label = placementTimerLabel(tile, nowMs, serverMs, this.lastSnapshot);
      if (!label) {
        continue;
      }
      const ax = tile.placementAnchorX ?? tile.x;
      const ay = tile.placementAnchorY ?? tile.y;
      const stack = this.stacks.get(`${ax},${ay}`);
      if (!stack) {
        continue;
      }
      const { x: px, y: py } = footprintSpriteAnchor(fpW, fpH);
      this.placementLabels.sync(ax, ay, stack.x + px, stack.y + py, label, fpW, fpH);
    }
  }

  private liftDragHighlight(): void {
    if (this.farmWorld && this.dragHighlightGfx) {
      this.dragHighlightGfx.setDepth(DEPTH_UI_DRAG);
      this.farmWorld.bringToTop(this.dragHighlightGfx);
    }
  }

  private isPanToolActive(): boolean {
    return (this.game.registry.get('farmDragTool') as DragTool | undefined) === 'pan';
  }

  private startViewPan(pointer: Phaser.Input.Pointer): void {
    this.viewPanning = true;
    this.touchPanning = false;
    this.cancelDrag();
    this.panPointerStart = { x: pointer.x, y: pointer.y };
    this.panCamStart = { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY };
  }

  private applyViewPan(pointer: Phaser.Input.Pointer): void {
    const px = this.touchPanning
      ? (this.input.pointer1.x + this.input.pointer2.x) / 2
      : pointer.x;
    const py = this.touchPanning
      ? (this.input.pointer1.y + this.input.pointer2.y) / 2
      : pointer.y;
    applyCameraPanScreenDelta(
      this.cameras.main,
      this.panCamStart.x,
      this.panCamStart.y,
      px - this.panPointerStart.x,
      py - this.panPointerStart.y,
    );
    this.clampCameraScroll();
  }

  /** Two-finger drag pans the camera (touch / trackpad). */
  private processTwoFingerPan(): boolean {
    const p1 = this.input.pointer1;
    const p2 = this.input.pointer2;
    if (!p1.isDown || !p2.isDown) {
      if (this.touchPanning) {
        this.touchPanning = false;
        this.viewPanning = false;
      }
      return false;
    }

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    if (!this.touchPanning) {
      this.touchPanning = true;
      this.viewPanning = true;
      this.cancelDrag();
      this.panPointerStart = { x: midX, y: midY };
      this.panCamStart = { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY };
    }

    applyCameraPanScreenDelta(
      this.cameras.main,
      this.panCamStart.x,
      this.panCamStart.y,
      midX - this.panPointerStart.x,
      midY - this.panPointerStart.y,
    );
    this.clampCameraScroll();
    return true;
  }

  /** Cancel drag/pan and clear selection overlay (e.g. when a DOM modal opens). */
  cancelInteraction(): void {
    this.viewPanning = false;
    this.touchPanning = false;
    this.cancelDrag();
  }

  private isInputSuspended(): boolean {
    return Boolean(this.game.registry.get('farmInputSuspended'));
  }

  private onTilePointerDown(gridX: number, gridY: number, pointer: Phaser.Input.Pointer): void {
    if (this.isInputSuspended()) {
      return;
    }
    if (pointer.middleButtonDown() || this.isPanToolActive()) {
      this.startViewPan(pointer);
      return;
    }
    if (!pointer.leftButtonDown()) {
      return;
    }
    this.beginDrag(gridX, gridY);
  }

  private pointerToGrid(pointer: Phaser.Input.Pointer): { x: number; y: number } {
    if (!this.farmWorld) {
      return { x: 0, y: 0 };
    }
    const wx = pointer.worldX - this.farmWorld.x - this.origin.x;
    const wy = pointer.worldY - this.farmWorld.y - this.origin.y;
    return screenToGrid(wx, wy);
  }

  private clampCameraScroll(): void {
    if (!this.farmWorld) {
      return;
    }
    clampFarmCameraScroll(this.cameras.main, farmWorldBounds(this.gridSize, this.origin));
  }

  private centerCameraOnFarm(): void {
    if (!this.farmWorld) {
      return;
    }
    const cam = this.cameras.main;
    if (cam.width < 1 || cam.height < 1) {
      return;
    }
    const center = farmDiamondCenter(this.gridSize, this.origin);
    const viewW = cam.width / cam.zoom;
    const viewH = cam.height / cam.zoom;
    cam.scrollX = center.x - viewW / 2;
    cam.scrollY = center.y - viewH / 2;
    this.clampCameraScroll();
  }

  private ensureGridStacks(): void {
    if (!this.farmWorld) {
      return;
    }

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const key = `${x},${y}`;
        if (this.stacks.has(key)) {
          continue;
        }

        const { x: wx, y: wy } = tileAnchor(this.origin, x, y);
        const stack = new TileStack(
          this,
          x,
          y,
          wx,
          wy,
          (pointer) => this.onTilePointerDown(x, y, pointer),
          () => {
            if (this.dragging) {
              this.updateDragEnd(x, y);
            }
          },
        );
        this.farmWorld.add(stack);
        this.stacks.set(key, stack);
      }
    }
    this.liftDragHighlight();
  }

  applySnapshot(snapshot: FarmSnapshot): void {
    this.lastSnapshot = snapshot;
    this.game.registry.set(PENDING_SNAPSHOT_KEY, snapshot);
    this.setGridSize(snapshot.gridSize);
    const serverMs = Date.parse(snapshot.serverTimeUtc);
    if (!Number.isNaN(serverMs)) {
      this.serverClockOffsetMs = serverMs - Date.now();
    }
    this.visualKeys.clear();
    this.repaintAll(this.serverNowMs());
    this.refreshLabelZoom();
  }

  private setGridSize(size: number): void {
    const prev = this.gridSize;
    this.gridSize = Math.max(9, size);
    this.origin = farmGridOrigin();
    this.ensureGridStacks();
    this.updateGroundBed();
    this.updateStackVisibility();
    for (const stack of this.stacks.values()) {
      const { x: wx, y: wy } = tileAnchor(this.origin, stack.gridX, stack.gridY);
      stack.setPosition(wx, wy);
    }
    this.repositionPlacementSprites();
    if (this.gridSize !== prev || prev === 9) {
      this.centerCameraOnFarm();
    } else {
      this.clampCameraScroll();
    }
    this.applySavedZoom();
    this.game.registry.set('farmGridSize', this.gridSize);
  }

  private updateGroundBed(): void {
    if (!this.groundBed) {
      return;
    }
    const pad = 28;
    const w = (this.gridSize - 1) * TILE_HALF_W * 2 + TILE_HALF_W * 2 + pad;
    const h = (this.gridSize - 1) * TILE_HALF_H * 2 + TILE_HALF_H * 2 + TILE_DEPTH + pad;
    const center = farmDiamondCenter(this.gridSize, this.origin);
    this.groundBed.clear();
    this.groundBed.fillStyle(0x3d6b28, 0.4);
    this.groundBed.fillEllipse(center.x, center.y, w, h * 0.55);
  }

  private updateStackVisibility(): void {
    for (const stack of this.stacks.values()) {
      const active = stack.gridX < this.gridSize && stack.gridY < this.gridSize;
      stack.setVisible(active);
      stack.setActive(active);
    }
  }

  private serverNowMs(): number {
    return Date.now() + this.serverClockOffsetMs;
  }

  private snapshotServerMs(): number | null {
    if (!this.lastSnapshot) {
      return null;
    }
    const ms = Date.parse(this.lastSnapshot.serverTimeUtc);
    return Number.isNaN(ms) ? null : ms;
  }

  setSnapshotData(snapshot: FarmSnapshot): void {
    this.applySnapshot(snapshot);
  }

  clearDragPreview(): void {
    this.dragHighlightGfx?.clear();
  }

  update(time: number): void {
    if (!this.lastSnapshot) {
      return;
    }

    const now = this.serverNowMs();
    const serverMs = this.snapshotServerMs();

    if (time - this.lastTimerPaintMs >= 1000) {
      this.lastTimerPaintMs = time;
      this.tickTimers(now, serverMs);
    }

    if (time - this.lastGrowthPaintMs < 400) {
      return;
    }

    this.lastGrowthPaintMs = time;
    this.repaintGrowthOnly(now, serverMs);
  }

  refreshCursors(): void {
    for (const stack of this.stacks.values()) {
      stack.applyCursor(this);
    }
  }

  private beginDrag(x: number, y: number): void {
    if (this.isInputSuspended()) {
      return;
    }
    this.viewPanning = false;
    this.dragging = true;
    this.dragAnchor = { x, y };
    this.dragEnd = { x, y };
    // Highlight only after the pointer moves to another tile (avoids flash on click).
  }

  private updateDragEnd(x: number, y: number): void {
    if (!this.dragging || !this.dragAnchor) {
      return;
    }
    if (this.dragEnd?.x === x && this.dragEnd?.y === y) {
      return;
    }
    this.dragEnd = { x, y };
    this.redrawDragHighlight();
  }

  private getDragRectangle(): TileCoord[] {
    if (!this.dragAnchor || !this.dragEnd) {
      return [];
    }
    return gridRectTiles(
      this.dragAnchor.x,
      this.dragAnchor.y,
      this.dragEnd.x,
      this.dragEnd.y,
      this.gridSize,
    );
  }

  private redrawDragHighlight(): void {
    if (!this.dragHighlightGfx || !this.lastSnapshot) {
      return;
    }

    this.liftDragHighlight();
    this.dragHighlightGfx.clear();
    const tool = (this.game.registry.get('farmDragTool') as DragTool | undefined) ?? 'plant';
    const selection = this.getDragRectangle();

    const highlightColor =
      tool === 'harvest'
        ? 0xffd54f
        : tool === 'pickup'
          ? 0xffab91
          : tool === 'place'
            ? 0x90caf9
            : 0x81c784;

    const strokeColor =
      tool === 'harvest'
        ? 0xf9a825
        : tool === 'pickup'
          ? 0xe64a19
          : tool === 'place'
            ? 0x1565c0
            : 0x2e7d32;

    for (const { x: gx, y: gy } of selection) {
      const { x, y } = tileAnchor(this.origin, gx, gy);
      const tile = this.lastSnapshot.tiles.find((t) => t.x === gx && t.y === gy);
      const { kind: pk } = tile ? tilePlacement(tile) : { kind: null };

      let alpha = 0.45;
      if (tool === 'harvest') {
        alpha = tile && isCropRipe(tile, this.serverNowMs()) ? 0.7 : 0.15;
      } else if (tool === 'pickup') {
        alpha = pk ? 0.75 : 0.15;
      } else if (tool === 'place') {
        const emptySoil = tile?.phase === 'Empty' && !pk && tile.cropTypeId === null;
        alpha = emptySoil ? 0.65 : 0.12;
      } else {
        alpha = tile?.phase === 'Empty' && !pk ? 0.55 : 0.12;
      }

      drawRhombus(this.dragHighlightGfx, x, y, TILE_HALF_W, TILE_HALF_H, highlightColor, alpha);
      strokeRhombus(this.dragHighlightGfx, x, y, TILE_HALF_W, TILE_HALF_H, strokeColor, 0.95, 2.5);
    }
  }

  private endDrag(onTilesDrag?: TilesDragHandler): void {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    const coords = this.getDragRectangle();
    this.dragAnchor = null;
    this.dragEnd = null;
    this.clearDragPreview();
    if (coords.length > 0) {
      onTilesDrag?.(coords, true);
    }
  }

  private cancelDrag(): void {
    this.dragging = false;
    this.dragAnchor = null;
    this.dragEnd = null;
    this.clearDragPreview();
  }

  private visualKey(tile: FarmTileDto, nowMs: number): string {
    const { kind, typeId } = tilePlacement(tile);
    const placement = kind ? `|${kind}:${typeId}` : '';
    if (tile.phase === 'Empty' && !kind) {
      return 'empty';
    }
    if (tile.phase === 'Empty' && kind) {
      return `placed${placement}`;
    }
    return `${tile.cropTypeId}|${tile.plantedAtUtc}|${computeVisualPhase(tile, nowMs)}${placement}`;
  }

  private repaintAll(nowMs: number): void {
    if (!this.lastSnapshot) {
      return;
    }

    const serverMs = this.snapshotServerMs();
    for (const tile of this.lastSnapshot.tiles) {
      if (tile == null || !Number.isFinite(tile.x) || !Number.isFinite(tile.y)) {
        continue;
      }
      const key = `${tile.x},${tile.y}`;
      this.visualKeys.set(key, this.visualKey(tile, nowMs));
      this.stacks.get(key)?.paintTile(tile, nowMs, serverMs);
    }
  }

  private repaintGrowthOnly(nowMs: number, serverMs: number | null): void {
    if (!this.lastSnapshot) {
      return;
    }

    for (const tile of this.lastSnapshot.tiles) {
      const key = `${tile.x},${tile.y}`;
      const vk = this.visualKey(tile, nowMs);
      if (this.visualKeys.get(key) === vk) {
        continue;
      }
      this.visualKeys.set(key, vk);
      this.stacks.get(key)?.paintTile(tile, nowMs, serverMs);
    }
  }

  /** Re-apply timer/label strings after locale change. */
  refreshLocaleLabels(): void {
    this.tickTimers(Date.now(), this.snapshotServerMs());
  }

  private tickTimers(nowMs: number, serverMs: number | null): void {
    if (!this.lastSnapshot) {
      return;
    }

    for (const tile of this.lastSnapshot.tiles) {
      const { kind } = tilePlacement(tile);
      const hasCrop = tile.cropTypeId !== null;
      if (kind && !tile.placementIsAnchor) {
        continue;
      }
      if (!kind && !hasCrop) {
        continue;
      }

      const key = `${tile.x},${tile.y}`;
      this.stacks.get(key)?.updateTimerLabels(tile, nowMs, serverMs);
    }
  }
}

export const FARM_CANVAS_WIDTH = 720;
export const FARM_CANVAS_HEIGHT = 420;
