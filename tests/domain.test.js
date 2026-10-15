const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { ROOT, read } = require('./helpers.js');

const TOOL = path.join(ROOT, 'tools', 'set-domain.mjs');

function site(origin) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-domain-'));
  fs.mkdirSync(path.join(dir, 'pages'));
  const page = (p) => `<link rel="canonical" href="${origin}${p}">\n<meta property="og:image" content="${origin}/assets/img/hero-salon.webp">\n`;
  fs.writeFileSync(path.join(dir, 'index.html'), page('/'));
  fs.writeFileSync(path.join(dir, 'pages', 'tienda.html'), page('/pages/tienda.html'));
  fs.writeFileSync(path.join(dir, 'sitemap.xml'), `<loc>${origin}/</loc>\n<loc>${origin}/pages/tienda.html</loc>\n`);
  fs.writeFileSync(path.join(dir, 'robots.txt'), `Sitemap: ${origin}/sitemap.xml\n`);
  fs.writeFileSync(path.join(dir, '404.html'), '<h1>404</h1>\n');
  return dir;
}

const run = (dir, domain) => spawnSync(process.execPath, [TOOL, domain], {
  env: { ...process.env, AURA_ROOT: dir }, encoding: 'utf8'
});
const all = (dir) => ['index.html', 'pages/tienda.html', 'sitemap.xml', 'robots.txt']
  .map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');

test('set-domain: del dominio provisional al de Vercel y de ahí al propio (se puede repetir)', () => {
  const dir = site('https://TU-DOMINIO.es');
  try {
    assert.equal(run(dir, 'https://centro-aura.vercel.app').status, 0);
    let text = all(dir);
    assert.ok(!text.includes('TU-DOMINIO'));
    assert.equal((text.match(/https:\/\/centro-aura\.vercel\.app/g) || []).length, 7);

    // segunda vez: ya no existe el provisional, y aun así cambia
    assert.equal(run(dir, 'https://www.centroaura.es').status, 0);
    text = all(dir);
    assert.ok(!text.includes('vercel.app'), 'quedó el dominio anterior');
    assert.equal((text.match(/https:\/\/www\.centroaura\.es/g) || []).length, 7);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('set-domain: no cambia nada si ya usa ese dominio y rechaza dominios inválidos', () => {
  const dir = site('https://centro-aura.vercel.app');
  try {
    const before = all(dir);
    const same = run(dir, 'https://centro-aura.vercel.app');
    assert.equal(same.status, 0);
    assert.match(same.stdout, /nada que cambiar/);
    assert.equal(all(dir), before);

    for (const bad of ['centroaura.es', 'http://centroaura.es', 'https://centroaura.es/ruta', '']) {
      assert.notEqual(run(dir, bad).status, 0, bad);
    }
    assert.equal(all(dir), before);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('el sitio publicado usa un dominio real, no el provisional', () => {
  const home = read('index.html');
  const origin = home.match(/<link rel="canonical" href="(https:\/\/[^"/]+)/)[1];
  assert.doesNotMatch(origin, /TU-DOMINIO/i, 'el canonical sigue con el dominio provisional');
});
