const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { ROOT, read } = require('./helpers.js');

let out;

before(() => {
  out = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-dist-'));
  execFileSync(process.execPath, [path.join(ROOT, 'tools', 'build.mjs'), out], { stdio: 'pipe' });
});

after(() => fs.rmSync(out, { recursive: true, force: true }));

function walk(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full, base) : [path.relative(base, full).split(path.sep).join('/')];
  });
}

test('vercel.json: construye con tools/build.mjs y publica dist', () => {
  const cfg = JSON.parse(read('vercel.json'));
  assert.equal(cfg.buildCommand, 'node tools/build.mjs');
  assert.equal(cfg.outputDirectory, 'dist');
  assert.equal(cfg.framework, null);
});

test('build: la carpeta publicada lleva la web y nada de desarrollo', () => {
  const files = walk(out);
  for (const f of ['index.html', '404.html', 'robots.txt', 'sitemap.xml', 'css/styles.css', 'css/fonts.css',
    'js/main.js', 'js/data.js', 'js/lib.js', 'pages/servicios.html', 'pages/tienda.html',
    'pages/contacto.html', 'pages/aviso-legal.html', 'pages/privacidad.html', 'assets/icons/loto.svg']) {
    assert.ok(files.includes(f), `falta ${f}`);
  }
  const prohibido = files.filter((f) =>
    /^(tests|tools|docs|\.claude|\.git|\.superpowers|node_modules)\//.test(f) ||
    ['README.md', 'package.json', 'vercel.json', '.gitignore'].includes(f) ||
    f.endsWith('CREDITOS.md'));
  assert.deepEqual(prohibido, [], 'no debe publicarse');
});

test('build: todas las páginas publicadas encuentran sus recursos locales', () => {
  const pages = walk(out).filter((f) => f.endsWith('.html'));
  assert.ok(pages.length >= 7);
  for (const rel of pages) {
    const html = fs.readFileSync(path.join(out, rel), 'utf8');
    // 404.html se sirve desde cualquier URL y resuelve sus rutas con <base>: parte de la raíz
    const dir = rel === '404.html' ? '' : path.posix.dirname(rel);
    for (const [, ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|tel:|mailto:|#)/.test(ref) || ref === '/') continue;
      const clean = ref.split('#')[0].split('?')[0];
      if (!clean) continue;
      let target = path.join(out, dir, clean);
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
      assert.ok(fs.existsSync(target), `${rel} → ${ref} no está en lo publicado`);
    }
  }
});

test('build: fuentes e imágenes de las páginas llegan completas', () => {
  const files = walk(out);
  assert.ok(files.some((f) => f.startsWith('assets/fonts/') && f.endsWith('.woff2')));
  assert.ok(files.filter((f) => f.startsWith('assets/img/') && f.endsWith('.webp')).length >= 12);
});
