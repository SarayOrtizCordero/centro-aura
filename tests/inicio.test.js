const { test } = require('node:test');
const assert = require('node:assert/strict');
const { read } = require('./helpers.js');
const data = require('../js/data.js');

const html = read('index.html');

test('inicio: cuatro bloques (hero, servicios, tienda, visita) en orden', () => {
  assert.equal((html.match(/<section[ >]/g) || []).length, 4);
  const order = ['id="hero-title"', 'id="presentacion"', 'id="tienda-title"', 'id="visita-title"'];
  const positions = order.map((marker) => html.indexOf(marker));
  positions.forEach((pos, i) => assert.ok(pos > 0, `falta ${order[i]}`));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.ok(!html.includes('<!-- secciones-inicio -->'), 'queda el marcador sin reemplazar');
});

test('inicio: tres destacados enlazan a servicios', () => {
  for (const id of ['spa-capilar', 'consulta-tricologica', 'terapias-capilares']) {
    assert.match(html, new RegExp(`<a class="feature-card reveal" href="pages/servicios\\.html#${id}">`));
  }
});

test('inicio: los destacados muestran duración y precio desde data.js', () => {
  for (const id of ['spa-capilar', 'consulta-tricologica', 'terapias-capilares']) {
    assert.match(html, new RegExp(`data-duration="${id}"`), id);
    assert.match(html, new RegExp(`data-price="${id}"`), id);
  }
  assert.ok(html.includes('<a class="link-arrow" href="pages/servicios.html">Ver todos los servicios</a>'));
});

test('inicio: la banda de tienda enlaza a champús y tarjetas regalo, sin repetir la tienda', () => {
  assert.ok(html.includes('<a class="shop-tile" href="pages/tienda.html#jaldun">'));
  assert.ok(html.includes('<a class="shop-tile" href="pages/tienda.html#tarjetas-regalo">'));
  for (const name of ['champu-equilibrante', 'champu-vitalzen', 'champu-multiefecto']) {
    assert.ok(html.includes(`assets/img/${name}.webp`), name);
  }
  assert.ok(!/product-card|class="bottle/.test(html), 'la portada ya no repite fichas de producto');
});

test('inicio: ya no hay sección "Hola, soy Paula"', () => {
  assert.ok(!/Hola, soy Paula|about__portrait|paula-title/.test(html));
});

test('inicio: el mapa no contacta con Google hasta el clic y tiene alternativa sin JS', () => {
  assert.ok(!html.includes('<iframe'), 'el iframe debe crearlo main.js al pulsar');
  assert.match(html, /<div class="map" data-map-src="https:\/\/www\.google\.com\/maps\?q=[^"]+&amp;output=embed" data-map-title="[^"]+">/);
  assert.match(html, /<button class="btn btn--solid" type="button" data-map-load hidden>Ver el mapa<\/button>/);
  assert.match(html, /class="link-arrow" href="https:\/\/www\.google\.com\/maps\/search\/[^"]+"[^>]*>Abrir en Google Maps</);
});

const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test('JSON-LD: HairSalon con teléfono e Instagram de data.js', () => {
  assert.equal(ld['@type'], 'HairSalon');
  assert.equal(ld.telephone, '+' + data.business.phoneDigits);
  assert.deepEqual(ld.sameAs, [data.business.instagram]);
  assert.equal(ld.address.postalCode, '41730');
});

test('JSON-LD: el horario coincide con data.js (días y horas)', () => {
  const pad = (t) => t.trim().padStart(5, '0');
  const fromData = data.hours.flatMap((h) =>
    h.schemaDays.flatMap((day) =>
      h.slots.map((s) => {
        const [opens, closes] = s.split('–').map(pad);
        return `${day}|${opens}|${closes}`;
      })
    )
  );
  const fromLd = ld.openingHoursSpecification.flatMap((o) => {
    const days = Array.isArray(o.dayOfWeek) ? o.dayOfWeek : [o.dayOfWeek];
    return days.map((day) => `${day}|${o.opens}|${o.closes}`);
  });
  assert.deepEqual([...fromLd].sort(), [...fromData].sort());
});
