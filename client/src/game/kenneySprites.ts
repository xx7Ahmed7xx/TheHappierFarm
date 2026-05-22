/** Maps gameplay needs → Kenney manifest texture ids (filename heuristics). */

export interface KenneyManifestFile {
  id: string;
  rel: string;
  tags: string[];
}

export interface KenneyManifest {
  version: number;
  baseUrl: string;
  tileSize?: { width: number; height: number };
  files: KenneyManifestFile[];
}

export interface KenneyResolver {
  ready: boolean;
  pickSoil(): string | null;
  pickGrass(): string | null;
  /** Kenney crop prop when a dedicated stage sprite exists (optional layer above color tile). */
  pickCropStage(cropTypeId: number, phase: string): string | null;
  pickPlacement(kind: string, typeId: number | null): string | null;
  allIds(): string[];
}

function cropKenneyStage(
  files: KenneyManifestFile[],
  phase: string,
  variant: 'corn' | 'young' | 'double',
): string | null {
  if (phase === 'Seedling' || phase === 'Growing') {
    if (variant === 'young') {
      return (
        pickByPatterns(files, ['cornyoung'], ['double']) ??
        pickByPatterns(files, ['cornyoungdouble'], [])
      );
    }
    return (
      pickByPatterns(files, ['cornyoungdouble'], []) ??
      pickByPatterns(files, ['cornyoung'], ['double'])
    );
  }
  if (phase === 'Mature') {
    return pickByPatterns(files, ['corn'], ['young', 'double']);
  }
  if (phase === 'Ripe') {
    if (variant === 'double') {
      return (
        pickByPatterns(files, ['corndouble'], []) ??
        pickByPatterns(files, ['corn'], ['young', 'double'])
      );
    }
    return pickByPatterns(files, ['corn'], ['young', 'double']);
  }
  return null;
}

const VIEW_SUFFIXES = ['_S.png', '_E.png', '_W.png', '_N.png'];

function viewScore(rel: string): number {
  const n = rel.toLowerCase();
  for (let i = 0; i < VIEW_SUFFIXES.length; i++) {
    if (n.endsWith(VIEW_SUFFIXES[i])) {
      return i;
    }
  }
  return VIEW_SUFFIXES.length;
}

function pickByPatterns(
  files: KenneyManifestFile[],
  includes: string[],
  excludes: string[] = [],
): string | null {
  const hits = files.filter((f) => {
    const n = f.rel.toLowerCase();
    if (!includes.every((p) => n.includes(p))) {
      return false;
    }
    return !excludes.some((p) => n.includes(p));
  });

  hits.sort((a, b) => viewScore(a.rel) - viewScore(b.rel));
  return hits[0]?.id ?? null;
}

export function createKenneyResolver(manifest: KenneyManifest | null | undefined): KenneyResolver {
  const files = manifest?.files ?? [];

  return {
    ready: files.length > 0,
    allIds: () => files.map((f) => f.id),

    pickSoil: () => pickByPatterns(files, ['dirtfarmland'], ['young', 'double', 'corner']),

    pickGrass: () =>
      pickByPatterns(files, ['grass'], ['patch', 'tile']) ??
      pickByPatterns(files, ['dirtfarmland'], ['young', 'double']),

    pickCropStage: (cropTypeId, phase) => {
      if (phase === 'Empty') {
        return null;
      }

      const variant =
        cropTypeId === 1 || cropTypeId === 3
          ? 'corn'
          : cropTypeId === 5
            ? 'double'
            : 'young';
      return cropKenneyStage(files, phase, variant);
    },

    pickPlacement: (kind, typeId) => {
      if (typeId == null) {
        return null;
      }

      if (kind === 'decoration') {
        if (typeId === 1) {
          return pickByPatterns(files, ['corn'], ['young', 'double']);
        }
        if (typeId === 2) {
          return pickByPatterns(files, ['fencelow'], ['broken', 'high']);
        }
        if (typeId === 3) {
          return pickByPatterns(files, ['haybales'], ['stacked']);
        }
      }

      if (kind === 'factory') {
        if (typeId === 2) {
          return (
            pickByPatterns(files, ['roofcorner'], []) ??
            pickByPatterns(files, ['plankshigh'], ['old', 'slope', 'hole'])
          );
        }
        if (typeId === 3) {
          return pickByPatterns(files, ['haybales'], ['stacked']);
        }
        if (typeId === 4) {
          return pickByPatterns(files, ['haybalesstacked'], []);
        }
        return pickByPatterns(files, ['plankshigh'], ['old', 'slope', 'hole']);
      }

      if (kind === 'animal') {
        if (typeId === 3) {
          return pickByPatterns(files, ['cornyoung'], ['double']);
        }
        if (typeId === 2) {
          return pickByPatterns(files, ['hay'], []);
        }
        return pickByPatterns(files, ['haybales'], ['stacked']);
      }

      return null;
    },
  };
}

export function kenneyDisplayScale(targetTopWidth: number, tileWidth = 256): number {
  return targetTopWidth / tileWidth;
}
