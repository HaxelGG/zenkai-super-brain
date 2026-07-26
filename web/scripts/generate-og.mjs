/**
 * Genera public/brand/og-image.png (1200x630) para Open Graph / Twitter Card.
 *
 *   node scripts/generate-og.mjs
 *
 * El wordmark se recorta del logotipo horizontal y se compone sobre el fondo
 * de marca con blend "lighten": el fondo casi-negro del PNG original queda
 * absorbido por el #08080C del canvas en vez de dibujar un rectángulo negro
 * recortado encima. Así no hace falta rasterizar texto (sin fuentes, sin
 * dependencias, sin diferencias entre máquinas).
 */
import sharp from 'sharp';
import { stat } from 'node:fs/promises';

const SRC = 'public/brand/zenkai-logo-horizontal.png';
const OUT = 'public/brand/og-image.png';
const W = 1200;
const H = 630;

// Región del wordmark + tagline + destello dentro del original de 1536x1024.
const wordmark = await sharp(SRC)
  .extract({ left: 200, top: 380, width: 1150, height: 360 })
  .resize({ width: 940 })
  .toBuffer();

await sharp({
  create: { width: W, height: H, channels: 3, background: '#08080C' },
})
  .composite([{ input: wordmark, gravity: 'center', blend: 'lighten' }])
  .png({ compressionLevel: 9 })
  .toFile(OUT);

const meta = await sharp(OUT).metadata();
console.log(OUT, `${meta.width}x${meta.height}`, (await stat(OUT)).size, 'bytes');
