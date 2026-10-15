const { test } = require('node:test');
const assert = require('node:assert/strict');
const { read } = require('./helpers.js');
const data = require('../js/data.js');

const html = read('pages/tienda.html');
const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));

test('tienda: los champús usan las fotos reales de producto', () => {
  for (const name of ['champu-equilibrante', 'champu-vitalzen', 'champu-multiefecto']) {
    assert.ok(html.includes(`<img src="../assets/img/${name}.webp" alt="Frasco del champú `), name);
    assert.ok(html.includes(`${name}.webp" alt="`) && /width="2250" height="2250" loading="lazy">/.test(html), name);
  }
  assert.ok(!html.includes('class="bottle'), 'quedan botes dibujados con CSS');
});

test('tienda: marcador reemplazado y secciones con ancla', () => {
  assert.ok(!html.includes('<!-- secciones-tienda -->'));
  for (const id of ['jaldun', 'tarjetas-regalo']) assert.match(html, new RegExp(`<section[^>]*id="${id}"`));
  assert.ok(!/id="bonos"|href="#bonos"/.test(html), 'los bonos se retiraron hasta tener datos');
});

test('tienda: todos los productos y tarjetas de data.js tienen precio en la página', () => {
  for (const [id, item] of Object.entries(data.items)) {
    if (item.type === 'servicio') continue;
    assert.match(html, new RegExp(`data-price="${id}"`), id);
  }
});

test('tienda: los botones de compra usan el mensaje de producto', () => {
  const tags = main.match(/<a\b[^>]*data-wa="[^"]+"[^>]*>/g) || [];
  assert.equal(tags.length, 7);
  for (const tag of tags) assert.match(tag, /data-wa-kind="producto"/, tag);
});

test('tienda: aviso de recogida en el salón', () => {
  assert.match(html, /Recogida en el salón\. Te confirmamos disponibilidad por WhatsApp\./);
});
