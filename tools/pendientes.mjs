// Lista lo que aún falta por rellenar antes de publicar: datos legales marcados
// con class="pendiente" y el dominio provisional.  Uso: npm run pendientes
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['index.html', '404.html', 'robots.txt', 'sitemap.xml'];
for (const f of await readdir(path.join(ROOT, 'pages'))) {
  if (f.endsWith('.html')) files.push(path.join('pages', f));
}

let found = 0;
for (const rel of files) {
  const text = await readFile(path.join(ROOT, rel), 'utf8');
  const marks = [...text.matchAll(/<mark class="pendiente">([^<]*)<\/mark>/g)].map((m) => m[1]);
  const domains = text.split('https://TU-DOMINIO.es').length - 1;
  if (marks.length || domains) console.log(`\n${rel}`);
  marks.forEach((m) => console.log(`  · ${m}`));
  if (domains) console.log(`  · dominio provisional (${domains} veces): npm run domain -- https://tudominio.es`);
  found += marks.length + (domains ? 1 : 0);
}
console.log(found ? `\nPendiente: ${found} cosas.` : 'No queda nada pendiente.');
process.exitCode = found ? 1 : 0;
