const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, read, pageFiles } = require('./helpers.js');

const all = (text, re) => [...text.matchAll(re)].map((m) => m[1]);
const sitemapUrls = () => all(read('sitemap.xml'), /<loc>([^<]+)<\/loc>/g);

test('sitemap.xml lista todas las páginas con URL absoluta', () => {
  const urls = sitemapUrls();
  const paths = urls.map((u) => new URL(u).pathname).sort();
  const expected = pageFiles().map((f) => (f === 'index.html' ? '/' : '/' + f)).sort();
  assert.deepEqual(paths, expected);
  assert.equal(new Set(urls.map((u) => new URL(u).origin)).size, 1, 'un solo dominio');
});

test('sitemap.xml usa el mismo dominio que los canonical', () => {
  const origin = new URL(sitemapUrls()[0]).origin;
  for (const rel of pageFiles()) {
    assert.ok(read(rel).toLowerCase().includes(`<link rel="canonical" href="${origin}`), rel);
  }
});

test('robots.txt permite el rastreo y apunta al sitemap', () => {
  const robots = read('robots.txt');
  assert.match(robots, /^User-agent: \*$/m);
  assert.doesNotMatch(robots, /^Disallow: \/\s*$/m);
  const origin = new URL(sitemapUrls()[0]).origin;
  assert.ok(robots.toLowerCase().split(/\r?\n/).includes(`sitemap: ${origin}/sitemap.xml`));
});

test('404.html: noindex, rutas relativas a la raíz que existen y salida al inicio', () => {
  const html = read('404.html');
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  assert.ok(!/canonical/.test(html));
  const refs = all(html, /(?:href|src)="([^"]+)"/g)
    .filter((r) => !/^(https?:|tel:|mailto:|#)/.test(r))
    .filter((r) => r !== '/'); // el href="/" de <base>
  assert.ok(refs.length > 8);
  for (const ref of refs) {
    assert.ok(!ref.startsWith('/'), `404.html → ${ref}: debe ser relativa (la ancla <base>)`);
    assert.ok(fs.existsSync(path.join(ROOT, ref.split('#')[0])), `404.html → ${ref} no existe`);
  }
  assert.match(html, /<a class="btn btn--solid" href="index\.html">Volver al inicio<\/a>/);
});

test('404.html: <base> hace que se vea igual en un servidor (cualquier URL) y abierta desde el disco', () => {
  const html = read('404.html');
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
  // 1. Para file:// un script antepone un <base> con la carpeta del archivo
  assert.match(head, /location\.protocol === 'file:'/);
  assert.match(head, /document\.head\.insertBefore\(b, document\.head\.firstChild\)/);
  // 2. En un servidor, <base href="/"> ancla las rutas a la raíz del sitio
  const base = head.indexOf('<base href="/">');
  assert.ok(base > 0, 'falta <base href="/">');
  // 3. Va antes que cualquier recurso, o las rutas relativas se resolverían mal
  for (const tag of ['<link ', '<script src=']) {
    assert.ok(head.indexOf(tag) > base, `${tag} aparece antes de <base>`);
  }
});

test('404.html: "Saltar al contenido" funciona con <base> (si no, llevaría a la portada)', () => {
  const html = read('404.html');
  assert.match(html, /<a class="skip-link" href="#contenido" onclick="event\.preventDefault\(\); document\.getElementById\('contenido'\)\.focus\(\);">/);
  assert.match(html, /<main id="contenido" tabindex="-1">/);
});

test('404.html: personalizada con el loto como cero y tres salidas', () => {
  const html = read('404.html');
  assert.match(html, /<section class="notfound">/);
  assert.match(html, /<span>4<\/span><img src="assets\/icons\/loto\.svg" alt="" width="64" height="40"><span>4<\/span>/);
  assert.match(html, /<h1>Te has salido del camino<\/h1>/);
  assert.match(html, /href="pages\/servicios\.html">Ver servicios</);
  assert.match(html, /<a class="link-arrow" href="https:\/\/wa\.me\/34610167764" data-wa="" data-wa-kind="producto">/);
  assert.ok(!/class="page-hero"/.test(html), 'ya no usa la cabecera de lino genérica');
});

test('fuentes: fonts.css solo referencia archivos que existen y styles.css no usa Google', () => {
  const css = read('css/fonts.css');
  const files = all(css, /url\('\.\.\/(assets\/fonts\/[^']+)'\)/g);
  assert.ok(files.length >= 3);
  for (const f of files) assert.ok(fs.existsSync(path.join(ROOT, f)), f);
  for (const family of ['Cormorant Garamond', 'Jost']) assert.match(css, new RegExp(`font-family: '${family}'`));
  assert.ok(!/googleapis|gstatic/.test(read('css/styles.css')));
});

test('páginas legales: apartados esperados y datos por rellenar visibles', () => {
  const aviso = read('pages/aviso-legal.html');
  const priv = read('pages/privacidad.html');
  assert.match(aviso, /<h1>Aviso legal<\/h1>/);
  assert.match(aviso, /Ley 34\/2002/);
  assert.match(priv, /<h1>Privacidad y cookies<\/h1>/);
  assert.match(priv, /no usa cookies propias/);
  assert.match(priv, /aepd\.es/);
  for (const html of [aviso, priv]) {
    assert.match(html, /<mark class="pendiente">/, 'los datos por rellenar deben verse');
  }
});
