// Regenerate public/og-image.png from public/og-image.svg.
// The SVG is the editable source of truth; this rasterizes it to the PNG that
// the OG / Twitter meta tags point to (1200x630). Run: `npm run og:image`.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'public/og-image.svg');
const out = join(root, 'public/og-image.png');

// Rasterize at 2x density for crisp edges/text, then downsample to exact OG size.
await sharp(readFileSync(src), { density: 144 })
  .resize(1200, 630, { fit: 'fill' })
  .png({ compressionLevel: 9 })
  .toFile(out);

console.log('Wrote public/og-image.png (1200x630) from public/og-image.svg');
