#!/usr/bin/env node
// Sample dominant colors from a PNG screenshot and hint their design-system role.
// Usage: node palette.mjs <image.png> [--top 16] [--min-share 0.5] [--json]

import fs from 'node:fs';
import zlib from 'node:zlib';

const argv = process.argv.slice(2);
const file = argv.find((a) => !a.startsWith('--') && !/^\d+$/.test(a));
const top = Number(argValue('--top', 16));
const minShare = Number(argValue('--min-share', 0.05));
const asJson = argv.includes('--json');

function argValue(flag, fallback) {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

if (!file) {
  console.error('Usage: node palette.mjs <image.png> [--top 16] [--min-share 0.5] [--json]');
  process.exit(2);
}

function decodePng(buf) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) if (buf[i] !== sig[i]) throw new Error('not a PNG file');

  let off = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat = [];

  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    off += 12 + len;
  }

  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}; re-export as 8-bit PNG`);
  if (interlace !== 0) throw new Error('interlaced PNG is not supported; re-export without interlacing');
  if (colorType !== 2 && colorType !== 6) throw new Error(`unsupported color type ${colorType}; re-export as RGB or RGBA`);

  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(width * height * bpp);

  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = Buffer.from(line);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let val = cur[x];
      if (filter === 1) val = (val + a) & 0xff;
      else if (filter === 2) val = (val + b) & 0xff;
      else if (filter === 3) val = (val + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) val = (val + paeth(a, b, c)) & 0xff;
      else if (filter !== 0) throw new Error(`unknown PNG filter ${filter}`);
      cur[x] = val;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }

  return { width, height, data: out, bpp };
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function luminance(r, g, b) {
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function roleHint(r, g, b) {
  const L = luminance(r, g, b);
  const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  if (chroma >= 0.12) return 'accent / status';
  if (L < 0.01) return 'surface app / base';
  if (L < 0.035) return 'surface raised / active / border';
  if (L < 0.12) return 'border strong / surface (light)';
  if (L > 0.72) return 'text primary (dark) / surface (light)';
  if (L > 0.35) return 'text secondary / border';
  return 'text tertiary / border';
}

const img = decodePng(fs.readFileSync(file));
const step = Math.max(1, Math.floor(Math.sqrt((img.width * img.height) / 20000)));
const buckets = new Map();
let total = 0;

for (let y = 0; y < img.height; y += step) {
  for (let x = 0; x < img.width; x += step) {
    const o = y * img.width * img.bpp + x * img.bpp;
    const r = img.data[o], g = img.data[o + 1], b = img.data[o + 2];
    const a = img.bpp === 4 ? img.data[o + 3] : 255;
    if (a < 128) continue;
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const cur = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    cur.n++, cur.r += r, cur.g += g, cur.b += b;
    buckets.set(key, cur);
    total++;
  }
}

const colors = [...buckets.values()]
  .map((c) => {
    const r = Math.round(c.r / c.n), g = Math.round(c.g / c.n), b = Math.round(c.b / c.n);
    return { r, g, b, share: (c.n / total) * 100 };
  })
  .filter((c) => c.share >= minShare)
  .sort((a, b) => b.share - a.share)
  .slice(0, top)
  .map((c) => ({
    hex: '#' + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join(''),
    share: Number(c.share.toFixed(2)),
    luminance: Number(luminance(c.r, c.g, c.b).toFixed(3)),
    chroma: Number(((Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b)) / 255).toFixed(3)),
    role: roleHint(c.r, c.g, c.b),
  }));

if (asJson) {
  console.log(JSON.stringify({ file, width: img.width, height: img.height, step, colors }, null, 2));
} else {
  console.log(`${file}  ${img.width}x${img.height}  sampled every ${step}px`);
  for (const c of colors) {
    console.log(`${c.hex}  ${String(c.share).padStart(5)}%  L ${String(c.luminance).padEnd(5)}  C ${String(c.chroma).padEnd(5)}  ${c.role}`);
  }
}
