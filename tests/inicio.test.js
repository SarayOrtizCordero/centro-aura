const { test } = require('node:test');
const assert = require('node:assert/strict');
const { read } = require('./helpers.js');
const data = require('../js/data.js');

const html = read('index.html');

test('inicio: secciones en el orden de la referencia', () => {
  const order = ['id="presentacion"', 'id="paula-title"', 'id="jaldun-title"', 'id="regalo-title"', 'id="visita-title"'];
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

test('inicio: mapa incrustado accesible y diferido', () => {
  assert.match(html, /<iframe src="https:\/\/www\.google\.com\/maps\?q=[^"]+&amp;output=embed" title="[^"]+" loading="lazy"/);
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
