import Phaser from 'phaser';
import { cropVisual } from './catalogVisuals';
import {
  ANIMAL_TYPE_IDS,
  CROP_TYPE_IDS,
  DECORATION_TYPE_IDS,
  FACTORY_TYPE_IDS,
} from './catalogVisuals';
import {
  computeSpriteAnchor,
  FARM_SPRITE_ANCHOR_PREFIX,
  measureSpriteFootMetrics,
  setFarmSpriteFootMetrics,
  trimCanvasToContent,
} from './farmTexturePrep';
import {
  hexColor,
  isoBox,
  isoCylinder,
  isoDoor,
  ISO_CX as CX,
  ISO_FEET_Y as FEET_Y,
  isoGableRoof,
  isoOutline,
  isoShadow,
  isoTilledMound,
  ISO_TEX_H as TEX_H,
  ISO_TEX_W as TEX_W,
  isoWindow,
  shade,
  type IsoColors,
} from './isoSpriteDraw';

type SpriteSpec = { key: string; draw: (g: Phaser.GameObjects.Graphics) => void };

function colors(base: number): IsoColors {
  return { top: shade(base, 28), left: shade(base, -32), right: shade(base, -12) };
}

// ——— Crops ———

function drawCropBarley(g: Phaser.GameObjects.Graphics, stage: 'seed' | 'grow' | 'ripe'): void {
  const v = cropVisual(1);
  const gold = hexColor(v.accent);
  const stalk = hexColor(v.accentDark);
  isoTilledMound(g, CX, FEET_Y, stage === 'seed' ? 16 : 20);

  if (stage === 'seed') {
    g.fillStyle(0x7cb342, 1);
    g.fillRect(CX - 1, FEET_Y - 18, 3, 10);
    g.fillEllipse(CX - 4, FEET_Y - 16, 4, 3);
    g.fillEllipse(CX + 4, FEET_Y - 17, 4, 3);
    return;
  }

  if (stage === 'grow') {
    for (let i = -1; i <= 1; i++) {
      const x = CX + i * 7;
      g.fillStyle(stalk, 1);
      g.fillRect(x - 1, FEET_Y - 28, 3, 22);
      g.fillStyle(0x8bc34a, 1);
      g.fillEllipse(x - 5, FEET_Y - 26, 8, 5);
      g.fillEllipse(x + 5, FEET_Y - 27, 8, 5);
    }
    return;
  }

  for (let i = -2; i <= 2; i++) {
    const x = CX + i * 6;
    g.fillStyle(stalk, 1);
    g.fillRect(x - 1, FEET_Y - 32, 2, 26);
    g.fillStyle(gold, 1);
    g.fillEllipse(x, FEET_Y - 34, 5, 9);
    g.fillEllipse(x - 3, FEET_Y - 30, 4, 6);
    g.fillEllipse(x + 3, FEET_Y - 31, 4, 6);
  }
}

function drawCropCarrot(g: Phaser.GameObjects.Graphics, stage: 'seed' | 'grow' | 'ripe'): void {
  const v = cropVisual(2);
  const orange = hexColor(v.accent);
  isoTilledMound(g, CX, FEET_Y, stage === 'ripe' ? 22 : 18);

  if (stage === 'seed') {
    g.fillStyle(0xaed581, 1);
    g.fillEllipse(CX, FEET_Y - 14, 5, 3);
    return;
  }

  if (stage === 'grow') {
    g.fillStyle(orange, 1);
    g.fillTriangle(CX - 5, FEET_Y - 6, CX + 5, FEET_Y - 6, CX, FEET_Y - 24);
    g.fillStyle(0x43a047, 1);
    g.fillEllipse(CX - 9, FEET_Y - 24, 11, 6);
    g.fillEllipse(CX + 9, FEET_Y - 25, 10, 5);
    return;
  }

  g.fillStyle(shade(orange, -20), 1);
  g.fillEllipse(CX + 2, FEET_Y - 10, 12, 8);
  g.fillStyle(orange, 1);
  g.fillEllipse(CX - 2, FEET_Y - 14, 16, 14);
  g.fillStyle(0x388e3c, 1);
  g.fillEllipse(CX - 12, FEET_Y - 28, 14, 7);
  g.fillEllipse(CX + 10, FEET_Y - 29, 12, 6);
  g.lineStyle(1, shade(orange, -40), 0.4);
  g.lineBetween(CX - 6, FEET_Y - 16, CX + 4, FEET_Y - 10);
}

function drawCropWheat(g: Phaser.GameObjects.Graphics, stage: 'seed' | 'grow' | 'ripe'): void {
  const v = cropVisual(3);
  const gold = hexColor(v.accent);
  isoTilledMound(g, CX, FEET_Y, 18);

  if (stage === 'seed') {
    g.fillStyle(0xc5e1a5, 1);
    g.fillEllipse(CX, FEET_Y - 12, 6, 4);
    return;
  }

  if (stage === 'grow') {
    for (let i = -1; i <= 1; i++) {
      const x = CX + i * 8;
      g.fillStyle(0x689f38, 1);
      g.fillRect(x - 1, FEET_Y - 30, 2, 24);
      g.fillStyle(0x9ccc65, 1);
      g.fillEllipse(x, FEET_Y - 30, 6, 10);
    }
    return;
  }

  for (let i = -2; i <= 2; i++) {
    const x = CX + i * 5;
    g.fillStyle(0x827717, 1);
    g.fillRect(x - 1, FEET_Y - 34, 2, 28);
    g.fillStyle(gold, 1);
    g.fillEllipse(x, FEET_Y - 36, 4, 11);
    g.fillEllipse(x - 2, FEET_Y - 33, 3, 7);
    g.fillEllipse(x + 2, FEET_Y - 34, 3, 7);
  }
}

function drawCropTomato(g: Phaser.GameObjects.Graphics, stage: 'seed' | 'grow' | 'ripe'): void {
  const v = cropVisual(4);
  const red = hexColor(v.accent);
  isoTilledMound(g, CX, FEET_Y, 18);

  if (stage === 'seed') {
    g.fillStyle(0x8d6e63, 1);
    g.fillEllipse(CX, FEET_Y - 10, 7, 4);
    return;
  }

  if (stage === 'grow') {
    g.fillStyle(0x558b2f, 1);
    g.fillRect(CX - 2, FEET_Y - 30, 4, 22);
    g.fillStyle(0x81c784, 1);
    g.fillEllipse(CX - 10, FEET_Y - 28, 10, 6);
    g.fillEllipse(CX + 10, FEET_Y - 29, 10, 6);
    g.fillStyle(shade(red, 10), 1);
    g.fillCircle(CX + 10, FEET_Y - 24, 5);
    return;
  }

  g.fillStyle(0x33691e, 1);
  g.fillRect(CX - 2, FEET_Y - 32, 4, 20);
  g.fillStyle(0x43a047, 1);
  g.fillEllipse(CX - 12, FEET_Y - 30, 12, 6);
  g.fillEllipse(CX + 12, FEET_Y - 31, 12, 6);
  for (const ox of [-10, 0, 10]) {
    g.fillStyle(shade(red, -15), 1);
    g.fillCircle(CX + ox + 1, FEET_Y - 22, 7);
    g.fillStyle(red, 1);
    g.fillCircle(CX + ox, FEET_Y - 23, 7);
    g.fillStyle(shade(red, 35), 0.5);
    g.fillEllipse(CX + ox - 2, FEET_Y - 25, 4, 3);
  }
}

function drawCropPumpkin(g: Phaser.GameObjects.Graphics, stage: 'seed' | 'grow' | 'ripe'): void {
  const v = cropVisual(5);
  const orange = hexColor(v.accent);
  isoTilledMound(g, CX, FEET_Y, stage === 'ripe' ? 24 : 18);

  if (stage === 'seed') {
    g.fillStyle(0xaed581, 1);
    g.fillEllipse(CX, FEET_Y - 12, 6, 4);
    return;
  }

  if (stage === 'grow') {
    g.fillStyle(shade(orange, 20), 1);
    g.fillEllipse(CX, FEET_Y - 16, 14, 11);
    g.fillStyle(0x43a047, 1);
    g.fillEllipse(CX - 14, FEET_Y - 24, 12, 6);
    g.fillEllipse(CX + 12, FEET_Y - 25, 11, 5);
    return;
  }

  g.fillStyle(shade(orange, -25), 1);
  g.fillEllipse(CX + 3, FEET_Y - 12, 20, 14);
  g.fillStyle(orange, 1);
  g.fillEllipse(CX, FEET_Y - 16, 24, 18);
  g.lineStyle(1, shade(orange, -45), 0.35);
  g.lineBetween(CX - 8, FEET_Y - 18, CX + 6, FEET_Y - 12);
  g.lineBetween(CX - 2, FEET_Y - 22, CX + 8, FEET_Y - 14);
  g.fillStyle(0x558b2f, 1);
  g.fillRect(CX - 2, FEET_Y - 32, 4, 10);
  g.fillStyle(0x6d4c41, 1);
  g.fillRect(CX - 1, FEET_Y - 34, 3, 4);
}

// ——— Animals ———

function drawCow(g: Phaser.GameObjects.Graphics): void {
  isoShadow(g, CX, FEET_Y, 40, 14);
  const body = 0x8d6e63;
  const spot = 0xfafafa;
  const hoof = 0x3e2723;

  g.fillStyle(shade(body, -25), 1);
  g.fillEllipse(CX + 2, FEET_Y - 14, 34, 20);
  g.fillStyle(body, 1);
  g.fillEllipse(CX, FEET_Y - 18, 32, 22);
  g.fillStyle(spot, 1);
  g.fillEllipse(CX - 10, FEET_Y - 20, 14, 16);
  g.fillEllipse(CX + 12, FEET_Y - 17, 11, 13);
  g.fillEllipse(CX + 2, FEET_Y - 24, 10, 8);

  g.fillStyle(body, 1);
  g.fillEllipse(CX - 20, FEET_Y - 22, 14, 16);
  g.fillStyle(shade(body, -15), 1);
  g.fillEllipse(CX - 24, FEET_Y - 24, 10, 12);
  g.fillStyle(hoof, 1);
  g.fillCircle(CX - 28, FEET_Y - 28, 4);
  g.fillCircle(CX - 16, FEET_Y - 28, 4);
  g.fillStyle(0x5d4037, 1);
  g.fillRect(CX - 30, FEET_Y - 30, 5, 6);
  g.fillRect(CX - 14, FEET_Y - 30, 5, 6);
  g.fillStyle(0xffcdd2, 0.6);
  g.fillEllipse(CX - 30, FEET_Y - 26, 3, 2);

  g.fillStyle(hoof, 1);
  g.fillRect(CX - 8, FEET_Y - 6, 5, 6);
  g.fillRect(CX + 6, FEET_Y - 6, 5, 6);
  g.fillRect(CX + 18, FEET_Y - 6, 5, 6);
  g.fillStyle(0xbcaaa4, 1);
  g.fillEllipse(CX + 14, FEET_Y - 12, 6, 5);
}

function drawSheep(g: Phaser.GameObjects.Graphics): void {
  isoShadow(g, CX, FEET_Y, 36, 13);
  const wool = 0xf5f5f5;
  const woolDark = 0xe0e0e0;

  for (let i = 0; i < 5; i++) {
    const x = CX - 16 + i * 8;
    g.fillStyle(woolDark, 1);
    g.fillCircle(x, FEET_Y - 18, 7);
    g.fillStyle(wool, 1);
    g.fillCircle(x, FEET_Y - 20, 7);
  }
  g.fillStyle(wool, 1);
  g.fillEllipse(CX, FEET_Y - 20, 28, 18);

  g.fillStyle(0x424242, 1);
  g.fillEllipse(CX - 14, FEET_Y - 26, 10, 12);
  g.fillStyle(0x212121, 1);
  g.fillCircle(CX - 18, FEET_Y - 28, 3);
  g.fillCircle(CX - 10, FEET_Y - 28, 3);
  g.fillStyle(0x757575, 1);
  g.fillRect(CX - 12, FEET_Y - 22, 4, 3);

  g.fillStyle(0x616161, 1);
  g.fillRect(CX - 4, FEET_Y - 6, 3, 5);
  g.fillRect(CX + 4, FEET_Y - 6, 3, 5);
}

function drawHen(g: Phaser.GameObjects.Graphics): void {
  isoShadow(g, CX, FEET_Y, 22, 9);
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(CX, FEET_Y - 12, 18, 14);
  g.fillStyle(0xf5f5f5, 1);
  g.fillEllipse(CX + 2, FEET_Y - 14, 14, 12);
  g.fillStyle(0xff7043, 1);
  g.fillCircle(CX + 10, FEET_Y - 16, 6);
  g.fillStyle(0xffab91, 1);
  g.fillTriangle(CX + 16, FEET_Y - 16, CX + 8, FEET_Y - 14, CX + 12, FEET_Y - 18);
  g.fillStyle(0xffeb3b, 1);
  g.fillTriangle(CX - 2, FEET_Y - 26, CX - 8, FEET_Y - 20, CX + 4, FEET_Y - 20);
  g.fillStyle(0xf44336, 1);
  g.fillEllipse(CX - 4, FEET_Y - 24, 5, 4);
  g.fillStyle(0xff8f00, 1);
  g.fillRect(CX + 8, FEET_Y - 6, 4, 3);
  g.fillRect(CX - 4, FEET_Y - 6, 4, 3);
  g.fillStyle(0x212121, 1);
  g.fillCircle(CX + 12, FEET_Y - 18, 2);
}

// ——— Factories ———

function drawCheesePress(g: Phaser.GameObjects.Graphics): void {
  isoShadow(g, CX, FEET_Y, 42, 14);
  const stone = colors(0x78909c);
  isoBox(g, CX, FEET_Y, 40, 14, 14, stone);
  isoOutline(g, CX, FEET_Y, 40, 14, 14, 0x37474f);

  const wood = colors(0x8d6e63);
  isoBox(g, CX - 4, FEET_Y - 14, 18, 8, 16, wood);
  g.fillStyle(0x546e7a, 1);
  g.fillRect(CX - 2, FEET_Y - 34, 5, 20);
  g.fillStyle(0x455a64, 1);
  g.fillCircle(CX, FEET_Y - 36, 8);
  g.lineStyle(2, 0x37474f, 0.5);
  g.lineBetween(CX, FEET_Y - 36, CX, FEET_Y - 28);

  g.fillStyle(0xffd54f, 1);
  g.fillRect(CX - 10, FEET_Y - 20, 14, 8);
  g.fillStyle(0xffc107, 1);
  g.fillRect(CX - 8, FEET_Y - 22, 10, 3);
  g.fillStyle(0xfff59d, 0.6);
  g.fillEllipse(CX - 3, FEET_Y - 18, 6, 3);

  g.fillStyle(0xffecb3, 1);
  g.fillEllipse(CX + 14, FEET_Y - 18, 8, 5);
}

function drawBarn(g: Phaser.GameObjects.Graphics): void {
  isoShadow(g, CX, FEET_Y, 48, 16);
  const red = colors(0xc62828);
  const dark = colors(0x8d0000);
  isoBox(g, CX, FEET_Y, 46, 16, 24, red);
  isoOutline(g, CX, FEET_Y, 46, 16, 24, 0x4a0e0e);
  isoGableRoof(g, CX, FEET_Y - 24, 48, 18, 16, dark);

  isoDoor(g, CX - 8, FEET_Y - 20, 16, 18);
  isoWindow(g, CX - 20, FEET_Y - 28, 8, 8);
  isoWindow(g, CX + 14, FEET_Y - 28, 8, 8);

  g.fillStyle(0xffecb3, 1);
  g.fillRect(CX - 22, FEET_Y - 8, 6, 2);
  g.fillRect(CX + 18, FEET_Y - 8, 6, 2);
}

function drawWoolSpinner(g: Phaser.GameObjects.Graphics): void {
  isoShadow(g, CX, FEET_Y, 40, 14);
  const wood = colors(0xa1887f);
  isoBox(g, CX, FEET_Y, 38, 12, 12, wood);
  isoOutline(g, CX, FEET_Y, 38, 12, 12, 0x4e342e);

  g.fillStyle(0x6d4c41, 1);
  g.fillRect(CX - 2, FEET_Y - 26, 5, 16);
  g.fillStyle(0xeeeeee, 1);
  g.fillCircle(CX + 2, FEET_Y - 30, 12);
  g.lineStyle(2, 0xbdbdbd, 0.8);
  g.lineBetween(CX + 2, FEET_Y - 30, CX + 14, FEET_Y - 22);
  g.fillStyle(0xce93d8, 1);
  g.fillCircle(CX - 10, FEET_Y - 22, 6);
  g.fillCircle(CX + 12, FEET_Y - 20, 5);
  g.fillStyle(0xab47bc, 0.5);
  g.fillEllipse(CX - 10, FEET_Y - 22, 8, 3);
}

function drawBakery(g: Phaser.GameObjects.Graphics): void {
  isoShadow(g, CX, FEET_Y, 42, 14);
  const brick = colors(0xd7ccc8);
  isoBox(g, CX, FEET_Y, 40, 14, 20, brick);
  isoOutline(g, CX, FEET_Y, 40, 14, 20, 0x5d4037);

  const oven = colors(0x8d6e63);
  isoBox(g, CX - 6, FEET_Y - 20, 20, 8, 14, oven);
  g.fillStyle(0xff5722, 0.7);
  g.fillRect(CX - 4, FEET_Y - 16, 12, 6);

  g.fillStyle(0x795548, 1);
  g.fillRect(CX + 8, FEET_Y - 38, 8, 18);
  g.fillStyle(0x9e9e9e, 1);
  g.fillEllipse(CX + 12, FEET_Y - 40, 6, 4);
  g.fillStyle(0x5d4037, 0.4);
  g.fillEllipse(CX + 12, FEET_Y - 42, 4, 6);

  g.fillStyle(0xffcc80, 1);
  g.fillEllipse(CX - 14, FEET_Y - 22, 7, 4);
  g.fillEllipse(CX + 16, FEET_Y - 24, 6, 4);
  g.fillStyle(0xffab40, 1);
  g.fillEllipse(CX - 12, FEET_Y - 24, 5, 3);
}

// ——— Decorations ———

function drawSunflowerPatch(g: Phaser.GameObjects.Graphics): void {
  isoShadow(g, CX, FEET_Y, 36, 12);
  isoTilledMound(g, CX, FEET_Y, 26);
  for (const ox of [-12, 0, 12]) {
    g.fillStyle(0x558b2f, 1);
    g.fillRect(CX + ox - 1, FEET_Y - 28, 3, 18);
    g.fillStyle(0xffc107, 1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillEllipse(
        CX + ox + Math.cos(a) * 8,
        FEET_Y - 32 + Math.sin(a) * 3,
        4,
        5,
      );
    }
    g.fillStyle(0x6d4c41, 1);
    g.fillCircle(CX + ox, FEET_Y - 32, 5);
  }
}

function drawWoodenFence(g: Phaser.GameObjects.Graphics): void {
  isoShadow(g, CX, FEET_Y, 44, 12);
  for (let i = -1; i <= 1; i++) {
    const x = CX + i * 14;
    isoCylinder(g, x, FEET_Y, 3, 3, 20, 0xa1887f, 0x6d4c41);
    g.fillStyle(0x8d6e63, 1);
    g.fillRect(x - 8, FEET_Y - 18, 16, 4);
    g.fillRect(x - 8, FEET_Y - 10, 16, 4);
    g.lineStyle(1, 0x5d4037, 0.5);
    g.lineBetween(x - 8, FEET_Y - 18, x + 8, FEET_Y - 18);
  }
}

function drawHayBale(g: Phaser.GameObjects.Graphics): void {
  isoShadow(g, CX, FEET_Y, 30, 11);
  isoCylinder(g, CX, FEET_Y, 16, 10, 14, 0xffca28, 0xffa000);
  g.lineStyle(1, 0xe65100, 0.45);
  for (let i = -2; i <= 2; i++) {
    g.lineBetween(CX - 12 + i * 5, FEET_Y - 16, CX - 8 + i * 5, FEET_Y - 4);
  }
  g.fillStyle(0xfff59d, 0.5);
  g.fillEllipse(CX, FEET_Y - 14, 14, 4);
}

// ——— Registry ———

const CROP_DRAWERS: Record<
  number,
  (g: Phaser.GameObjects.Graphics, s: 'seed' | 'grow' | 'ripe') => void
> = {
  1: drawCropBarley,
  2: drawCropCarrot,
  3: drawCropWheat,
  4: drawCropTomato,
  5: drawCropPumpkin,
};

const ANIMAL_DRAWERS: Record<number, (g: Phaser.GameObjects.Graphics) => void> = {
  1: drawCow,
  2: drawSheep,
  3: drawHen,
};

const FACTORY_DRAWERS: Record<number, (g: Phaser.GameObjects.Graphics) => void> = {
  1: drawCheesePress,
  2: drawBarn,
  3: drawWoolSpinner,
  4: drawBakery,
};

const DECORATION_DRAWERS: Record<number, (g: Phaser.GameObjects.Graphics) => void> = {
  1: drawSunflowerPatch,
  2: drawWoodenFence,
  3: drawHayBale,
};

function buildSpecs(): SpriteSpec[] {
  const specs: SpriteSpec[] = [];

  for (const id of CROP_TYPE_IDS) {
    const draw = CROP_DRAWERS[id] ?? drawCropBarley;
    for (const stage of ['seed', 'grow', 'ripe'] as const) {
      specs.push({
        key: `farm-crop-${id}-${stage}`,
        draw: (g) => draw(g, stage),
      });
    }
  }

  for (const id of ANIMAL_TYPE_IDS) {
    const draw = ANIMAL_DRAWERS[id] ?? drawCow;
    specs.push({ key: `farm-animal-${id}`, draw });
    if (id === 1) {
      specs.push({ key: 'farm-animal-cow', draw });
    }
  }

  for (const id of FACTORY_TYPE_IDS) {
    const draw = FACTORY_DRAWERS[id] ?? drawCheesePress;
    specs.push({ key: `farm-factory-${id}`, draw });
    if (id === 1) {
      specs.push({ key: 'farm-factory-press', draw });
    }
  }

  for (const id of DECORATION_TYPE_IDS) {
    const draw = DECORATION_DRAWERS[id] ?? drawHayBale;
    specs.push({ key: `farm-decoration-${id}`, draw });
  }

  return specs;
}

const SPECS = buildSpecs();

export const FARM_PROCEDURAL_REGISTRY_KEY = 'farmProceduralTextureKeys';

function markProceduralKey(scene: Phaser.Scene, key: string): void {
  const set =
    (scene.registry.get(FARM_PROCEDURAL_REGISTRY_KEY) as Set<string> | undefined) ??
    new Set<string>();
  set.add(key);
  scene.registry.set(FARM_PROCEDURAL_REGISTRY_KEY, set);
}

export function isProceduralFarmTexture(scene: Phaser.Scene, key: string): boolean {
  const set = scene.registry.get(FARM_PROCEDURAL_REGISTRY_KEY) as Set<string> | undefined;
  return set?.has(key) ?? false;
}

function refineProceduralTexture(scene: Phaser.Scene, key: string): void {
  const texture = scene.textures.get(key);
  const source = texture.getSourceImage() as HTMLCanvasElement | HTMLImageElement | null;
  if (!source || !('width' in source) || source.width < 1) {
    return;
  }

  const canvas =
    source instanceof HTMLCanvasElement
      ? source
      : (() => {
          const c = document.createElement('canvas');
          c.width = source.width;
          c.height = source.height;
          const ctx = c.getContext('2d');
          if (!ctx) {
            return null;
          }
          ctx.drawImage(source, 0, 0);
          return c;
        })();
  if (!canvas) {
    return;
  }

  const trimmed = trimCanvasToContent(canvas);
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }
  scene.textures.addCanvas(key, trimmed);
  scene.registry.set(`${FARM_SPRITE_ANCHOR_PREFIX}${key}`, computeSpriteAnchor(trimmed));
  setFarmSpriteFootMetrics(scene, key, measureSpriteFootMetrics(trimmed));
}

/** Draws procedural textures only for keys without a loaded PNG. */
export function registerFarmProceduralSprites(scene: Phaser.Scene): void {
  for (const spec of SPECS) {
    if (scene.textures.exists(spec.key) && !isProceduralFarmTexture(scene, spec.key)) {
      continue;
    }
    if (scene.textures.exists(spec.key)) {
      scene.textures.remove(spec.key);
    }
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    spec.draw(g);
    g.generateTexture(spec.key, TEX_W, TEX_H);
    g.destroy();
    refineProceduralTexture(scene, spec.key);
    markProceduralKey(scene, spec.key);
  }
}

/** Call from FarmScene if textures were lost or scene started early. */
export function ensureFarmProceduralSprites(scene: Phaser.Scene): void {
  registerFarmProceduralSprites(scene);
}

/** @deprecated Use registerFarmProceduralSprites */
export const registerFarmSpriteFallbacks = registerFarmProceduralSprites;

export function hasFarmSprite(scene: Phaser.Scene, key: string): boolean {
  return scene.textures.exists(key);
}
