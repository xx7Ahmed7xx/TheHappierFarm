/**
 * Copies farm PNG sprites into public/assets/farm for Vite dev + build.
 * Never fails the npm script — missing sources only log a warning (procedural fallbacks exist).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(clientRoot, '..');
const dest = path.join(clientRoot, 'public', 'assets', 'farm');

const cursorAssets = path.join(
  process.env.USERPROFILE ?? '',
  '.cursor',
  'projects',
  'c-Users-ahmad-Desktop-The-Happier-Farm',
  'assets',
);

const sources = [
  process.env.FARM_SPRITE_SRC,
  path.join(clientRoot, 'public', 'assets', 'farm'),
  path.join(clientRoot, 'dist', 'assets', 'farm'),
  path.join(repoRoot, '.cursor', 'projects', 'c-Users-ahmad-Desktop-The-Happier-Farm', 'assets'),
  cursorAssets,
].filter(Boolean);

/** Legacy short filenames → canonical farm-* keys. */
const legacyNames = [
  ['crop-1-seed.png', 'farm-crop-1-seed.png'],
  ['crop-1-grow.png', 'farm-crop-1-grow.png'],
  ['crop-1-ripe.png', 'farm-crop-1-ripe.png'],
  ['crop-2-seed.png', 'farm-crop-2-seed.png'],
  ['crop-2-grow.png', 'farm-crop-2-grow.png'],
  ['crop-2-ripe.png', 'farm-crop-2-ripe.png'],
  ['crop-3-seed.png', 'farm-crop-3-seed.png'],
  ['crop-3-grow.png', 'farm-crop-3-grow.png'],
  ['crop-3-ripe.png', 'farm-crop-3-ripe.png'],
  ['crop-4-seed.png', 'farm-crop-4-seed.png'],
  ['crop-4-grow.png', 'farm-crop-4-grow.png'],
  ['crop-4-ripe.png', 'farm-crop-4-ripe.png'],
  ['crop-5-seed.png', 'farm-crop-5-seed.png'],
  ['crop-5-grow.png', 'farm-crop-5-grow.png'],
  ['crop-5-ripe.png', 'farm-crop-5-ripe.png'],
  ['animal-cow.png', 'farm-animal-cow.png'],
  ['animal-1.png', 'farm-animal-1.png'],
  ['animal-2.png', 'farm-animal-2.png'],
  ['animal-3.png', 'farm-animal-3.png'],
  ['factory-press.png', 'farm-factory-press.png'],
  ['factory-1.png', 'farm-factory-1.png'],
  ['factory-2.png', 'farm-factory-2.png'],
  ['factory-3.png', 'farm-factory-3.png'],
  ['factory-4.png', 'farm-factory-4.png'],
];

const legacySet = new Set(legacyNames.map(([from]) => from));

/** Real game sprites only — excludes Cursor chat screenshot PNGs (c__Users_*). */
function isAllowedSpriteBasename(base) {
  if (/^c__Users_/i.test(base)) {
    return false;
  }
  if (base.startsWith('farm-')) {
    return true;
  }
  if (/^bg-(boot|login|register)\.png$/i.test(base)) {
    return true;
  }
  if (/happier-farm-logo/i.test(base)) {
    return true;
  }
  return legacySet.has(base);
}

function collectPngs(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.png') && isAllowedSpriteBasename(f))
    .map((f) => path.join(dir, f));
}

const byName = new Map();

for (const srcDir of sources) {
  for (const file of collectPngs(srcDir)) {
    const base = path.basename(file);
    let canonical = base;
    const legacy = legacyNames.find(([from]) => from === base);
    if (legacy) {
      canonical = legacy[1];
    }
    if (!isAllowedSpriteBasename(canonical)) {
      continue;
    }
    if (!byName.has(canonical)) {
      byName.set(canonical, file);
    }
    if (base.startsWith('farm-') && !byName.has(base)) {
      byName.set(base, file);
    }
  }
}

fs.mkdirSync(dest, { recursive: true });

/** Remove screenshot PNGs that were copied before the filter existed. */
let removed = 0;
for (const f of fs.readdirSync(dest)) {
  if (/^c__Users_/i.test(f)) {
    fs.unlinkSync(path.join(dest, f));
    removed++;
  }
}

if (byName.size === 0) {
  console.warn(
    '[farm-sprites] No PNG sources found. Game uses procedural sprites until you add files to public/assets/farm/',
  );
  if (removed > 0) {
    console.log(`[farm-sprites] removed ${removed} stray screenshot file(s) from public/assets/farm/`);
  }
  process.exit(0);
}

let copied = 0;
for (const [name, src] of byName) {
  const out = path.join(dest, name);
  if (!fs.existsSync(out) || fs.statSync(src).mtimeMs > fs.statSync(out).mtimeMs) {
    fs.copyFileSync(src, out);
    copied++;
  }
}

const aliases = [
  ['farm-factory-press.png', 'farm-factory-1.png'],
  ['farm-animal-cow.png', 'farm-animal-1.png'],
];
for (const [from, to] of aliases) {
  const src = path.join(dest, from);
  const out = path.join(dest, to);
  if (
    fs.existsSync(src) &&
    (!fs.existsSync(out) || fs.statSync(src).mtimeMs >= fs.statSync(out).mtimeMs)
  ) {
    fs.copyFileSync(src, out);
    copied++;
  }
}

const removedNote = removed > 0 ? `, ${removed} screenshot(s) removed` : '';
console.log(
  `[farm-sprites] ${byName.size} sprite(s) available, ${copied} copied → public/assets/farm/${removedNote}`,
);
