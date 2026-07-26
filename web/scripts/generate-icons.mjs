/**
 * Genera los iconos rasterizados desde public/favicon.svg (fuente de verdad).
 *
 *   node scripts/generate-icons.mjs
 *
 * Los binarios resultantes SÍ se commitean: este script existe para poder
 * regenerarlos cuando cambie la marca, no como paso de build. `sharp` viene
 * de forma transitiva con Astro (astro:assets), así que no añade dependencia.
 */
import sharp from 'sharp';
import { readFile, writeFile, stat } from 'node:fs/promises';

const SRC = 'public/favicon.svg';
const svg = await readFile(SRC);

// density alto para que el rasterizado del SVG no salga blando al reducir.
const render = (size) =>
  sharp(svg, { density: 512 }).resize(size, size).png({ compressionLevel: 9, palette: true });

await render(180).toFile('public/apple-touch-icon.png');

// favicon.ico: contenedor ICO con un PNG 32x32 embebido. El formato admite PNG
// desde Vista y lo soporta todo navegador vivo; evita el BMP de 4KB del ICO clásico.
const png32 = await render(32).toBuffer();
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reservado
header.writeUInt16LE(1, 2); // tipo 1 = icono
header.writeUInt16LE(1, 4); // 1 imagen
const entry = Buffer.alloc(16);
entry.writeUInt8(32, 0); // ancho
entry.writeUInt8(32, 1); // alto
entry.writeUInt8(0, 2); // colores de paleta (0 = sin tabla)
entry.writeUInt8(0, 3); // reservado
entry.writeUInt16LE(1, 4); // planos de color
entry.writeUInt16LE(32, 6); // bits por pixel
entry.writeUInt32LE(png32.length, 8);
entry.writeUInt32LE(6 + 16, 12); // offset del payload
await writeFile('public/favicon.ico', Buffer.concat([header, entry, png32]));

for (const f of ['public/apple-touch-icon.png', 'public/favicon.ico']) {
  console.log(f, (await stat(f)).size, 'bytes');
}
