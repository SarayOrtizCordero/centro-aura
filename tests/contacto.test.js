const { test } = require('node:test');
const assert = require('node:assert/strict');
const { read } = require('./helpers.js');
const data = require('../js/data.js');

const html = read('pages/contacto.html');

test('contacto: marcador reemplazado y ancla #formulario', () => {
  assert.ok(!html.includes('<!-- secciones-contacto -->'));
  assert.match(html, /<section[^>]*id="formulario"/);
});

test('contacto: tarjetas de teléfono, WhatsApp, Instagram y dirección', () => {
  assert.match(html, /<a class="contact-card" href="tel:\+34610167764">/);
  assert.match(html, /<a class="contact-card" href="https:\/\/wa\.me\/34610167764" data-wa="">/);
  assert.match(html, /<a class="contact-card" href="https:\/\/www\.instagram\.com\/centro__aura\/"/);
  assert.match(html, /<a class="contact-card" href="https:\/\/www\.google\.com\/maps\/search\//);
});

test('contacto: formulario con campos obligatorios, etiquetas y errores', () => {
  assert.match(html, /<form class="form" id="contact-form">/);
  for (const name of ['nombre', 'mensaje']) {
    assert.match(html, new RegExp(`<label for="f-${name}">`));
    assert.match(html, new RegExp(`id="f-${name}" name="${name}"[^>]*required[^>]*aria-describedby="err-${name}"[^>]*data-error="[^"]+"`));
    assert.match(html, new RegExp(`<p class="field-error" id="err-${name}" aria-live="polite"></p>`));
  }
  assert.match(html, /<label for="f-servicio">/);
});

test('contacto: el selector incluye todos los servicios de data.js (agrupados por familia)', () => {
  const labels = new Set();
  for (const item of Object.values(data.items)) {
    if (item.type !== 'servicio') continue;
    const label = item.contact || item.name;
    labels.add(label);
    assert.ok(html.includes(`<option>${label}</option>`), label);
  }
  assert.equal(labels.size, 10, 'spa x3, barros, alisados, antifrizz, fibra, lavado, corte, corte y peinado');
});

test('contacto: el mapa no contacta con Google hasta el clic', () => {
  assert.ok(!html.includes('<iframe'));
  assert.match(html, /<div class="map" data-map-src="https:\/\/www\.google\.com\/maps\?q=[^"]+&amp;output=embed" data-map-title="[^"]+">/);
  assert.match(html, /<button class="btn btn--solid" type="button" data-map-load hidden>Ver el mapa<\/button>/);
});
