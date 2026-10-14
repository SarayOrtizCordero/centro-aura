const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, read, pageFiles, webpSize } = require('./helpers.js');
const data = require('../js/data.js');

const all = (html, re) => [...html.matchAll(re)].map((m) => m[1]);
const EXPECTED_PAGES = [
  'index.html', 'pages/aviso-legal.html', 'pages/contacto.html',
  'pages/privacidad.html', 'pages/servicios.html', 'pages/tienda.html'
];
// Páginas que no cuelgan del menú principal: no llevan aria-current
const LEGAL = ['pages/aviso-legal.html', 'pages/privacidad.html'];

test('existen las 6 páginas', () => {
  assert.deepEqual([...pageFiles()].sort(), [...EXPECTED_PAGES].sort());
});

for (const rel of pageFiles()) {
  const html = read(rel);

  test(`${rel}: estructura básica y SEO`, () => {
    assert.match(html, /<html lang="es">/);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, 'debe haber exactamente un h1');
    assert.match(html, /<title>[^<]{10,}<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]{50,}">/);
    assert.match(html, /<link rel="canonical" href="[^"]+">/);
    assert.match(html, /<main id="contenido">/);
    assert.match(html, /<a class="skip-link" href="#contenido">/);
    if (!LEGAL.includes(rel)) assert.match(html, /aria-current="page"/);
  });

  test(`${rel}: canonical, og:url y og:image son absolutos y coinciden con la ruta`, () => {
    const urlPath = rel === 'index.html' ? '/' : '/' + rel;
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)[1];
    assert.match(canonical, /^https:\/\/[^/]+/);
    assert.ok(canonical.endsWith(urlPath), canonical);
    assert.equal(html.match(/<meta property="og:url" content="([^"]+)">/)[1], canonical);
    const image = html.match(/<meta property="og:image" content="([^"]+)">/)[1];
    assert.match(image, /^https:\/\/[^/]+\/assets\/img\/[\w-]+\.webp$/);
    assert.ok(fs.existsSync(path.join(ROOT, image.replace(/^https:\/\/[^/]+\//, ''))), image);
  });

  test(`${rel}: tipografías propias y sin iframes de arranque`, () => {
    assert.ok(!/fonts\.(googleapis|gstatic)\.com/.test(html), 'carga Google Fonts');
    assert.ok(!/<iframe\b/.test(html), 'incrusta un iframe sin que el visitante lo pida');
    assert.match(html, /<link rel="stylesheet" href="(?:\.\.\/)?css\/fonts\.css">/);
  });

  test(`${rel}: scripts en orden data → lib → main`, () => {
    const scripts = all(html, /<script src="([^"]+)" defer><\/script>/g).map((s) => path.basename(s));
    assert.deepEqual(scripts, ['data.js', 'lib.js', 'main.js']);
  });

  test(`${rel}: imágenes con alt, width y height`, () => {
    const imgs = html.match(/<img\b[^>]*>/g) || [];
    assert.ok(imgs.length > 0);
    for (const img of imgs) {
      assert.match(img, /\balt="[^"]*"/, img);
      assert.match(img, /\bwidth="\d+"/, img);
      assert.match(img, /\bheight="\d+"/, img);
    }
  });

  test(`${rel}: width/height de las fotos coinciden con el archivo`, () => {
    const imgs = html.match(/<img\b[^>]*src="[^"]*assets\/img\/[^"]+\.webp"[^>]*>/g) || [];
    for (const img of imgs) {
      const src = img.match(/src="([^"]+)"/)[1];
      const [w, h] = webpSize(fs.readFileSync(path.resolve(ROOT, path.dirname(rel), src)));
      assert.equal(img.match(/width="(\d+)"/)[1], String(w), src);
      assert.equal(img.match(/height="(\d+)"/)[1], String(h), src);
    }
  });

  test(`${rel}: ids únicos`, () => {
    const ids = all(html, /\sid="([^"]+)"/g);
    assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), []);
  });

  test(`${rel}: data-price / data-duration / data-saving existen en data.js`, () => {
    for (const id of all(html, /data-(?:price|duration|saving)="([^"]+)"/g)) {
      assert.ok(data.items[id], `falta "${id}" en js/data.js`);
    }
  });

  test(`${rel}: enlaces y recursos locales existen`, () => {
    const refs = all(html, /(?:href|src)="([^"]+)"/g)
      .filter((r) => !/^(https?:|tel:|mailto:|#)/.test(r))
      .map((r) => r.split('#')[0].split('?')[0]);
    for (const ref of refs) {
      let target = path.resolve(ROOT, path.dirname(rel), ref);
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
      assert.ok(fs.existsSync(target), `${rel} → ${ref} no existe`);
    }
  });

  test(`${rel}: botones de WhatsApp con enlace de respaldo`, () => {
    const tags = html.match(/<a\b[^>]*data-wa=[^>]*>/g) || [];
    assert.ok(tags.length >= 3, 'cabecera, pie y botón flotante');
    for (const tag of tags) assert.match(tag, /href="https:\/\/wa\.me\/34610167764"/, tag);
  });

  test(`${rel}: pie centrado — marca, 3 bloques y enlaces legales`, () => {
    const footer = html.slice(html.indexOf('<footer class="site-footer">'), html.indexOf('</footer>'));
    const top = footer.slice(footer.indexOf('class="container footer-top"'), footer.indexOf('class="container footer-grid"'));
    assert.match(top, /class="brand"/);
    assert.match(top, /<a class="btn" href="https:\/\/wa\.me\/34610167764" data-wa="">Reservar por WhatsApp<\/a>/);
    assert.deepEqual(all(footer, /<h2>([^<]+)<\/h2>/g), ['Visítanos', 'Horario', 'Contacto']);
    assert.ok(!footer.includes('footer-nav'), 'el pie ya no lleva navegación');
    const legal = footer.slice(footer.indexOf('<div class="footer-legal">'));
    assert.deepEqual(all(legal, /<a href="[^"]+">([^<]+)<\/a>/g), ['Aviso legal', 'Privacidad y cookies']);
    assert.ok(!/href="#"/.test(footer), 'enlace vacío en el pie');
  });
}

// Un preload de fuentes lleva crossorigin: por file:// el navegador lo bloquea por CORS
// y, además, avisa de que no se usa. Con font-display: swap no hace falta.
for (const rel of [...pageFiles(), '404.html']) {
  test(`${rel}: sin preload de fuentes (da errores de CORS al abrir el archivo en local)`, () => {
    assert.ok(!/rel="preload"/.test(read(rel)));
  });
}
