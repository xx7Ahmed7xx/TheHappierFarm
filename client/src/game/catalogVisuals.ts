/** Client-side display metadata for catalog ids (shop, inventory, sprites). */

export interface CropVisual {
  emoji: string;
  accent: string;
  accentDark: string;
}

const CROP_VISUALS: Record<number, CropVisual> = {
  1: { emoji: '🌾', accent: '#c5a038', accentDark: '#8d6e21' },
  2: { emoji: '🥕', accent: '#ff8f00', accentDark: '#e65100' },
  3: { emoji: '🌾', accent: '#e6c34a', accentDark: '#9e7b1a' },
  4: { emoji: '🍅', accent: '#e53935', accentDark: '#b71c1c' },
  5: { emoji: '🎃', accent: '#ff9800', accentDark: '#e65100' },
};

const ANIMAL_EMOJI: Record<number, string> = {
  1: '🐄',
  2: '🐑',
  3: '🐔',
};

const FACTORY_EMOJI: Record<number, string> = {
  1: '🧀',
  2: '🏚️',
  3: '🧶',
  4: '🍞',
};

const RESOURCE_LABELS: Record<string, { emoji: string; name: string }> = {
  barley: { emoji: '🌾', name: 'Barley' },
  carrot: { emoji: '🥕', name: 'Carrot' },
  wheat: { emoji: '🌾', name: 'Wheat' },
  tomato: { emoji: '🍅', name: 'Tomato' },
  pumpkin: { emoji: '🎃', name: 'Pumpkin' },
  milk: { emoji: '🥛', name: 'Milk' },
  egg: { emoji: '🥚', name: 'Egg' },
  wool: { emoji: '🧶', name: 'Wool' },
  cheese: { emoji: '🧀', name: 'Cheese' },
  yarn: { emoji: '🧵', name: 'Yarn' },
  bread: { emoji: '🍞', name: 'Bread' },
};

export function cropVisual(cropTypeId: number): CropVisual {
  return (
    CROP_VISUALS[cropTypeId] ?? {
      emoji: '🌱',
      accent: '#7cb342',
      accentDark: '#558b2f',
    }
  );
}

export function animalEmoji(animalTypeId: number): string {
  return ANIMAL_EMOJI[animalTypeId] ?? '🐾';
}

export function factoryEmoji(factoryTypeId: number, isBarn = false): string {
  if (isBarn) {
    return '🏚️';
  }
  return FACTORY_EMOJI[factoryTypeId] ?? '🏭';
}

export function resourceDisplay(code: string): { emoji: string; name: string } {
  const key = code.trim().toLowerCase();
  return (
    RESOURCE_LABELS[key] ?? {
      emoji: '📦',
      name: key.charAt(0).toUpperCase() + key.slice(1),
    }
  );
}

export const CROP_TYPE_IDS = [1, 2, 3, 4, 5] as const;
export const ANIMAL_TYPE_IDS = [1, 2, 3] as const;
export const FACTORY_TYPE_IDS = [1, 2, 3, 4] as const;
export const DECORATION_TYPE_IDS = [1, 2, 3] as const;
