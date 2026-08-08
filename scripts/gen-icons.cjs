const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const outDir = path.join('public');

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i += 1) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function writePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 3 + 1);
    raw[rowStart] = 0; // filter none
    for (let x = 0; x < size; x += 1) {
      const p = pixels(x, y);
      const o = rowStart + 1 + x * 3;
      raw[o] = p[0];
      raw[o + 1] = p[1];
      raw[o + 2] = p[2];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function gradientPixel(x, y, size, top, bottom) {
  const t = y / (size - 1);
  return [lerp(top[0], bottom[0], t), lerp(top[1], bottom[1], t), lerp(top[2], bottom[2], t)];
}

const slate = [15, 23, 42];
const blue = [37, 99, 235];

for (const size of [192, 512]) {
  const png = writePng(size, (x, y) => gradientPixel(x, y, size, slate, blue));
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png);
  console.log(`wrote icon-${size}.png`);
}

fs.writeFileSync(path.join(outDir, 'icon-512-maskable.png'), writePng(512, (x, y) => gradientPixel(x, y, 512, [15, 23, 42], [59, 130, 246])));
console.log('wrote icon-512-maskable.png');

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0f172a"/>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1e3a8a"/>
      <stop offset="1" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <g fill="none" stroke="#e2e8f0" stroke-width="4" stroke-linecap="round">
    <path d="M24 18 14 28l10 10"/>
    <path d="M40 18l10 10-10 10"/>
  </g>
</svg>
`;
fs.writeFileSync(path.join(outDir, 'favicon.svg'), favicon);
console.log('wrote favicon.svg');
