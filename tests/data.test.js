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

test('el catálogo tiene los 16 items esperados', () => {
  const expectedIds = [
    'consulta-tricologica', 'spa-capilar', 'terapias-capilares',
    'barros', 'alisados', 'hidratacion', 'corte',
    'peinados', 'jaldun-equilibrante', 'jaldun-vitalzen',
    'jaldun-multiefecto', 'bono-spa-5', 'bono-tricologico',
    'regalo-25', 'regalo-50', 'regalo-75'
  ];
  assert.deepEqual(Object.keys(data.items).sort(), expectedIds.sort());
  for (const [id, item] of Object.entries(data.items)) {
    assert.ok(typeof item.price === 'number' && item.price > 0, `${id}: precio no es un número positivo`);
  }
});

test('los bonos indican el ahorro', () => {
  for (const id of ['bono-spa-5', 'bono-tricologico']) {
    const item = data.items[id];
    assert.ok(typeof item.saving === 'number' && item.saving > 0, `${id}: saving no es un número positivo`);
    assert.ok(item.saving < item.price, `${id}: saving no es menor que el precio`);
  }
});

test('horario con formato "H:MM – HH:MM"', () => {
  assert.equal(data.hours.length, 3);
  for (const h of data.hours) {
    for (const slot of h.slots) assert.match(slot, /^\d{1,2}:\d{2} – \d{2}:\d{2}$/, slot);
  }
});

test('cada horario tiene días de schema.org válidos', () => {
  const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  for (const h of data.hours) {
    assert.ok(Array.isArray(h.schemaDays) && h.schemaDays.length > 0, `${h.days}: falta schemaDays`);
    for (const day of h.schemaDays) assert.ok(VALID_DAYS.includes(day), `${h.days}: día inválido "${day}"`);
  }
});
