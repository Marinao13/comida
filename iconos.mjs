/* Genera los iconos de la PWA (PNG planos, sin dependencias): un plato dividido en cuartos sobre fondo verde.
   node iconos.mjs  →  public/icono-192.png, public/icono-512.png, public/icono-180.png (Apple)          */
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const HOJA = [0x2f, 0x6b, 0x45], PAPEL = [0xf5, 0xf3, 0xec], BLANCO = [0xff, 0xff, 0xff];
const LEGUMBRE = [0x8a, 0x5a, 0x1f], AZUL = [0x1f, 0x5f, 0xa8], VERDE = [0x4c, 0xa0, 0x5c], NARANJA = [0xef, 0x8c, 0x2a];

function png(w, h, pintar) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      // 3×3 muestras por píxel para suavizar los bordes
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
        const c = pintar((x + (sx + 0.5) / 3) / w, (y + (sy + 0.5) / 3) / h);
        r += c[0]; g += c[1]; b += c[2];
      }
      const o = y * (w * 4 + 1) + 1 + x * 4;
      raw[o] = Math.round(r / 9); raw[o + 1] = Math.round(g / 9); raw[o + 2] = Math.round(b / 9); raw[o + 3] = 255;
    }
  }
  const crcTabla = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
  const crc = (buf) => { let c = -1; for (const byte of buf) c = crcTabla[(c ^ byte) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (tipo, datos) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(datos.length);
    const td = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

// Fondo verde a sangre (sirve como "maskable"); plato blanco con cuatro sectores de grupos
function dibujo(x, y) {
  const dx = x - 0.5, dy = y - 0.5, d = Math.hypot(dx, dy);
  if (d > 0.34) return HOJA;
  if (d > 0.3) return BLANCO;
  if (d > 0.27) return PAPEL;
  const ang = Math.atan2(dy, dx);
  const hueco = Math.abs(dx) < 0.012 || Math.abs(dy) < 0.012;   // separación entre sectores
  if (hueco) return PAPEL;
  if (ang < -Math.PI / 2) return LEGUMBRE;
  if (ang < 0) return AZUL;
  if (ang < Math.PI / 2) return NARANJA;
  return VERDE;
}

for (const t of [192, 512, 180]) writeFileSync(`public/icono-${t}.png`, png(t, t, dibujo));
console.log("iconos generados: public/icono-192.png, icono-512.png, icono-180.png");
