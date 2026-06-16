import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const ICONS_DIR = path.join(ROOT, "public", "icons");
const SPLASH_DIR = path.join(ROOT, "public", "splash");
const FAVICON = path.join(ROOT, "public", "favicon.svg");

const BRAND = {
  cream: "#faf9f7",
  sage: "#8b9a7d",
};

async function renderIcon(size, { maskable = false } = {}) {
  const padding = maskable ? Math.round(size * 0.2) : Math.round(size * 0.12);
  const inner = size - padding * 2;
  const radius = Math.round(inner * 0.25);

  const iconSvg = await readFile(FAVICON, "utf8");
  const scaledIcon = await sharp(Buffer.from(iconSvg))
    .resize(inner, inner)
    .png()
    .toBuffer();

  const roundedMask = Buffer.from(
    `<svg width="${inner}" height="${inner}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${inner}" height="${inner}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>`
  );

  const iconWithRadius = await sharp(scaledIcon)
    .composite([{ input: roundedMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: maskable ? BRAND.sage : BRAND.cream,
    },
  })
    .composite([{ input: iconWithRadius, top: padding, left: padding }])
    .png()
    .toBuffer();
}

async function renderSplash(width, height) {
  const iconSize = Math.round(Math.min(width, height) * 0.18);
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

await mkdir(ICONS_DIR, { recursive: true });
await mkdir(SPLASH_DIR, { recursive: true });

const icons = [
  ["icon-192x192.png", 192, {}],
  ["icon-512x512.png", 512, {}],
  ["icon-maskable-512x512.png", 512, { maskable: true }],
  ["apple-touch-icon.png", 180, {}],
];

for (const [filename, size, options] of icons) {
  const buffer = await renderIcon(size, options);
  await writeFile(path.join(ICONS_DIR, filename), buffer);
}

const splashes = [
  ["iphone-se.png", 750, 1334, "portrait", "(device-width: 375px) and (device-height: 667px)"],
  ["iphone-12.png", 1170, 2532, "portrait", "(device-width: 390px) and (device-height: 844px)"],
  ["iphone-14-pro-max.png", 1290, 2796, "portrait", "(device-width: 430px) and (device-height: 932px)"],
];

const startupImages = [];

for (const [filename, width, height, orientation, media] of splashes) {
  const buffer = await renderSplash(width, height);
  await writeFile(path.join(SPLASH_DIR, filename), buffer);
  startupImages.push({ filename, media });
}

await writeFile(
  path.join(ROOT, "src", "lib", "pwa-startup-images.json"),
  JSON.stringify(startupImages, null, 2)
);

console.log("Generated PWA icons and splash screens.");
