import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "..", "public", "icons");
const background = { r: 7, g: 11, b: 26, alpha: 1 };

const logoSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="brand" x1="18%" y1="12%" x2="82%" y2="88%">
      <stop offset="0%" stop-color="#786eff"/>
      <stop offset="100%" stop-color="#5e5ce6"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="58%">
      <stop offset="0%" stop-color="#9aa4ff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#070b1a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="#070b1a"/>
  <circle cx="256" cy="256" r="220" fill="url(#glow)"/>
  <circle cx="256" cy="256" r="148" fill="url(#brand)"/>
  <path d="M176 286c0-58 34-94 80-94 36 0 58 20 62 52h-52c-3-14-14-22-30-22-28 0-44 24-44 64s16 64 44 64c16 0 27-8 30-22h52c-4 32-26 52-62 52-46 0-80-36-80-94z" fill="#ffffff"/>
  <path d="M318 204h48v164h-48z" fill="#ffffff"/>
</svg>`;

const svgBuffer = Buffer.from(logoSvg);

await mkdir(iconsDir, { recursive: true });

for (const size of [192, 512]) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(path.join(iconsDir, `pwa-${size}.png`));
}

await sharp(svgBuffer)
  .resize(410, 410)
  .extend({
    top: 51,
    bottom: 51,
    left: 51,
    right: 51,
    background,
  })
  .png()
  .toFile(path.join(iconsDir, "pwa-512-maskable.png"));

console.log("PWA icons generated in public/icons");
