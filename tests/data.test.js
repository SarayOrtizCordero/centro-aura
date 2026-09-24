const { test } = require('node:test');
const assert = require('node:assert/strict');
const data = require('../js/data.js');

const TYPES = ['servicio', 'producto', 'bono', 'regalo'];

test('contacto del negocio', () => {
  assert.equal(data.business.phoneDigits, '34610167764');
  assert.equal(data.business.phoneDisplay, '+34 610 16 77 64');
  assert.equal(data.business.instagram, 'https://www.instagram.com/centro__aura/');
  assert.match(data.business.address, /Domingo Gallego, 3/);
});

test('todos los items tienen tipo, nombre y precio numérico', () => {
  for (const [id, item] of Object.entries(data.items)) {
    assert.ok(TYPES.includes(item.type), `${id}: tipo inválido`);
    assert.ok(item.name && item.name.length > 2, `${id}: falta nombre`);
    assert.equal(typeof item.price, 'number', `${id}: precio no numérico`);
  }
});

test('los servicios tienen categoría válida y duración', () => {
  const cats = data.categories.map((c) => c.id);
  assert.deepEqual(cats, ['salud', 'tratamientos', 'peluqueria']);
  const servicios = Object.entries(data.items).filter(([, i]) => i.type === 'servicio');
  assert.equal(servicios.length, 8);
  for (const [id, item] of servicios) {
    assert.ok(cats.includes(item.category), `${id}: categoría inválida`);
    assert.ok(item.duration, `${id}: falta duración`);
  }
});

test('precios orientativos de la especificación', () => {
  const expected = {
    'consulta-tricologica': [30, false], 'spa-capilar': [35, true], 'terapias-capilares': [40, true],
    'barros': [30, true], 'alisados': [90, true], 'hidratacion': [25, true], 'corte': [18, true],
    'peinados': [25, true], 'jaldun-equilibrante': [22, false], 'jaldun-vitalzen': [24, false],
    'jaldun-multiefecto': [22, false], 'bono-spa-5': [150, false], 'bono-tricologico': [170, false],
    'regalo-25': [25, false], 'regalo-50': [50, false], 'regalo-75': [75, false]
  };
  assert.deepEqual(Object.keys(data.items).sort(), Object.keys(expected).sort());
  for (const [id, [price, from]] of Object.entries(expected)) {
    assert.equal(data.items[id].price, price, id);
    assert.equal(Boolean(data.items[id].from), from, id);
  }
});

test('los bonos indican el ahorro', () => {
  assert.equal(data.items['bono-spa-5'].saving, 25);
  assert.equal(data.items['bono-tricologico'].saving, 20);
});

test('horario con formato "H:MM – HH:MM"', () => {
  assert.equal(data.hours.length, 3);
  for (const h of data.hours) {
    for (const slot of h.slots) assert.match(slot, /^\d{1,2}:\d{2} – \d{2}:\d{2}$/, slot);
  }
});
