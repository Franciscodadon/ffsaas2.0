// Generates assets/logo.placeholder.png (1904x1967) using only Node built-ins.
// Dark #08090b background (mostly transparent) with a solid #3b82f6 rounded square centred.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'assets/logo.placeholder.png');

const W = 1904, H = 1967;
const BG = [0x08, 0x09, 0x0b, 0x40];   // #08090b, mostly transparent
const FG = [0x3b, 0x82, 0xf6, 0xff];   // #3b82f6, solid

// Rounded square geometry.
const size = Math.round(Math.min(W, H) * 0.62);
const radius = Math.round(size * 0.22);
const x0 = Math.round((W - size) / 2), y0 = Math.round((H - size) / 2);
const x1 = x0 + size - 1, y1 = y0 + size - 1;

function inside(x, y) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = x < x0 + radius ? x0 + radius : x > x1 - radius ? x1 - radius : x;
  const cy = y < y0 + radius ? y0 + radius : y > y1 - radius ? y1 - radius : y;
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

// Raw scanlines: filter byte 0 + RGBA per pixel.
const stride = 1 + W * 4;
const raw = Buffer.alloc(stride * H);
for (let y = 0; y < H; y++) {
  const row = y * stride;
  raw[row] = 0;
  for (let x = 0; x < W; x++) {
    const px = inside(x, y) ? FG : BG;
    const o = row + 1 + x * 4;
    raw[o] = px[0]; raw[o + 1] = px[1]; raw[o + 2] = px[2]; raw[o + 3] = px[3];
  }
}

// CRC32 (IEEE) for PNG chunks.
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const typeData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(typeData));
  return Buffer.concat([len, typeData, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // colour type: RGBA
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, png);
console.log(`Wrote ${OUT} (${W}x${H}, ${png.length} bytes)`);
