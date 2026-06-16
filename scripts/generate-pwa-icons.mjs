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
const MASTER_SIZE = 1024;

/** Match BrandBackground: cream bg + Cubao + brand-coral text */
const BRAND = {
  cream: "#faf9f7",
  coral: "#e3735e",
  creamRgb: { r: 250, g: 249, b: 247 },
  coralRgb: { r: 227, g: 115, b: 94 },
};

const font = opentype.parse(readFileSync(FONT_PATH));

function colorDistance(r, g, b, target) {
  const dr = r - target.r;
  const dg = g - target.g;
  const db = b - target.b;
  return dr * dr + dg * dg + db * db;
}

async function quantizeBrandColors(buffer, width, height) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const pick =
      colorDistance(r, g, b, BRAND.creamRgb) <
      colorDistance(r, g, b, BRAND.coralRgb)
        ? BRAND.creamRgb
        : BRAND.coralRgb;

    data[i] = pick.r;
    data[i + 1] = pick.g;
    data[i + 2] = pick.b;
    if (info.channels === 4) data[i + 3] = 255;
  }

  return sharp(data, {
    raw: { width, height, channels: info.channels },
  })
    .flatten({ background: BRAND.cream })
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toBuffer();
}

function buildCubaoSvg(size, { maskable = false } = {}) {
  const inset = size * (maskable ? 0.16 : 0.07);
  const maxWidth = size - inset * 2;
  const maxHeight = size - inset * 2;
  const letterSpacing = -0.035;

  let fontSize = size * (maskable ? 0.4 : 0.56);
  let textPath = font.getPath("WOM", 0, 0, fontSize, { letterSpacing });
  let bbox = textPath.getBoundingBox();
  let textWidth = bbox.x2 - bbox.x1;
  let textHeight = bbox.y2 - bbox.y1;

  const scale = Math.min(maxWidth / textWidth, maxHeight / textHeight, 1);
  fontSize *= scale;

  textPath = font.getPath("WOM", 0, 0, fontSize, { letterSpacing });
  bbox = textPath.getBoundingBox();
  textWidth = bbox.x2 - bbox.x1;
  textHeight = bbox.y2 - bbox.y1;

  const tx = (size - textWidth) / 2 - bbox.x1;
  const ty = (size - textHeight) / 2 - bbox.y1 - size * 0.012;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BRAND.cream}"/>
  <g transform="translate(${tx.toFixed(4)}, ${ty.toFixed(4)})">
    <path d="${textPath.toPathData(5)}" fill="${BRAND.coral}"/>
  </g>
</svg>`;
}

async function renderIcon(size, options = {}) {
  const renderScale = size <= 48 ? 4 : 2;
  const renderSize = size * renderScale;
  const svg = buildCubaoSvg(renderSize, options);

  const raster = await sharp(Buffer.from(svg), {
    density: 72 * renderScale,
  })
    .resize(size, size, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  return quantizeBrandColors(raster, size, size);
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
    .png({ compressionLevel: 9 })
    .toBuffer();
}

await mkdir(SPLASH_DIR, { recursive: true });

const masterSvg = buildCubaoSvg(MASTER_SIZE);
await writeFile(path.join(PUBLIC_DIR, "wom-icon-master.svg"), masterSvg);
await writeFile(
  path.join(PUBLIC_DIR, "favicon.svg"),
  masterSvg.replace(
    `width="${MASTER_SIZE}" height="${MASTER_SIZE}" viewBox="0 0 ${MASTER_SIZE} ${MASTER_SIZE}"`,
    `viewBox="0 0 ${MASTER_SIZE} ${MASTER_SIZE}"`
  )
);

const exports = [
  ["favicon-32x32.png", 32, {}],
  ["icon-192x192.png", 192, {}],
  ["icon-512x512.png", 512, {}],
  ["icon-maskable-512x512.png", 512, { maskable: true }],
  ["apple-touch-icon.png", 180, {}],
];

for (const [filename, size, options] of exports) {
  await writeFile(path.join(PUBLIC_DIR, filename), await renderIcon(size, options));
}

const faviconSizes = [16, 32, 48];
const faviconPngs = await Promise.all(faviconSizes.map((size) => renderIcon(size)));
await writeFile(path.join(PUBLIC_DIR, "favicon.ico"), await toIco(faviconPngs));

const splashes = [
  ["iphone-se.png", 750, 1334],
  ["iphone-12.png", 1170, 2532],
  ["iphone-14-pro-max.png", 1290, 2796],
];

const startupImages = [];

for (const [filename, width, height] of splashes) {
  await writeFile(path.join(SPLASH_DIR, filename), await renderSplash(width, height));
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

console.log("Generated Cubao WOM icons (larger fit, all sizes).");
