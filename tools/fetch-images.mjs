// Descarga las fotos de stock (Unsplash, licencia libre) a assets/img/ en WebP,
// con el tamaño exacto de tools/images.json, y escribe assets/img/CREDITOS.md.
// Uso: npm run images
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'img');
const images = JSON.parse(await readFile(path.join(ROOT, 'tools', 'images.json'), 'utf8'));

await mkdir(OUT, { recursive: true });

for (const img of images) {
  const params = new URLSearchParams({ fm: 'webp', q: '72', fit: 'crop', w: String(img.width), h: String(img.height) });
  if (img.crop) params.set('crop', img.crop);
  const url = `https://images.unsplash.com/photo-${img.id}?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${img.name}: HTTP ${res.status} en ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(path.join(OUT, `${img.name}.webp`), buf);
  console.log(`✓ ${img.name}.webp  ${Math.round(buf.length / 1024)} KB`);
}

const credits = [
  '# Créditos de las fotos',
  '',
  'Fotos de stock de [Unsplash](https://unsplash.com) (licencia Unsplash: uso libre, sin atribución obligatoria).',
  'Son provisionales: se sustituirán por fotos reales de Centro Aura manteniendo el mismo nombre de archivo.',
  '',
  ...images.map((i) => `- \`${i.name}.webp\` — https://images.unsplash.com/photo-${i.id}`),
  ''
];
await writeFile(path.join(OUT, 'CREDITOS.md'), credits.join('\n'));
