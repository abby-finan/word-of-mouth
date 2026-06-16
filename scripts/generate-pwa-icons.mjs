import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import toIco from "to-ico";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const SPLASH_DIR = path.join(PUBLIC_DIR, "splash");
const MASTER_SIZE = 1024;

const BRAND = {
  cream: "#faf9f7",
  coral: "#e3735e",
  creamRgb: { r: 250, g: 249, b: 247 },
  coralRgb: { r: 227, g: 115, b: 94 },
};

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

/**
 * Geometric WOM wordmark — clarity-first, not Cubao.
 * Normalized paths in a 1000×420 box, centered in the canvas.
 */
function geometricPaths(size, { maskable = false } = {}) {
  const inset = size * (maskable ? 0.18 : 0.1);
  const inner = size - inset * 2;

  const stemBoost = size <= 16 ? 1.28 : size <= 32 ? 1.18 : size <= 48 ? 1.08 : 1;
  const wordW = inner * 0.76;
  const wordH = inner * 0.5 * Math.min(stemBoost, 1.15);
  const x0 = (size - wordW) / 2;
  const y0 = (size - wordH) / 2 - size * 0.012;

  const gap = wordW * 0.045;
  const cell = (wordW - gap * 2) / 3;
  const stem = wordH * 0.24 * stemBoost;
  const midY = y0 + wordH * 0.56;

  const wx = x0;
  const ox = x0 + cell + gap;
  const mx = x0 + (cell + gap) * 2;

  const w = `
    M ${wx} ${y0 + wordH}
    L ${wx} ${y0}
    L ${wx + stem} ${y0}
    L ${wx + cell * 0.5} ${midY}
    L ${wx + cell - stem} ${y0}
    L ${wx + cell} ${y0}
    L ${wx + cell} ${y0 + wordH}
    L ${wx + cell - stem} ${y0 + wordH}
    L ${wx + cell - stem} ${midY + wordH * 0.12}
    L ${wx + cell * 0.5} ${y0 + wordH}
    L ${wx + stem} ${midY + wordH * 0.12}
    L ${wx + stem} ${y0 + wordH}
    Z`;

  const oOuterR = Math.min(cell, wordH) * 0.46;
  const oInnerR = oOuterR * (size <= 32 ? 0.38 : 0.42);
  const ocx = ox + cell * 0.5;
  const ocy = y0 + wordH * 0.5;

  const o = `
    M ${ocx - oOuterR} ${ocy}
    A ${oOuterR} ${oOuterR} 0 1 0 ${ocx + oOuterR} ${ocy}
    A ${oOuterR} ${oOuterR} 0 1 0 ${ocx - oOuterR} ${ocy}
    M ${ocx - oInnerR} ${ocy}
    A ${oInnerR} ${oInnerR} 0 1 1 ${ocx + oInnerR} ${ocy}
    A ${oInnerR} ${oInnerR} 0 1 1 ${ocx - oInnerR} ${ocy}
    Z`;

  const m = `
    M ${mx} ${y0 + wordH}
    L ${mx} ${y0}
    L ${mx + stem} ${y0}
    L ${mx + cell * 0.5} ${y0 + wordH * 0.44}
    L ${mx + cell - stem} ${y0}
    L ${mx + cell} ${y0}
    L ${mx + cell} ${y0 + wordH}
    L ${mx + cell - stem} ${y0 + wordH}
    L ${mx + cell - stem} ${y0 + wordH * 0.56}
    L ${mx + cell * 0.5} ${y0 + wordH}
    L ${mx + stem} ${y0 + wordH * 0.56}
    L ${mx + stem} ${y0 + wordH}
    Z`;

  return `${w} ${o} ${m}`;
}

function buildIconSvg(size, options = {}) {
  const paths = geometricPaths(size, options);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BRAND.cream}"/>
  <path d="${paths}" fill="${BRAND.coral}" fill-rule="evenodd"/>
</svg>`;
}

async function renderIcon(size, options = {}) {
  const svg = buildIconSvg(size, options);

  return quantizeBrandColors(
    await sharp(Buffer.from(svg)).png().toBuffer(),
    size,
    size
  );
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

const masterSvg = buildIconSvg(MASTER_SIZE);
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

console.log("Generated clarity-first geometric WOM icons.");
