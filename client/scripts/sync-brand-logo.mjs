/**
 * Copies the hand-edited source logo into the served asset (no pixel processing).
 * Edit: public/assets/brand/happier-farm-logo-source.png
 * Served: public/assets/brand/happier-farm-logo.png
 */
import { copyFileSync, existsSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const source = join(root, 'public/assets/brand/happier-farm-logo-source.png');
const dest = join(root, 'public/assets/brand/happier-farm-logo.png');

if (!existsSync(source)) {
  console.warn('[sync-brand-logo] skip — missing happier-farm-logo-source.png');
  process.exit(0);
}

copyFileSync(source, dest);
const { mtimeMs } = statSync(dest);
console.log(`[sync-brand-logo] ${dest} (${Math.round(mtimeMs)})`);
