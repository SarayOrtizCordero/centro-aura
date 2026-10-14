// Sustituye el dominio provisional por el definitivo en canonical, og:url, og:image,
// JSON-LD, sitemap.xml y robots.txt.
// Uso: npm run domain -- https://www.centroaura.es
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLACEHOLDER = 'https://TU-DOMINIO.es';

const domain = (process.argv[2] || '').replace(/\/+$/, '');
if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
  console.error('Uso: npm run domain -- https://www.tudominio.es   (con https:// y sin barra final ni ruta)');
  process.exit(1);
}

const files = ['index.html', '404.html', 'robots.txt', 'sitemap.xml'];
for (const f of await readdir(path.join(ROOT, 'pages'))) {
  if (f.endsWith('.html')) files.push(path.join('pages', f));
}

let total = 0;
for (const rel of files) {
  const file = path.join(ROOT, rel);
  const text = await readFile(file, 'utf8');
  const count = text.split(PLACEHOLDER).length - 1;
  if (!count) continue;
  await writeFile(file, text.split(PLACEHOLDER).join(domain));
  total += count;
  console.log(`${rel}: ${count}`);
}
console.log(total ? `Listo: ${total} sustituciones por ${domain}` : 'No quedaba ningún dominio provisional.');
