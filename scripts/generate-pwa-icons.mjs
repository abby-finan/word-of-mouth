import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import opentype from "opentype.js";
import sharp from "sharp";
import toIco from "to-ico";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const SPLASH_DIR = path.join(PUBLIC_DIR, "splash");
const FONT_PATH = path.join(PUBLIC_DIR, "fonts", "Cubao-Free-Wide.otf");

/** Match BrandBackground: cream bg + Cubao + brand-coral text */
const BRAND = {
  cream: "#faf9f7",
  coral: "#e3735e",
};

const font = opentype.parse(readFileSync(FONT_PATH));

function buildWomSvg(size, { maskable = false } = {}) {
  const inset = size * (maskable ? 0.18 : 0.14);
  const maxWidth = size - inset * 2;
  const maxHeight = size - inset * 2;
  const letterSpacing = -0.035;
  const safety = 0.92;

  let fontSize = size * (maskable ? 0.36 : 0.48);
  let textPath = font.getPath("WOM", 0, 0, fontSize, { letterSpacing });
  let bbox = textPath.getBoundingBox();
  let textWidth = bbox.x2 - bbox.x1;
  let textHeight = bbox.y2 - bbox.y1;

  const scale = Math.min(maxWidth / textWidth, maxHeight / textHeight, 1) * safety;
  fontSize *= scale;

  textPath = font.getPath("WOM", 0, 0, fontSize, { letterSpacing });
  bbox = textPath.getBoundingBox();
  textWidth = bbox.x2 - bbox.x1;
  textHeight = bbox.y2 - bbox.y1;
  const tx = (size - textWidth) / 2 - bbox.x1;
  const ty = (size - textHeight) / 2 - bbox.y1;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BRAND.cream}"/>
  <g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)})">
    <path d="${textPath.toPathData(3)}" fill="${BRAND.coral}"/>
  </g>
</svg>`;
}

async function renderIcon(size, options = {}) {
  const svg = buildWomSvg(size, options);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function renderSplash(width, height) {
  const iconSize = Math.round(Math.min(width, height) * 0.2);
  const icon = await renderIcon(iconSize);

  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: BRAND.cream,
    },
  })
    .composite([
      {
        input: icon,
        top: Math.round((height - iconSize) / 2),
        left: Math.round((width - iconSize) / 2),
      },
    ])
    .png()
    .toBuffer();
}

await mkdir(SPLASH_DIR, { recursive: true });

const rootIcons = [
  ["icon-192x192.png", 192, {}],
  ["icon-512x512.png", 512, {}],
  ["icon-maskable-512x512.png", 512, { maskable: true }],
  ["apple-touch-icon.png", 180, {}],
];

for (const [filename, size, options] of rootIcons) {
  const buffer = await renderIcon(size, options);
  await writeFile(path.join(PUBLIC_DIR, filename), buffer);
}

const faviconSizes = [16, 32, 48];
const faviconPngs = await Promise.all(faviconSizes.map((size) => renderIcon(size)));
await writeFile(path.join(PUBLIC_DIR, "favicon.ico"), await toIco(faviconPngs));

await writeFile(path.join(PUBLIC_DIR, "favicon.svg"), buildWomSvg(512));

const splashes = [
  ["iphone-se.png", 750, 1334],
  ["iphone-12.png", 1170, 2532],
  ["iphone-14-pro-max.png", 1290, 2796],
];

const startupImages = [];

for (const [filename, width, height] of splashes) {
  const buffer = await renderSplash(width, height);
  await writeFile(path.join(SPLASH_DIR, filename), buffer);
  startupImages.push({
    filename,
    media:
      filename === "iphone-se.png"
        ? "(device-width: 375px) and (device-height: 667px)"
        : filename === "iphone-12.png"
          ? "(device-width: 390px) and (device-height: 844px)"
          : "(device-width: 430px) and (device-height: 932px)",
  });
}

await writeFile(
  path.join(ROOT, "src", "lib", "pwa-startup-images.json"),
  JSON.stringify(startupImages, null, 2)
);

console.log("Generated WOM brand icons with Cubao paths (favicon, PWA, splash).");
