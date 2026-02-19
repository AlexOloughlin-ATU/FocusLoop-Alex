const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

// Simple Apple-ish icon: black rounded square with white "F"
const svg = (size, padding) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#111111"/>
  <text x="50%" y="56%" text-anchor="middle"
        font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial"
        font-size="${Math.round(size * 0.52)}"
        fill="#ffffff" font-weight="700">F</text>
</svg>
`;

async function makeIcon(name, size) {
  const file = path.join(outDir, name);
  await sharp(Buffer.from(svg(size)))
    .png()
    .toFile(file);
  console.log("Created", file);
}

async function makeMaskable(name, size) {
  // Maskable icons should have safe padding so the letter doesn't get cropped
  const file = path.join(outDir, name);
  const paddedSvg = `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${size}" height="${size}" fill="#111111"/>
    <g transform="translate(${Math.round(size * 0.10)}, ${Math.round(size * 0.10)})">
      <rect x="0" y="0" width="${Math.round(size * 0.80)}" height="${Math.round(size * 0.80)}"
            rx="${Math.round(size * 0.18)}" fill="#111111"/>
      <text x="50%" y="58%" text-anchor="middle"
            font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial"
            font-size="${Math.round(size * 0.42)}"
            fill="#ffffff" font-weight="700"
            dominant-baseline="middle">${"F"}</text>
    </g>
  </svg>
  `;
  await sharp(Buffer.from(paddedSvg)).png().toFile(file);
  console.log("Created", file);
}

(async () => {
  await makeIcon("icon-192.png", 192);
  await makeIcon("icon-512.png", 512);
  await makeMaskable("icon-192-maskable.png", 192);
  await makeMaskable("icon-512-maskable.png", 512);
  console.log("Done ✅");
})();