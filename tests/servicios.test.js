const { test } = require('node:test');
const assert = require('node:assert/strict');
const { read, pageFiles } = require('./helpers.js');
const data = require('../js/data.js');

const html = read('pages/servicios.html');
const servicios = Object.entries(data.items).filter(([, i]) => i.type === 'servicio');

test('servicios: marcador reemplazado', () => {
  assert.ok(!html.includes('<!-- secciones-servicios -->'));
});

test('servicios: cada servicio tiene bloque, precio, duración y reserva con su nombre', () => {
  for (const [id, item] of servicios) {
    assert.match(html, new RegExp(`<li class="service" id="${id}">`), id);
    assert.match(html, new RegExp(`data-price="${id}"`), id);
    assert.match(html, new RegExp(`data-duration="${id}"`), id);
    assert.match(html, new RegExp(`data-wa="${item.name}"`), id);
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
