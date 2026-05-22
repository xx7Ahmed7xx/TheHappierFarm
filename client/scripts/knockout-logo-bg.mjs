/**
 * Makes near-black pixels transparent on the brand PNG (AI logos often ship with a black matte).
 * Usage: node scripts/knockout-logo-bg.mjs [input.png] [output.png]
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const input = process.argv[2] ?? join(root, 'public/assets/brand/happier-farm-logo.png');
const output = process.argv[3] ?? input;

if (!existsSync(input)) {
  console.warn(`[knockout-logo-bg] skip — not found: ${input}`);
  process.exit(0);
}

const buf = readFileSync(input);
const png = PNG.sync.read(buf);

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const i = (png.width * y + x) << 2;
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    const lum = (r * 299 + g * 587 + b * 114) / 1000;
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const sat = maxC - minC;
    if (lum < 55 || (r < 60 && g < 60 && b < 60)) {
      png.data[i + 3] = 0;
    } else if (lum < 90 && sat < 35) {
      png.data[i + 3] = Math.min(png.data[i + 3], Math.round((lum - 50) * 5));
    }
  }
}

writeFileSync(output, PNG.sync.write(png));
console.log(`[knockout-logo-bg] wrote ${output}`);
