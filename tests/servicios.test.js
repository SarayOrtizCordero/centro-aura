const { test } = require('node:test');
const assert = require('node:assert/strict');
const { read, pageFiles } = require('./helpers.js');
const data = require('../js/data.js');

const html = read('pages/servicios.html');
const servicios = Object.entries(data.items).filter(([, i]) => i.type === 'servicio');

test('servicios: marcador reemplazado', () => {
  assert.ok(!html.includes('<!-- secciones-servicios -->'));
});

test('servicios: cada servicio tiene bloque, precio y reserva con su nombre; duración solo si hay', () => {
  for (const [id, item] of servicios) {
    assert.match(html, new RegExp(`<li class="service" id="${id}">`), id);
    assert.match(html, new RegExp(`data-price="${id}"`), id);
    assert.match(html, new RegExp(`data-wa="${item.name}"`), id);
    const hasDuration = new RegExp(`data-duration="${id}"`).test(html);
    assert.equal(hasDuration, Boolean(item.duration), `${id}: duración en la página y en data.js no coinciden`);
  }
});

test('servicios: el precio escrito en la página coincide con data.js (rangos incluidos)', () => {
  const lib = require('../js/lib.js');
  for (const [id, item] of servicios) {
    const m = html.match(new RegExp(`data-price="${id}">([^<]+)<`));
    assert.ok(m, id);
    const written = m[1].replace(/\s/g, ' ');
    const expected = lib.formatPrice(item).replace(/\s/g, ' ');
    assert.equal(written, expected, `${id}: el HTML de respaldo debe coincidir con data.js`);
  }
});

test('servicios: los precios orientativos llevan un aviso visible', () => {
  const panel = html.slice(html.indexOf('id="panel-tratamientos"'), html.indexOf('id="panel-peluqueria"'));
  assert.match(panel, /<p class="price-note">[^<]*<strong>orientativos<\/strong>[^<]*productos que se gasten/);
  // el aviso va antes del primer precio en rango
  assert.ok(panel.indexOf('price-note') < panel.indexOf('data-price='));
});

test('servicios: la nota de lo que incluye el corte es un subtítulo sutil bajo el nombre', () => {
  const start = html.indexOf('<li class="service" id="corte">');
  const block = html.slice(start, html.indexOf('</li>', start));
  assert.match(block, /<h3>Corte<\/h3>\s*<p class="service__note">Incluye lavado, corte y secado<\/p>/);
});

test('servicios: precio sobre duración, y el botón con más aire (móvil: al lado; escritorio: debajo)', () => {
  const css = read('css/styles.css');
  assert.match(css, /\.service__meta \.price \{ grid-column: 1; grid-row: 1; \}/);
  assert.match(css, /\.service__duration \{ grid-column: 1; grid-row: 2;/);
  assert.match(css, /\.service__meta \.btn \{ grid-column: 2; grid-row: 1 \/ span 2; \}/);
  assert.match(css, /\.service__meta \{ display: flex; flex-direction: column; align-items: flex-end; gap: 0\.6rem; \}/);
  assert.match(css, /\.service__meta \.btn \{ margin-top: 0\.75rem; \}/);
});

test('servicios: el precio va antes que la duración (y el botón al final)', () => {
  for (const [id, item] of servicios.filter(([, i]) => i.duration)) {
    const start = html.indexOf(`<li class="service" id="${id}">`);
    const block = html.slice(start, html.indexOf('Reservar</a>', start));
    const price = block.indexOf(`data-price="${id}"`);
    const duration = block.indexOf(`data-duration="${id}"`);
    const button = block.indexOf('class="btn"');
    assert.ok(price > 0 && price < duration && duration < button, `${id}: orden precio → duración → botón`);
  }
});

test('servicios: el precio destaca (más grande que el precio de las fichas de la tienda)', () => {
  const css = read('css/styles.css');
  const base = parseFloat(css.match(/^\.price \{[^}]*font-size: ([\d.]+)rem/m)[1]);
  const servicio = parseFloat(css.match(/\.service \.price \{[^}]*font-size: ([\d.]+)rem/)[1]);
  assert.ok(servicio > base, `${servicio}rem debe ser mayor que ${base}rem`);
});

test('servicios: los tres Spa listan lo que incluyen', () => {
  for (const id of ['spa-esencial', 'spa-equilibrio', 'spa-aura']) {
    const start = html.indexOf(`<li class="service" id="${id}">`);
    const block = html.slice(start, html.indexOf('</li>\n                <li class="service"', start) > 0 ? html.indexOf('</li>\n                <li class="service"', start) : undefined);
    assert.match(block, /<ul class="service__includes">/, id);
    assert.match(block, /Masaje de hombros, cuello, rostro y cabeza/, id);
  }
});

test('servicios: cada servicio está dentro del panel de su categoría', () => {
  for (const [id, item] of servicios) {
    const panelStart = html.indexOf(`<div class="category" id="panel-${item.category}"`);
    const nextPanel = html.indexOf('<div class="category" id="panel-', panelStart + 1);
    const pos = html.indexOf(`id="${id}"`);
    assert.ok(panelStart > 0 && pos > panelStart && (nextPanel === -1 || pos < nextPanel), id);
  }
});

test('servicios: pestañas accesibles, una por categoría y ocultas sin JS', () => {
  assert.match(html, /<div class="tabs" role="tablist" aria-label="[^"]+" hidden>/);
  for (const cat of data.categories) {
    assert.match(html, new RegExp(`role="tab" id="tab-${cat.id}" aria-controls="panel-${cat.id}"[^>]*data-category="${cat.id}"`));
    assert.match(html, new RegExp(`id="panel-${cat.id}" role="tabpanel" aria-labelledby="tab-${cat.id}"`));
  }
});

test('todos los enlaces a servicios.html#id apuntan a un id que existe', () => {
  for (const rel of pageFiles()) {
    for (const [, id] of read(rel).matchAll(/servicios\.html#([\w-]+)/g)) {
      assert.match(html, new RegExp(`id="${id}"`), `${rel} → #${id}`);
    }
  }
});
