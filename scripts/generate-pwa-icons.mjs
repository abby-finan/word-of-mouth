import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import toIco from "to-ico";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const SPLASH_DIR = path.join(PUBLIC_DIR, "splash");
const FONT_PATH = path.join(PUBLIC_DIR, "fonts", "Cubao-Free-Wide.otf");

const BRAND = {
  cream: "#faf9f7",
  terracotta: "#c9a99a",
};

function buildWomSvg(size, { maskable = false, fontBase64 = null } = {}) {
  const fontSize = size * (maskable ? 0.34 : 0.46);
  const letterSpacing = fontSize * -0.035;
  const fontFace = fontBase64
    ? `@font-face{font-family:Cubao;src:url(data:font/opentype;base64,${fontBase64}) format("opentype");font-weight:400;font-style:normal;}`
    : `@font-face{font-family:Cubao;src:url("file://${FONT_PATH.replace(/\\/g, "/")}") format("opentype");font-weight:400;font-style:normal;}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BRAND.cream}"/>
  <defs>
    <style>
      ${fontFace}
      .wom {
        font-family: Cubao, sans-serif;
        font-size: ${fontSize}px;
        font-weight: 400;
        fill: ${BRAND.terracotta};
      }
    </style>
  </defs>
  <text
    x="50%"
    y="50%"
    text-anchor="middle"
    dominant-baseline="central"
    class="wom"
    letter-spacing="${letterSpacing}"
  >WOM</text>
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

const fontBuffer = await readFile(FONT_PATH);
const fontBase64 = fontBuffer.toString("base64");

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

await writeFile(
  path.join(PUBLIC_DIR, "favicon.svg"),
  buildWomSvg(512, { fontBase64 })
);

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

console.log("Generated WOM brand icons (favicon, PWA, splash).");
