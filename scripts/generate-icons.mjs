// Génère les icônes PWA sans dépendances externes
// Utilise une image PNG minimaliste encodée manuellement via Uint8Array + zlib
import { writeFileSync } from "fs";
import { deflateSync } from "zlib";

function buildPNG(size, bgR, bgG, bgB) {
  // Créer les pixels RGBA
  const pixels = new Uint8Array(size * size * 4);

  // Dessiner un fond coloré avec coins arrondis
  const cornerRadius = Math.floor(size * 0.18);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Vérifier si dans le rectangle arrondi
      let inRect = true;
      if (x < cornerRadius && y < cornerRadius) {
        inRect = Math.hypot(x - cornerRadius, y - cornerRadius) <= cornerRadius;
      } else if (x > size - 1 - cornerRadius && y < cornerRadius) {
        inRect = Math.hypot(x - (size - 1 - cornerRadius), y - cornerRadius) <= cornerRadius;
      } else if (x < cornerRadius && y > size - 1 - cornerRadius) {
        inRect = Math.hypot(x - cornerRadius, y - (size - 1 - cornerRadius)) <= cornerRadius;
      } else if (x > size - 1 - cornerRadius && y > size - 1 - cornerRadius) {
        inRect = Math.hypot(x - (size - 1 - cornerRadius), y - (size - 1 - cornerRadius)) <= cornerRadius;
      }

      if (inRect) {
        // Lettre "S" blanche au centre
        const cx = x - size / 2;
        const cy = y - size / 2;
        const sw = size * 0.28;
        const sh = size * 0.4;
        const thick = size * 0.09;

        let isS = false;

        // Barre du haut
        if (cy >= -sh / 2 && cy <= -sh / 2 + thick && Math.abs(cx) <= sw / 2) isS = true;
        // Barre du milieu
        if (cy >= -thick / 2 && cy <= thick / 2 && Math.abs(cx) <= sw / 2) isS = true;
        // Barre du bas
        if (cy >= sh / 2 - thick && cy <= sh / 2 && Math.abs(cx) <= sw / 2) isS = true;
        // Côté gauche haut
        if (cy >= -sh / 2 && cy <= 0 && cx >= -sw / 2 && cx <= -sw / 2 + thick) isS = true;
        // Côté droit bas
        if (cy >= 0 && cy <= sh / 2 && cx >= sw / 2 - thick && cx <= sw / 2) isS = true;

        if (isS) {
          pixels[idx] = 255; pixels[idx+1] = 255; pixels[idx+2] = 255; pixels[idx+3] = 255;
        } else {
          pixels[idx] = bgR; pixels[idx+1] = bgG; pixels[idx+2] = bgB; pixels[idx+3] = 255;
        }
      } else {
        // Transparent en dehors
        pixels[idx] = 0; pixels[idx+1] = 0; pixels[idx+2] = 0; pixels[idx+3] = 0;
      }
    }
  }

  // Encoder en PNG
  const chunks = [];

  // Signature PNG
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  function chunk(type, data) {
    const typeBuf = Buffer.from(type, "ascii");
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const content = Buffer.concat([typeBuf, data]);
    const crc = crc32(content);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc >>> 0);
    return Buffer.concat([len, content, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  chunks.push(chunk("IHDR", ihdr));

  // IDAT : raw image data avec filtre 0 par ligne
  const raw = [];
  for (let y = 0; y < size; y++) {
    raw.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      raw.push(pixels[idx], pixels[idx+1], pixels[idx+2], pixels[idx+3]);
    }
  }
  const compressed = deflateSync(Buffer.from(raw), { level: 6 });
  chunks.push(chunk("IDAT", compressed));

  // IEND
  chunks.push(chunk("IEND", Buffer.alloc(0)));

  return Buffer.concat(chunks);
}

// CRC32 table
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Bleu #2563eb = RGB(37, 99, 235)
writeFileSync("public/icon-192.png", buildPNG(192, 37, 99, 235));
writeFileSync("public/icon-512.png", buildPNG(512, 37, 99, 235));
console.log("✓ Icônes PWA générées (192x192 et 512x512)");
