import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(PROJECT_ROOT, "electron", "icon.svg");
const OUT_ICO = path.join(PROJECT_ROOT, "electron", "icon.ico");
const OUT_PNG = path.join(PROJECT_ROOT, "electron", "icon.png");
const SIZES = [16, 32, 48, 256];

async function main() {
  const svg = fs.readFileSync(SRC);
  const pngBuffers = await Promise.all(
    SIZES.map((size) =>
      sharp(svg, { density: 72 * (size / 36) })
        .resize(size, size)
        .ensureAlpha()
        .png()
        .toBuffer()
    )
  );

  fs.writeFileSync(OUT_PNG, await sharp(svg, { density: 72 * (512 / 36) }).resize(512, 512).png().toBuffer());

  const numImages = pngBuffers.length;
  const headerSize = 6 + 16 * numImages;
  let offset = headerSize;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(numImages, 4);

  const dirEntries = [];
  for (let i = 0; i < numImages; i++) {
    const size = SIZES[i];
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0); // width
    entry.writeUInt8(size === 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bit count
    entry.writeUInt32LE(buf.length, 8); // bytes in resource
    entry.writeUInt32LE(offset, 12); // offset
    offset += buf.length;
    dirEntries.push(entry);
  }

  const ico = Buffer.concat([header, ...dirEntries, ...pngBuffers]);
  fs.writeFileSync(OUT_ICO, ico);
  console.log(`Ícone gerado: ${OUT_ICO} (${ico.length} bytes, ${numImages} tamanhos)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
