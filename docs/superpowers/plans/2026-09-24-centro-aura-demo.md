# Centro Aura — Demo web · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la demo web de Centro Aura (4 páginas estáticas: Inicio, Servicios, Tienda y Contacto), minimalista, con la paleta de la clienta y reservas y pedidos por WhatsApp.

**Architecture:** HTML, CSS y JS sin frameworks ni paso de build. El contenido va escrito en el HTML. Los datos variables (precios, horario, teléfono) viven solo en `js/data.js` y `js/main.js` los vuelca en los elementos marcados con `data-*`. La lógica pura está en `js/lib.js` y se testea con `node:test`.

**Tech Stack:** HTML5, CSS moderno (custom properties, grid, `clamp()`), JavaScript ES2020 en scripts clásicos (`defer`), Node 24 solo para tests, servidor local y descarga de fotos. Google Fonts: Cormorant Garamond y Jost.

**Spec:** `docs/superpowers/specs/2026-09-24-centro-aura-demo-design.md`

## Global Constraints

- Paleta: `#FFFDF7` (fondo), `#F6F0E4` (fondo alterno), `#E9DDC8` (líneas y hover), `#B2A38F` (solo decorativo), `#D2C244` (solo decorativo). Texto: `#4A4238` y `#6B6153`. Borde de campos: `#8C7F6D`. Error: `#9B3D2E`. **Ni `#B2A38F` ni `#D2C244` se usan en texto.**
- Teléfono: `+34 610 16 77 64` → dígitos `34610167764` → `https://wa.me/34610167764`.
- Dirección: `C/ Dr. Domingo Gallego, 3, 41730 Las Cabezas de San Juan (Sevilla)`.
- Instagram: `https://www.instagram.com/centro__aura/`.
- Mensaje de reserva: `Hola Paula, me gustaría reservar: <servicio>`. Mensaje de producto: `Hola Paula, me interesa: <producto>`.
- Cada `<a data-wa>` lleva en el HTML `href="https://wa.me/34610167764"` como respaldo sin JS.
- Sin dependencias npm. Todo el texto visible en español. `lang="es"`.
- Un `h1` por página. Todas las `<img>` con `alt`, `width` y `height`. Las fotos de `assets/img/` llevan `loading="lazy"`, salvo la foto principal de cada página, que lleva `fetchpriority="high"`.
- Precios y horario: solo se editan en `js/data.js` (el JSON-LD de `index.html` repite el horario y un test garantiza que coinciden).
- Estructura: 16px mínimos de margen lateral en móvil y sin scroll horizontal a 375px.
- Commits en español, terminando con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `package.json` | Scripts `test` y `serve` (sin dependencias) |
| `.claude/launch.json` | Configuración del servidor de preview |
| `tools/serve.mjs` | Servidor estático local en el puerto 4173 |
| `tools/images.json` | Lista de fotos: nombre, ID de Unsplash, tamaño y recorte |
| `tools/fetch-images.mjs` | Descarga las fotos en WebP y escribe `CREDITOS.md` |
| `js/lib.js` | Funciones puras: precios, WhatsApp, horario, mensajes |
| `js/data.js` | Datos de negocio (única fuente de precios y horario) |
| `js/main.js` | Comportamiento del DOM: datos, WhatsApp, cabecera, menú, animaciones, pestañas, formulario |
| `css/styles.css` | Tokens, base, layout, componentes, cabecera y pie, movimiento y estilos por página |
| `assets/icons/loto.svg`, `favicon.svg` | Iconos de marca |
| `assets/img/*.webp`, `CREDITOS.md` | Fotos (stock provisional) y créditos |
| `index.html`, `pages/servicios.html`, `pages/tienda.html`, `pages/contacto.html` | Páginas |
| `tests/helpers.js` | Utilidades de test (lectura, lista de páginas, tamaño de WebP) |
| `tests/*.test.js` | Tests (`npm test`) |
| `README.md` | Cómo verla, editar datos y cambiar fotos |

---

### Task 1: Herramientas y funciones puras (`js/lib.js`)

**Files:**
- Create: `package.json`, `tools/serve.mjs`, `.claude/launch.json`, `js/lib.js`, `tests/lib.test.js`

**Interfaces:**
- Consumes: nada.
- Produces: `window.AuraLib` en el navegador y `module.exports` en Node, con:
  - `formatPrice(item?: {price?: number, from?: boolean}): string` → `"30 €"`, `"desde 35 €"` o `"Consultar"` (entre número y € va un espacio de no separación ` `; también entre "desde" y el número).
  - `formatSaving(item?: {saving?: number}): string` → `"ahorras 25 €"` o `""`.
  - `waMessage(kind: 'reserva' | 'producto', subject: string): string`
  - `buildWaUrl(phoneDigits: string, message?: string): string`
  - `hoursToRows(hours: {days: string, slots: string[]}[]): {days: string, text: string}[]`
  - `categoryOf(items: object, id: string): string | null`
  - `composeContactMessage({name, service, message}): string`

- [ ] **Step 1: Crear `package.json`**

```json
{
  "name": "centro-aura-demo",
  "version": "1.0.0",
  "private": true,
  "description": "Demo web de Centro Aura — Spa Capilar · Tricología",
  "scripts": {
    "test": "node --test",
    "serve": "node tools/serve.mjs",
    "images": "node tools/fetch-images.mjs"
  }
}
```

- [ ] **Step 2: Escribir los tests que fallan, en `tests/lib.test.js`**

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const lib = require('../js/lib.js');

const NBSP = ' ';

test('formatPrice: precio fijo', () => {
  assert.equal(lib.formatPrice({ price: 30, from: false }), `30${NBSP}€`);
});

test('formatPrice: precio "desde"', () => {
  assert.equal(lib.formatPrice({ price: 35, from: true }), `desde${NBSP}35${NBSP}€`);
});

test('formatPrice: sin dato muestra "Consultar"', () => {
  assert.equal(lib.formatPrice(undefined), 'Consultar');
  assert.equal(lib.formatPrice({}), 'Consultar');
});

test('formatSaving: con y sin ahorro', () => {
  assert.equal(lib.formatSaving({ saving: 25 }), `ahorras${NBSP}25${NBSP}€`);
  assert.equal(lib.formatSaving({ price: 10 }), '');
  assert.equal(lib.formatSaving(undefined), '');
});

test('waMessage: reserva con servicio', () => {
  assert.equal(lib.waMessage('reserva', 'Spa capilar'), 'Hola Paula, me gustaría reservar: Spa capilar');
});

test('waMessage: reserva sin servicio', () => {
  assert.equal(lib.waMessage('reserva', ''), 'Hola Paula, me gustaría reservar una cita.');
  assert.equal(lib.waMessage(undefined, '  '), 'Hola Paula, me gustaría reservar una cita.');
});

test('waMessage: producto', () => {
  assert.equal(lib.waMessage('producto', 'Champú Equilibrante Jaldún'), 'Hola Paula, me interesa: Champú Equilibrante Jaldún');
  assert.equal(lib.waMessage('producto', ''), 'Hola Paula, me gustaría información.');
});

test('buildWaUrl: codifica el mensaje', () => {
  assert.equal(
    lib.buildWaUrl('34610167764', 'Hola Paula, me gustaría reservar: Spa capilar'),
    'https://wa.me/34610167764?text=Hola%20Paula%2C%20me%20gustar%C3%ADa%20reservar%3A%20Spa%20capilar'
  );
});

test('buildWaUrl: sin mensaje', () => {
  assert.equal(lib.buildWaUrl('34610167764'), 'https://wa.me/34610167764');
});

test('hoursToRows: une franjas y marca cerrado', () => {
  const rows = lib.hoursToRows([
    { days: 'Lunes – Viernes', slots: ['9:30 – 14:00', '17:00 – 20:30'] },
    { days: 'Domingo', slots: [] }
  ]);
  assert.deepEqual(rows, [
    { days: 'Lunes – Viernes', text: '9:30 – 14:00 · 17:00 – 20:30' },
    { days: 'Domingo', text: 'Cerrado' }
  ]);
});

test('categoryOf: devuelve la categoría o null', () => {
  const items = { 'spa-capilar': { category: 'salud' }, 'jaldun-x': { type: 'producto' } };
  assert.equal(lib.categoryOf(items, 'spa-capilar'), 'salud');
  assert.equal(lib.categoryOf(items, 'jaldun-x'), null);
  assert.equal(lib.categoryOf(items, 'no-existe'), null);
});

test('composeContactMessage: con servicio', () => {
  assert.equal(
    lib.composeContactMessage({ name: ' Lucía ', service: 'Spa capilar', message: '¿Tenéis hueco el viernes? ' }),
    'Hola Paula, soy Lucía. Me interesa: Spa capilar. ¿Tenéis hueco el viernes?'
  );
});

test('composeContactMessage: sin servicio', () => {
  assert.equal(
    lib.composeContactMessage({ name: 'Lucía', service: '', message: 'Tengo mucha caída.' }),
    'Hola Paula, soy Lucía. Tengo mucha caída.'
  );
});
```

- [ ] **Step 3: Ejecutar los tests y comprobar que fallan**

Run: `npm test`
Expected: FAIL con `Cannot find module '../js/lib.js'`

- [ ] **Step 4: Implementar `js/lib.js`**

```js
/* Centro Aura — funciones puras (sin DOM).
   En el navegador quedan en window.AuraLib; en Node se exportan para los tests. */
(function (root) {
  'use strict';

  const NBSP = ' ';

  function formatEuros(amount) {
    return amount + NBSP + '€';
  }

  function formatPrice(item) {
    if (!item || typeof item.price !== 'number') return 'Consultar';
    return (item.from ? 'desde' + NBSP : '') + formatEuros(item.price);
  }

  function formatSaving(item) {
    if (!item || typeof item.saving !== 'number') return '';
    return 'ahorras' + NBSP + formatEuros(item.saving);
  }

  function waMessage(kind, subject) {
    const text = (subject || '').trim();
    if (kind === 'producto') {
      return text ? 'Hola Paula, me interesa: ' + text : 'Hola Paula, me gustaría información.';
    }
    return text ? 'Hola Paula, me gustaría reservar: ' + text : 'Hola Paula, me gustaría reservar una cita.';
  }

  function buildWaUrl(phoneDigits, message) {
    const url = 'https://wa.me/' + phoneDigits;
    return message ? url + '?text=' + encodeURIComponent(message) : url;
  }

  function hoursToRows(hours) {
    return hours.map((h) => ({
      days: h.days,
      text: h.slots.length ? h.slots.join(' · ') : 'Cerrado'
    }));
  }

  function categoryOf(items, id) {
    const item = items[id];
    return item && item.category ? item.category : null;
  }

  function composeContactMessage(fields) {
    const parts = ['Hola Paula, soy ' + fields.name.trim() + '.'];
    if (fields.service) parts.push('Me interesa: ' + fields.service + '.');
    parts.push(fields.message.trim());
    return parts.join(' ');
  }

  const AuraLib = {
    formatPrice,
    formatSaving,
    waMessage,
    buildWaUrl,
    hoursToRows,
    categoryOf,
    composeContactMessage
  };

  root.AuraLib = AuraLib;
  if (typeof module !== 'undefined' && module.exports) module.exports = AuraLib;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 5: Ejecutar los tests y comprobar que pasan**

Run: `npm test`
Expected: PASS, 13 tests.

- [ ] **Step 6: Crear el servidor local `tools/serve.mjs`**

```js
// Servidor estático para ver la demo en local: npm run serve → http://localhost:4173
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 · No encontrado');
  }
}).listen(PORT, () => console.log(`Centro Aura → http://localhost:${PORT}`));
```

- [ ] **Step 7: Crear `.claude/launch.json`**

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "centro-aura",
      "runtimeExecutable": "node",
      "runtimeArgs": ["tools/serve.mjs"],
      "port": 4173
    }
  ]
}
```

- [ ] **Step 8: Commit**

```bash
git add package.json tools/serve.mjs .claude/launch.json js/lib.js tests/lib.test.js
git commit -m "Añade funciones puras (lib.js), tests y servidor local

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Datos de negocio (`js/data.js`)

**Files:**
- Create: `js/data.js`, `tests/data.test.js`

**Interfaces:**
- Consumes: nada.
- Produces: `window.AURA_DATA` (y `module.exports`) con esta forma:
  - `business: { name, owner, phoneDisplay, phoneDigits, address, mapsUrl, instagram }`
  - `hours: {days: string, slots: string[]}[]`, con las franjas en formato `"H:MM – HH:MM"` (guion largo `–` rodeado de espacios).
  - `categories: {id: 'salud'|'tratamientos'|'peluqueria', label}[]`
  - `items: Record<id, {type: 'servicio'|'producto'|'bono'|'regalo', name, price, from?, category?, duration?, saving?}>`
  - IDs de item: `consulta-tricologica`, `spa-capilar`, `terapias-capilares`, `barros`, `alisados`, `hidratacion`, `corte`, `peinados`, `jaldun-equilibrante`, `jaldun-vitalzen`, `jaldun-multiefecto`, `bono-spa-5`, `bono-tricologico`, `regalo-25`, `regalo-50`, `regalo-75`.

- [ ] **Step 1: Escribir los tests que fallan, en `tests/data.test.js`**

```js
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
```

- [ ] **Step 2: Ejecutar los tests y comprobar que fallan**

Run: `npm test`
Expected: FAIL con `Cannot find module '../js/data.js'`

- [ ] **Step 3: Implementar `js/data.js`**

```js
/* Centro Aura — datos de negocio.
   ÚNICO archivo que hay que tocar para cambiar precios, horario o contacto.
   Precios y horario ORIENTATIVOS: pendientes de confirmar por Paula.
   Si cambias el horario, actualiza también el bloque JSON-LD de index.html
   (npm test avisa si no coinciden). */
(function (root) {
  'use strict';

  const AURA_DATA = {
    business: {
      name: 'Centro Aura',
      owner: 'Paula',
      phoneDisplay: '+34 610 16 77 64',
      phoneDigits: '34610167764',
      address: 'C/ Dr. Domingo Gallego, 3, 41730 Las Cabezas de San Juan (Sevilla)',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=C%2F%20Dr.%20Domingo%20Gallego%203%2C%2041730%20Las%20Cabezas%20de%20San%20Juan',
      instagram: 'https://www.instagram.com/centro__aura/'
    },

    hours: [
      { days: 'Lunes – Viernes', slots: ['9:30 – 14:00', '17:00 – 20:30'] },
      { days: 'Sábado', slots: ['9:30 – 14:00'] },
      { days: 'Domingo', slots: [] }
    ],

    categories: [
      { id: 'salud', label: 'Salud capilar' },
      { id: 'tratamientos', label: 'Tratamientos' },
      { id: 'peluqueria', label: 'Peluquería' }
    ],

    items: {
      // Servicios
      'consulta-tricologica': { type: 'servicio', category: 'salud', name: 'Consulta tricológica', duration: '45 min', price: 30, from: false },
      'spa-capilar':          { type: 'servicio', category: 'salud', name: 'Spa capilar', duration: '60 min', price: 35, from: true },
      'terapias-capilares':   { type: 'servicio', category: 'salud', name: 'Terapias capilares', duration: '60 min', price: 40, from: true },
      'barros':               { type: 'servicio', category: 'salud', name: 'Barros naturales', duration: '45 min', price: 30, from: true },
      'alisados':             { type: 'servicio', category: 'tratamientos', name: 'Alisados', duration: '2–3 h', price: 90, from: true },
      'hidratacion':          { type: 'servicio', category: 'tratamientos', name: 'Hidratación y reparación', duration: '45 min', price: 25, from: true },
      'corte':                { type: 'servicio', category: 'peluqueria', name: 'Corte y peinado', duration: '45 min', price: 18, from: true },
      'peinados':             { type: 'servicio', category: 'peluqueria', name: 'Peinados y recogidos', duration: '60 min', price: 25, from: true },

      // Productos Jaldún
      'jaldun-equilibrante': { type: 'producto', name: 'Champú Equilibrante Jaldún', price: 22 },
      'jaldun-vitalzen':     { type: 'producto', name: 'Champú Vitalzen Fortificante Jaldún', price: 24 },
      'jaldun-multiefecto':  { type: 'producto', name: 'Champú Multiefecto Regulador Jaldún', price: 22 },

      // Bonos
      'bono-spa-5':       { type: 'bono', name: 'Bono 5 sesiones de Spa Capilar', price: 150, saving: 25 },
      'bono-tricologico': { type: 'bono', name: 'Bono tratamiento tricológico', price: 170, saving: 20 },

      // Tarjetas regalo
      'regalo-25': { type: 'regalo', name: 'Tarjeta regalo de 25 €', price: 25 },
      'regalo-50': { type: 'regalo', name: 'Tarjeta regalo de 50 €', price: 50 },
      'regalo-75': { type: 'regalo', name: 'Tarjeta regalo de 75 €', price: 75 }
    }
  };

  root.AURA_DATA = AURA_DATA;
  if (typeof module !== 'undefined' && module.exports) module.exports = AURA_DATA;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Ejecutar los tests y comprobar que pasan**

Run: `npm test`
Expected: PASS, 19 tests.

- [ ] **Step 5: Commit**

```bash
git add js/data.js tests/data.test.js
git commit -m "Añade datos de negocio orientativos (data.js) con tests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Fotos e iconos

**Files:**
- Create: `tools/images.json`, `tools/fetch-images.mjs`, `tests/helpers.js`, `tests/assets.test.js`, `assets/icons/loto.svg`, `assets/icons/favicon.svg`
- Generated: `assets/img/*.webp` (10 archivos) y `assets/img/CREDITOS.md`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `tests/helpers.js` exporta `ROOT: string`, `read(rel): string`, `pageFiles(): string[]` (con `index.html` y `pages/*.html`) y `webpSize(buf: Buffer): [width, height]`.
  - Fotos en `assets/img/` con tamaño exacto: `hero-salon` 2000×1333, `destacado-spa|destacado-tricologia|destacado-terapias` 900×1125, `paula-retrato` 640×640, `tarjeta-regalo` 1200×900, `textura-lino` 2000×900, `servicio-salud|servicio-tratamientos|servicio-peluqueria` 1000×1250.
  - `assets/icons/loto.svg` (64×40) y `assets/icons/favicon.svg`.

> **Nota:** el Step 5 descarga 10 archivos de `images.unsplash.com` (unos 1,5–2,5 MB en total). Pide confirmación al usuario antes si no la ha dado ya.

- [ ] **Step 1: Crear `tools/images.json`**

```json
[
  { "name": "hero-salon",            "id": "1706629503650-cade709d15e3", "width": 2000, "height": 1333 },
  { "name": "destacado-spa",         "id": "1757066033634-bbbf874ce525", "width": 900,  "height": 1125 },
  { "name": "destacado-tricologia",  "id": "1733685373279-a10ac3f255e7", "width": 900,  "height": 1125 },
  { "name": "destacado-terapias",    "id": "1706795034830-de41aee06afa", "width": 900,  "height": 1125 },
  { "name": "paula-retrato",         "id": "1580489944761-15a19d654956", "width": 640,  "height": 640, "crop": "faces" },
  { "name": "tarjeta-regalo",        "id": "1687617788315-cf8bfd1592c3", "width": 1200, "height": 900 },
  { "name": "textura-lino",          "id": "1705951320394-eda5d939d0ac", "width": 2000, "height": 900 },
  { "name": "servicio-salud",        "id": "1757066033606-b9552acb2dd0", "width": 1000, "height": 1250 },
  { "name": "servicio-tratamientos", "id": "1573807195700-9e9db54988f6", "width": 1000, "height": 1250 },
  { "name": "servicio-peluqueria",   "id": "1634449571017-5fecfd26ad76", "width": 1000, "height": 1250 }
]
```

- [ ] **Step 2: Crear `tests/helpers.js`**

```js
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function pageFiles() {
  const dir = path.join(ROOT, 'pages');
  const pages = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => 'pages/' + f)
    : [];
  return ['index.html', ...pages];
}

// Lee ancho y alto de un WebP (VP8, VP8L o VP8X) sin dependencias.
function webpSize(buf) {
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
  if (chunk === 'VP8 ') return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
  if (chunk === 'VP8L') {
    const bits = buf.readUInt32LE(21);
    return [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff)];
  }
  throw new Error('Formato WebP desconocido: ' + chunk);
}

module.exports = { ROOT, read, pageFiles, webpSize };
```

- [ ] **Step 3: Escribir los tests que fallan, en `tests/assets.test.js`**

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, read, webpSize } = require('./helpers.js');
const images = require('../tools/images.json');

for (const img of images) {
  test(`assets/img/${img.name}.webp es WebP de ${img.width}×${img.height}`, () => {
    const file = path.join(ROOT, 'assets', 'img', `${img.name}.webp`);
    assert.ok(fs.existsSync(file), 'falta la imagen: ejecuta npm run images');
    const buf = fs.readFileSync(file);
    assert.equal(buf.toString('ascii', 0, 4), 'RIFF');
    assert.equal(buf.toString('ascii', 8, 12), 'WEBP');
    assert.deepEqual(webpSize(buf), [img.width, img.height]);
  });
}

test('créditos de las fotos', () => {
  const credits = read('assets/img/CREDITOS.md');
  for (const img of images) assert.match(credits, new RegExp(img.id));
});

test('iconos SVG de marca', () => {
  assert.match(read('assets/icons/loto.svg'), /<svg[^>]*viewBox="0 0 64 40"/);
  assert.match(read('assets/icons/favicon.svg'), /<svg[^>]*viewBox="0 0 64 64"/);
});
```

- [ ] **Step 4: Ejecutar los tests y comprobar que fallan**

Run: `npm test`
Expected: FAIL. Los 10 tests de imagen dan "falta la imagen" y el de iconos da ENOENT.

- [ ] **Step 5: Crear `tools/fetch-images.mjs` y ejecutarlo**

```js
// Descarga las fotos de stock (Unsplash, licencia libre) a assets/img/ en WebP,
// con el tamaño exacto de tools/images.json, y escribe assets/img/CREDITOS.md.
// Uso: npm run images
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'img');
const images = JSON.parse(await readFile(path.join(ROOT, 'tools', 'images.json'), 'utf8'));

await mkdir(OUT, { recursive: true });

for (const img of images) {
  const params = new URLSearchParams({ fm: 'webp', q: '72', fit: 'crop', w: String(img.width), h: String(img.height) });
  if (img.crop) params.set('crop', img.crop);
  const url = `https://images.unsplash.com/photo-${img.id}?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${img.name}: HTTP ${res.status} en ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(path.join(OUT, `${img.name}.webp`), buf);
  console.log(`✓ ${img.name}.webp  ${Math.round(buf.length / 1024)} KB`);
}

const credits = [
  '# Créditos de las fotos',
  '',
  'Fotos de stock de [Unsplash](https://unsplash.com) (licencia Unsplash: uso libre, sin atribución obligatoria).',
  'Son provisionales: se sustituirán por fotos reales de Centro Aura manteniendo el mismo nombre de archivo.',
  '',
  ...images.map((i) => `- \`${i.name}.webp\` — https://images.unsplash.com/photo-${i.id}`),
  ''
];
await writeFile(path.join(OUT, 'CREDITOS.md'), credits.join('\n'));
```

Run: `npm run images`
Expected: 10 líneas `✓ <nombre>.webp  <n> KB`.

- [ ] **Step 6: Crear `assets/icons/loto.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 40" width="64" height="40" fill="none" stroke="#D2C244" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
  <path d="M32 5c5.5 7 5.5 20 0 29c-5.5-9-5.5-22 0-29z"/>
  <path d="M32 34c-7-3.5-12-11-12.5-21c6.5 2.5 11 10 12.5 21z"/>
  <path d="M32 34c7-3.5 12-11 12.5-21c-6.5 2.5-11 10-12.5 21z"/>
  <path d="M32 34c-9.5 0.5-19-4-24-12c8.5-1 17.5 3.5 24 12z"/>
  <path d="M32 34c9.5 0.5 19-4 24-12c-8.5-1-17.5 3.5-24 12z"/>
  <path d="M16 38h32"/>
</svg>
```

- [ ] **Step 7: Crear `assets/icons/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#F6F0E4"/>
  <g transform="translate(0 11)" fill="none" stroke="#4A4238" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M32 5c5.5 7 5.5 20 0 29c-5.5-9-5.5-22 0-29z"/>
    <path d="M32 34c-7-3.5-12-11-12.5-21c6.5 2.5 11 10 12.5 21z"/>
    <path d="M32 34c7-3.5 12-11 12.5-21c-6.5 2.5-11 10-12.5 21z"/>
    <path d="M32 34c-9.5 0.5-19-4-24-12c8.5-1 17.5 3.5 24 12z"/>
    <path d="M32 34c9.5 0.5 19-4 24-12c-8.5-1-17.5 3.5-24 12z"/>
  </g>
</svg>
```

- [ ] **Step 8: Ejecutar los tests y comprobar que pasan**

Run: `npm test`
Expected: PASS, 31 tests. Si una imagen no mide lo esperado, cambia el ID en `tools/images.json` por otra foto de Unsplash y vuelve a ejecutar `npm run images`.

- [ ] **Step 9: Commit**

```bash
git add tools/images.json tools/fetch-images.mjs tests/helpers.js tests/assets.test.js assets/
git commit -m "Añade fotos de stock provisionales, iconos de marca y tests de assets

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Sistema visual (CSS base) y comportamiento común (`js/main.js`)

**Files:**
- Modify (reemplazar el archivo vacío): `css/styles.css`, `js/main.js`

**Interfaces:**
- Consumes: `window.AURA_DATA` (Task 2) y `window.AuraLib` (Task 1).
- Produces:
  - **Clases CSS** que usan las páginas: `container`, `section`, `section--alt`, `section-head`, `split`, `split--reverse`, `split__media`, `split__text`, `text-center`, `mt-lg`, `lotus`, `eyebrow`, `title`, `lead`, `quote`, `price`, `actions`, `btn`, `btn--solid`, `btn--light`, `link-arrow`, `hours`, `skip-link`, `visually-hidden`, `site-header`, `site-header--overlay`, `site-header__inner`, `brand`, `brand__name`, `brand__rule`, `brand__tag`, `nav-toggle`, `nav-toggle__bar`, `site-nav`, `site-footer`, `footer-grid`, `footer-claim`, `footer-bottom`, `wa-float`, `page-hero`, `page-hero__bg`, `product-grid`, `product-card`, `product-card__visual`, `product-card__body`, `bottle`, `bottle__brand`, `bottle__name`, `reveal`.
  - **Atributos que procesa `main.js`**: `data-price="<id>"`, `data-duration="<id>"`, `data-saving="<id>"`, `data-phone` (texto; si es `<a>`, también el `href="tel:"`), `data-hours` (en un `<dl>`), `data-wa="<asunto>"` y `data-wa-kind="producto"` (opcional).
  - **IDs y clases de comportamiento**: `.site-header--overlay` (se vuelve sólida con `.is-scrolled` a partir de 40px de scroll), `.nav-toggle` + `#site-menu` (menú móvil; `body.menu-open`), `.reveal` (aparece con `.is-visible`; `html.reveal-ready` solo si hay IntersectionObserver y no se ha pedido reducir el movimiento).
  - En `main.js`, el bloque final de llamadas empieza con la línea `  fillData();` y termina con `  initReveal();`. Las tasks 7 y 9 añaden funciones justo antes de ese bloque.

- [ ] **Step 1: Escribir `css/styles.css`**

```css
/* ==========================================================================
   Centro Aura — hoja de estilos
   1. Tokens · 2. Base · 3. Layout · 4. Componentes · 5. Cabecera, menú y pie
   6. Movimiento · 7+. Estilos por página (se añaden al final)
   ========================================================================== */

/* 1. Tokens ----------------------------------------------------------------- */
:root {
  /* Paleta de la clienta */
  --c-bg: #FFFDF7;
  --c-bg-alt: #F6F0E4;
  --c-line: #E9DDC8;
  --c-muted: #B2A38F;      /* solo decorativo: iconos, números, tapones */
  --c-accent: #D2C244;     /* solo decorativo: loto, filetes, subrayados */
  /* Derivados para accesibilidad (AA) */
  --c-text: #4A4238;
  --c-text-soft: #6B6153;
  --c-border: #8C7F6D;
  --c-error: #9B3D2E;
  --c-overlay: rgba(46, 38, 28, 0.4);

  --f-serif: 'Cormorant Garamond', 'Times New Roman', serif;
  --f-sans: 'Jost', system-ui, -apple-system, 'Segoe UI', sans-serif;

  --fs-hero: clamp(3.5rem, 13vw, 7.5rem);
  --fs-h1: clamp(2.8rem, 8vw, 5rem);
  --fs-h2: clamp(2.2rem, 5vw, 3.4rem);
  --fs-h3: clamp(1.5rem, 3vw, 1.9rem);
  --fs-body: 1.0625rem;
  --fs-lead: 1.1875rem;
  --fs-small: 0.9375rem;
  --fs-label: 0.75rem;

  --space-section: clamp(4rem, 10vw, 9rem);
  --gutter: clamp(1rem, 4vw, 2.5rem);
  --max-w: 1200px;
  --read-w: 62ch;
  --header-h: 76px;
  --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
  --shadow-soft: 0 18px 30px -20px rgba(74, 66, 56, 0.45);
}

/* 2. Base ------------------------------------------------------------------- */
*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }

html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }

body {
  margin: 0;
  overflow-x: clip;
  background: var(--c-bg);
  color: var(--c-text);
  font-family: var(--f-sans);
  font-size: var(--fs-body);
  font-weight: 400;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
body.menu-open { overflow: hidden; }

img, svg, iframe { display: block; max-width: 100%; }
img { height: auto; }
a { color: inherit; }
h1, h2, h3 { margin: 0; font-family: var(--f-serif); font-weight: 400; line-height: 1.1; }
p { margin: 0 0 1em; }
p:last-child { margin-bottom: 0; }
address { font-style: normal; }
ul[role="list"] { margin-block: 0; padding: 0; list-style: none; }
[id] { scroll-margin-top: calc(var(--header-h) + 1.5rem); }
:focus-visible { outline: 2px solid var(--c-text); outline-offset: 3px; }
::selection { background: var(--c-line); }

.skip-link {
  position: absolute; top: -100px; left: 1rem; z-index: 100;
  padding: 0.75rem 1.25rem;
  background: var(--c-text); color: var(--c-bg); text-decoration: none;
}
.skip-link:focus { top: 1rem; }

.visually-hidden {
  position: absolute !important; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* 3. Layout ----------------------------------------------------------------- */
.container { width: min(100% - 2 * var(--gutter), var(--max-w)); margin-inline: auto; }
.section { padding-block: var(--space-section); }
.section--alt { background: var(--c-bg-alt); }
.section-head { max-width: var(--read-w); margin-inline: auto; margin-bottom: clamp(2.5rem, 6vw, 4rem); text-align: center; }
.section-head > p { color: var(--c-text-soft); }

.split { display: grid; gap: clamp(2rem, 6vw, 5rem); align-items: center; }
.split__media img,
.split__media iframe { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border: 0; background: var(--c-line); }
.split__text { text-align: center; }
@media (min-width: 860px) {
  .split { grid-template-columns: 1fr 1fr; }
  .split--reverse > :first-child { order: 2; }
  .split__text { text-align: left; }
  .split__text .lotus { margin-left: 0; }
  .split__text .actions { justify-content: flex-start; }
  .split__text .hours { justify-content: start; }
}

.text-center { text-align: center; }
.mt-lg { margin-top: clamp(2.5rem, 6vw, 4rem); }

/* 4. Componentes ------------------------------------------------------------ */
.lotus { width: 56px; height: auto; margin: 0 auto 1.25rem; }

.eyebrow {
  display: block; margin-bottom: 1rem;
  font-size: var(--fs-label); font-weight: 500; letter-spacing: 0.24em; text-transform: uppercase;
  color: var(--c-text-soft);
}
.title { margin-bottom: 1.25rem; font-size: var(--fs-h2); }
.lead { font-size: var(--fs-lead); font-weight: 300; }
.quote { margin-top: 1.5rem; font-family: var(--f-serif); font-size: clamp(1.35rem, 2.6vw, 1.65rem); font-style: italic; color: var(--c-text-soft); }
.price { font-family: var(--f-serif); font-size: 1.6rem; line-height: 1; white-space: nowrap; }

.actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1rem 1.75rem; margin-top: 2rem; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  min-height: 46px; padding: 0.75rem 1.9rem;
  border: 1px solid var(--c-text); border-radius: 999px;
  background: transparent; color: var(--c-text);
  font: 500 0.78rem/1 var(--f-sans); letter-spacing: 0.2em; text-transform: uppercase;
  text-decoration: none; white-space: nowrap; cursor: pointer;
  transition: background-color 0.3s var(--ease), border-color 0.3s var(--ease), color 0.3s var(--ease);
}
.btn:hover { background: var(--c-line); border-color: var(--c-line); }
.btn--solid { background: var(--c-text); color: var(--c-bg); }
.btn--solid:hover { color: var(--c-text); }
.btn--light { border-color: rgba(255, 253, 247, 0.9); color: var(--c-bg); }
.btn--light:hover { background: var(--c-bg); border-color: var(--c-bg); color: var(--c-text); }

.link-arrow {
  display: inline-block; padding-bottom: 3px;
  border-bottom: 1px solid var(--c-accent);
  font-size: var(--fs-label); font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase;
  text-decoration: none; transition: border-color 0.3s var(--ease);
}
.link-arrow::after { content: ' →'; }
.link-arrow:hover { border-color: var(--c-text); }

.hours { display: grid; grid-template-columns: auto auto; justify-content: center; gap: 0.35rem 1.5rem; margin: 1.5rem 0 0; text-align: left; }
.hours dt { font-weight: 500; }
.hours dd { margin: 0; color: var(--c-text-soft); }

.page-hero {
  position: relative; isolation: isolate; overflow: hidden;
  padding: calc(var(--header-h) + clamp(3.5rem, 9vw, 7rem)) var(--gutter) clamp(3.5rem, 8vw, 6rem);
  text-align: center;
}
.page-hero__bg { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; }
.page-hero::after { content: ''; position: absolute; inset: 0; z-index: -1; background: rgba(255, 253, 247, 0.8); }
.page-hero h1 { font-size: var(--fs-h1); font-weight: 300; }
.page-hero p { max-width: 52ch; margin: 1rem auto 0; color: var(--c-text-soft); font-size: var(--fs-lead); }

.product-grid { display: grid; gap: clamp(1rem, 2.5vw, 1.75rem); grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); }
.product-card { display: flex; flex-direction: column; border: 1px solid var(--c-line); background: var(--c-bg); text-align: center; }
.product-card__visual { display: grid; place-items: center; aspect-ratio: 1; overflow: hidden; background: var(--c-bg-alt); }
.product-card__body { display: flex; flex: 1; flex-direction: column; align-items: center; gap: 0.6rem; padding: 1.5rem 1.25rem 1.75rem; }
.product-card h3 { font-size: 1.55rem; }
.product-card__body > p { margin: 0; color: var(--c-text-soft); font-size: var(--fs-small); }
.product-card .price { margin-top: auto; padding-top: 0.75rem; }
.product-card .btn { margin-top: 0.75rem; }

.bottle {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem;
  width: 30%; aspect-ratio: 1 / 2; margin-top: 12%; padding-inline: 0.4rem;
  border-radius: 22px 22px 12px 12px;
  background: linear-gradient(90deg, #FFFFFF 0%, var(--c-bg) 55%, #EFE7D8 100%);
  box-shadow: var(--shadow-soft);
}
.bottle::before {
  content: ''; position: absolute; bottom: 100%; left: 50%;
  width: 40%; aspect-ratio: 1; border-radius: 6px 6px 2px 2px;
  background: var(--c-muted); transform: translateX(-50%);
}
.bottle__brand { font-family: var(--f-serif); font-size: clamp(1rem, 2.2vw, 1.3rem); letter-spacing: 0.04em; }
.bottle__name { font-size: 0.5rem; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--c-text-soft); }

/* 5. Cabecera, menú y pie --------------------------------------------------- */
.site-header {
  position: fixed; inset: 0 0 auto; z-index: 50; height: var(--header-h);
  background: var(--c-bg); border-bottom: 1px solid var(--c-line);
  transition: background-color 0.35s var(--ease), border-color 0.35s var(--ease), box-shadow 0.35s var(--ease);
}
.site-header--overlay:not(.is-scrolled) { background: transparent; border-bottom-color: transparent; }
.site-header.is-scrolled { box-shadow: 0 8px 24px -20px rgba(74, 66, 56, 0.6); }
.site-header__inner { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; height: 100%; }

.brand { display: inline-flex; flex-direction: column; align-items: center; color: var(--c-text); line-height: 1; text-decoration: none; }
.brand__name { margin-right: -0.3em; font-family: var(--f-serif); font-size: 1.7rem; font-weight: 500; letter-spacing: 0.3em; }
.brand__rule { width: 100%; height: 1px; margin: 0.3rem 0 0.35rem; background: var(--c-accent); }
.brand__tag { font-size: 0.56rem; font-weight: 500; letter-spacing: 0.22em; text-transform: uppercase; }

.site-nav { display: flex; align-items: center; gap: 2.5rem; }
.site-nav ul { display: flex; gap: 2.25rem; margin: 0; padding: 0; list-style: none; }
.site-nav a:not(.btn) {
  padding-block: 0.4rem;
  font-size: 0.8rem; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; text-decoration: none;
  background: linear-gradient(var(--c-accent), var(--c-accent)) left bottom / 0 1px no-repeat;
  transition: background-size 0.35s var(--ease);
}
.site-nav a:not(.btn):hover,
.site-nav a[aria-current="page"] { background-size: 100% 1px; }

.nav-toggle {
  display: none; position: relative; z-index: 60; place-items: center;
  width: 44px; height: 44px; margin-right: -10px; padding: 0;
  border: 0; background: none; color: var(--c-text); cursor: pointer;
}
.nav-toggle__bar,
.nav-toggle__bar::before,
.nav-toggle__bar::after {
  display: block; width: 24px; height: 1px; background: currentColor;
  transition: transform 0.3s var(--ease), background-color 0.3s var(--ease);
}
.nav-toggle__bar { position: relative; }
.nav-toggle__bar::before,
.nav-toggle__bar::after { content: ''; position: absolute; left: 0; }
.nav-toggle__bar::before { top: -7px; }
.nav-toggle__bar::after { top: 7px; }
.nav-toggle[aria-expanded="true"] .nav-toggle__bar { background: transparent; }
.nav-toggle[aria-expanded="true"] .nav-toggle__bar::before { transform: translateY(7px) rotate(45deg); }
.nav-toggle[aria-expanded="true"] .nav-toggle__bar::after { transform: translateY(-7px) rotate(-45deg); }

@media (max-width: 899.98px) {
  .nav-toggle { display: grid; }
  .site-nav {
    position: fixed; inset: 0; z-index: 55;
    flex-direction: column; justify-content: center; gap: 2.5rem;
    background: var(--c-bg); opacity: 0; visibility: hidden;
    transition: opacity 0.35s var(--ease), visibility 0.35s;
  }
  .menu-open .site-nav { opacity: 1; visibility: visible; }
  .site-nav ul { flex-direction: column; align-items: center; gap: 1.25rem; }
  .site-nav a:not(.btn) { font-family: var(--f-serif); font-size: 2.1rem; font-weight: 400; letter-spacing: 0.04em; text-transform: none; }
}

.site-footer { padding-block: clamp(3.5rem, 8vw, 5.5rem) 2rem; background: var(--c-bg-alt); font-size: var(--fs-small); }
.footer-grid { display: grid; gap: 2.5rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.site-footer h2 {
  margin-bottom: 1rem;
  font-family: var(--f-sans); font-size: var(--fs-label); font-weight: 500; letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--c-text-soft);
}
.site-footer ul { display: grid; gap: 0.4rem; margin: 0; padding: 0; list-style: none; }
.site-footer a:not(.brand):not(.link-arrow) { text-decoration: none; }
.site-footer a:not(.brand):not(.link-arrow):hover { text-decoration: underline; text-decoration-color: var(--c-accent); text-underline-offset: 4px; }
.site-footer address { margin-bottom: 1rem; }
.site-footer .hours { justify-content: start; gap: 0.2rem 1rem; margin-top: 0; }
.footer-claim { max-width: 26ch; margin-top: 1.25rem; color: var(--c-text-soft); }
.footer-bottom {
  display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem;
  margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--c-line); color: var(--c-text-soft);
}
.footer-bottom p { margin: 0; }

.wa-float {
  position: fixed; right: 1rem; bottom: 1rem; z-index: 40;
  display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%;
  background: var(--c-text); color: var(--c-bg); box-shadow: 0 12px 24px -10px rgba(74, 66, 56, 0.6);
}
.wa-float svg { width: 26px; height: 26px; }
.menu-open .wa-float { display: none; }
@media (min-width: 900px) { .wa-float { display: none; } }

/* 6. Movimiento ------------------------------------------------------------- */
.reveal-ready .reveal { opacity: 0; transform: translateY(12px); transition: opacity 0.9s var(--ease), transform 0.9s var(--ease); }
.reveal-ready .reveal.is-visible { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

- [ ] **Step 2: Escribir `js/main.js`**

```js
/* Centro Aura — comportamiento de la web.
   Depende de js/data.js (window.AURA_DATA) y js/lib.js (window.AuraLib). */
(function () {
  'use strict';

  const data = window.AURA_DATA;
  const lib = window.AuraLib;
  if (!data || !lib) return;

  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  /* Vuelca precios, duraciones, ahorros, teléfono y horario desde data.js */
  function fillData() {
    $$('[data-price]').forEach((el) => {
      el.textContent = lib.formatPrice(data.items[el.dataset.price]);
    });
    $$('[data-duration]').forEach((el) => {
      const item = data.items[el.dataset.duration];
      if (item && item.duration) el.textContent = item.duration;
    });
    $$('[data-saving]').forEach((el) => {
      el.textContent = lib.formatSaving(data.items[el.dataset.saving]);
    });
    $$('[data-phone]').forEach((el) => {
      el.textContent = data.business.phoneDisplay;
      if (el.tagName === 'A') el.href = 'tel:+' + data.business.phoneDigits;
    });
    $$('[data-hours]').forEach((dl) => {
      dl.replaceChildren(...lib.hoursToRows(data.hours).flatMap((row) => {
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = row.days;
        dd.textContent = row.text;
        return [dt, dd];
      }));
    });
  }

  /* Enlaces de WhatsApp con el mensaje ya escrito */
  function wireWhatsApp() {
    $$('[data-wa]').forEach((el) => {
      const message = lib.waMessage(el.dataset.waKind || 'reserva', el.dataset.wa);
      el.href = lib.buildWaUrl(data.business.phoneDigits, message);
      el.target = '_blank';
      el.rel = 'noopener';
    });
  }

  /* Cabecera transparente sobre el hero que se vuelve sólida al hacer scroll */
  function initHeader() {
    const header = document.querySelector('.site-header--overlay');
    if (!header) return;
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* Menú móvil a pantalla completa: Esc para cerrar y foco atrapado */
  function initMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.getElementById('site-menu');
    if (!toggle || !menu) return;

    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.body.classList.toggle('menu-open', open);
      if (open) menu.querySelector('a').focus();
    };

    toggle.addEventListener('click', () => setOpen(!isOpen()));
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a') && isOpen()) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (!isOpen()) return;
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = [toggle, ...$$('a', menu)];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', (event) => {
      if (event.matches && isOpen()) setOpen(false);
    });
  }

  /* Aparición suave al hacer scroll (desactivada si se pide reducir movimiento) */
  function initReveal() {
    const items = $$('.reveal');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!items.length || reduced || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('reveal-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach((item) => observer.observe(item));
  }

  fillData();
  wireWhatsApp();
  initHeader();
  initMenu();
  initReveal();
})();
```

- [ ] **Step 3: Comprobar la sintaxis y que los tests siguen pasando**

Run: `node --check js/main.js && npm test`
Expected: sin errores de sintaxis; PASS, 31 tests.

- [ ] **Step 4: Commit**

```bash
git add css/styles.css js/main.js
git commit -m "Añade sistema visual (CSS base) y comportamiento común (main.js)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Esqueleto de las 4 páginas (cabecera, pie, hero, SEO básico)

**Files:**
- Modify (reemplazar): `index.html`
- Create: `pages/servicios.html`, `pages/tienda.html`, `pages/contacto.html`, `tests/pages.test.js`

**Interfaces:**
- Consumes: clases CSS y atributos `data-*` de Task 4; fotos e iconos de Task 3.
- Produces: marcadores únicos dentro de `<main>` que las tareas 6–9 reemplazan por su contenido:
  - `index.html`: `    <!-- secciones-inicio -->`
  - `pages/servicios.html`: `    <!-- secciones-servicios -->`
  - `pages/tienda.html`: `    <!-- secciones-tienda -->`
  - `pages/contacto.html`: `    <!-- secciones-contacto -->`

- [ ] **Step 1: Escribir los tests que fallan, en `tests/pages.test.js`**

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, read, pageFiles, webpSize } = require('./helpers.js');
const data = require('../js/data.js');

const all = (html, re) => [...html.matchAll(re)].map((m) => m[1]);
const EXPECTED_PAGES = ['index.html', 'pages/contacto.html', 'pages/servicios.html', 'pages/tienda.html'];

test('existen las 4 páginas', () => {
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
    assert.match(html, /aria-current="page"/);
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
}
```

- [ ] **Step 2: Ejecutar los tests y comprobar que fallan**

Run: `npm test`
Expected: FAIL. "existen las 4 páginas" falla y los tests de `index.html` fallan (el esqueleto actual no tiene título, h1 ni scripts).

- [ ] **Step 3: Escribir `index.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Centro Aura · Spa capilar y tricología en Las Cabezas de San Juan</title>
  <meta name="description" content="Peluquería, spa capilar, consulta tricológica y terapias capilares en Las Cabezas de San Juan (Sevilla). Cosmética natural Jaldún, bonos y tarjetas regalo.">
  <link rel="canonical" href="./">
  <meta name="theme-color" content="#FFFDF7">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_ES">
  <meta property="og:site_name" content="Centro Aura">
  <meta property="og:title" content="Centro Aura · Spa Capilar · Tricología">
  <meta property="og:description" content="Cuidamos tu cabello desde la raíz. Peluquería, spa capilar y tricología en Las Cabezas de San Juan.">
  <meta property="og:image" content="assets/img/hero-salon.webp">
  <link rel="icon" href="assets/icons/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&amp;family=Jost:wght@300;400;500&amp;display=swap">
  <link rel="stylesheet" href="css/styles.css">
  <script src="js/data.js" defer></script>
  <script src="js/lib.js" defer></script>
  <script src="js/main.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>

  <header class="site-header site-header--overlay">
    <div class="container site-header__inner">
      <a class="brand" href="./" aria-label="Centro Aura, inicio">
        <span class="brand__name">AURA</span>
        <span class="brand__rule" aria-hidden="true"></span>
        <span class="brand__tag">Spa Capilar · Tricología</span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="Abrir menú">
        <span class="nav-toggle__bar"></span>
      </button>
      <nav class="site-nav" id="site-menu" aria-label="Principal">
        <ul>
          <li><a href="./" aria-current="page">Inicio</a></li>
          <li><a href="pages/servicios.html">Servicios</a></li>
          <li><a href="pages/tienda.html">Tienda</a></li>
          <li><a href="pages/contacto.html">Contacto</a></li>
        </ul>
        <a class="btn" href="https://wa.me/34610167764" data-wa="">Reservar</a>
      </nav>
    </div>
  </header>

  <main id="contenido">
    <section class="hero" aria-labelledby="hero-title">
      <img class="hero__bg" src="assets/img/hero-salon.webp" alt="" width="2000" height="1333" fetchpriority="high">
      <div class="hero__content">
        <h1 class="hero__title" id="hero-title"><span class="visually-hidden">Centro </span>Aura</h1>
        <hr class="hero__rule">
        <p class="hero__subtitle">Spa Capilar · Tricología</p>
        <div class="actions">
          <a class="btn btn--solid" href="https://wa.me/34610167764" data-wa="">Reservar cita</a>
        </div>
      </div>
      <a class="hero__down" href="#presentacion" aria-label="Bajar a la presentación">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
      </a>
    </section>

    <!-- secciones-inicio -->
  </main>

  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <a class="brand" href="./" aria-label="Centro Aura, inicio">
          <span class="brand__name">AURA</span>
          <span class="brand__rule" aria-hidden="true"></span>
          <span class="brand__tag">Spa Capilar · Tricología</span>
        </a>
        <p class="footer-claim">Peluquería y salud capilar en Las Cabezas de San Juan.</p>
      </div>
      <div>
        <h2>Visítanos</h2>
        <address>C/ Dr. Domingo Gallego, 3<br>41730 Las Cabezas de San Juan<br>Sevilla</address>
        <a class="link-arrow" href="https://www.google.com/maps/search/?api=1&amp;query=C%2F%20Dr.%20Domingo%20Gallego%203%2C%2041730%20Las%20Cabezas%20de%20San%20Juan" target="_blank" rel="noopener">Cómo llegar</a>
      </div>
      <div>
        <h2>Horario</h2>
        <dl class="hours" data-hours>
          <dt>Lunes – Viernes</dt><dd>9:30 – 14:00 · 17:00 – 20:30</dd>
          <dt>Sábado</dt><dd>9:30 – 14:00</dd>
          <dt>Domingo</dt><dd>Cerrado</dd>
        </dl>
      </div>
      <div>
        <h2>Contacto</h2>
        <ul>
          <li><a href="tel:+34610167764" data-phone>+34 610 16 77 64</a></li>
          <li><a href="https://wa.me/34610167764" data-wa="">WhatsApp</a></li>
          <li><a href="https://www.instagram.com/centro__aura/" target="_blank" rel="noopener">Instagram</a></li>
        </ul>
      </div>
      <nav aria-label="Pie de página">
        <h2>Navegación</h2>
        <ul>
          <li><a href="./">Inicio</a></li>
          <li><a href="pages/servicios.html">Servicios</a></li>
          <li><a href="pages/tienda.html">Tienda</a></li>
          <li><a href="pages/contacto.html">Contacto</a></li>
        </ul>
      </nav>
    </div>
    <div class="container footer-bottom">
      <p>© 2026 Centro Aura</p>
      <p><a href="#">Aviso legal</a> · <a href="#">Privacidad</a></p>
    </div>
  </footer>

  <a class="wa-float" href="https://wa.me/34610167764" data-wa="" aria-label="Reservar por WhatsApp">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
  </a>
</body>
</html>
```

- [ ] **Step 4: Escribir `pages/servicios.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Servicios · Spa capilar, tricología y peluquería | Centro Aura</title>
  <meta name="description" content="Consulta tricológica con microcámara, spa capilar, terapias capilares, barros, alisados, cortes y peinados en Centro Aura, Las Cabezas de San Juan.">
  <link rel="canonical" href="servicios.html">
  <meta name="theme-color" content="#FFFDF7">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_ES">
  <meta property="og:site_name" content="Centro Aura">
  <meta property="og:title" content="Servicios · Centro Aura">
  <meta property="og:description" content="Salud capilar, tratamientos y peluquería en Las Cabezas de San Juan.">
  <meta property="og:image" content="../assets/img/servicio-salud.webp">
  <link rel="icon" href="../assets/icons/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&amp;family=Jost:wght@300;400;500&amp;display=swap">
  <link rel="stylesheet" href="../css/styles.css">
  <script src="../js/data.js" defer></script>
  <script src="../js/lib.js" defer></script>
  <script src="../js/main.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>

  <header class="site-header">
    <div class="container site-header__inner">
      <a class="brand" href="../index.html" aria-label="Centro Aura, inicio">
        <span class="brand__name">AURA</span>
        <span class="brand__rule" aria-hidden="true"></span>
        <span class="brand__tag">Spa Capilar · Tricología</span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="Abrir menú">
        <span class="nav-toggle__bar"></span>
      </button>
      <nav class="site-nav" id="site-menu" aria-label="Principal">
        <ul>
          <li><a href="../index.html">Inicio</a></li>
          <li><a href="servicios.html" aria-current="page">Servicios</a></li>
          <li><a href="tienda.html">Tienda</a></li>
          <li><a href="contacto.html">Contacto</a></li>
        </ul>
        <a class="btn" href="https://wa.me/34610167764" data-wa="">Reservar</a>
      </nav>
    </div>
  </header>

  <main id="contenido">
    <section class="page-hero">
      <img class="page-hero__bg" src="../assets/img/textura-lino.webp" alt="" width="2000" height="900" fetchpriority="high">
      <img class="lotus" src="../assets/icons/loto.svg" alt="" width="64" height="40">
      <h1>Servicios</h1>
      <p>Salud capilar, tratamientos y peluquería. Todo empieza por escucharte y mirar tu cuero cabelludo.</p>
    </section>

    <!-- secciones-servicios -->
  </main>

  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <a class="brand" href="../index.html" aria-label="Centro Aura, inicio">
          <span class="brand__name">AURA</span>
          <span class="brand__rule" aria-hidden="true"></span>
          <span class="brand__tag">Spa Capilar · Tricología</span>
        </a>
        <p class="footer-claim">Peluquería y salud capilar en Las Cabezas de San Juan.</p>
      </div>
      <div>
        <h2>Visítanos</h2>
        <address>C/ Dr. Domingo Gallego, 3<br>41730 Las Cabezas de San Juan<br>Sevilla</address>
        <a class="link-arrow" href="https://www.google.com/maps/search/?api=1&amp;query=C%2F%20Dr.%20Domingo%20Gallego%203%2C%2041730%20Las%20Cabezas%20de%20San%20Juan" target="_blank" rel="noopener">Cómo llegar</a>
      </div>
      <div>
        <h2>Horario</h2>
        <dl class="hours" data-hours>
          <dt>Lunes – Viernes</dt><dd>9:30 – 14:00 · 17:00 – 20:30</dd>
          <dt>Sábado</dt><dd>9:30 – 14:00</dd>
          <dt>Domingo</dt><dd>Cerrado</dd>
        </dl>
      </div>
      <div>
        <h2>Contacto</h2>
        <ul>
          <li><a href="tel:+34610167764" data-phone>+34 610 16 77 64</a></li>
          <li><a href="https://wa.me/34610167764" data-wa="">WhatsApp</a></li>
          <li><a href="https://www.instagram.com/centro__aura/" target="_blank" rel="noopener">Instagram</a></li>
        </ul>
      </div>
      <nav aria-label="Pie de página">
        <h2>Navegación</h2>
        <ul>
          <li><a href="../index.html">Inicio</a></li>
          <li><a href="servicios.html">Servicios</a></li>
          <li><a href="tienda.html">Tienda</a></li>
          <li><a href="contacto.html">Contacto</a></li>
        </ul>
      </nav>
    </div>
    <div class="container footer-bottom">
      <p>© 2026 Centro Aura</p>
      <p><a href="#">Aviso legal</a> · <a href="#">Privacidad</a></p>
    </div>
  </footer>

  <a class="wa-float" href="https://wa.me/34610167764" data-wa="" aria-label="Reservar por WhatsApp">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
  </a>
</body>
</html>
```

- [ ] **Step 5: Escribir `pages/tienda.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tienda · Champús Jaldún, bonos y tarjetas regalo | Centro Aura</title>
  <meta name="description" content="Champús naturales Jaldún, bonos de spa capilar y tratamiento tricológico, y tarjetas regalo de Centro Aura. Pídelos por WhatsApp y recógelos en el salón.">
  <link rel="canonical" href="tienda.html">
  <meta name="theme-color" content="#FFFDF7">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_ES">
  <meta property="og:site_name" content="Centro Aura">
  <meta property="og:title" content="Tienda · Centro Aura">
  <meta property="og:description" content="Cosmética natural Jaldún, bonos y tarjetas regalo.">
  <meta property="og:image" content="../assets/img/tarjeta-regalo.webp">
  <link rel="icon" href="../assets/icons/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&amp;family=Jost:wght@300;400;500&amp;display=swap">
  <link rel="stylesheet" href="../css/styles.css">
  <script src="../js/data.js" defer></script>
  <script src="../js/lib.js" defer></script>
  <script src="../js/main.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>

  <header class="site-header">
    <div class="container site-header__inner">
      <a class="brand" href="../index.html" aria-label="Centro Aura, inicio">
        <span class="brand__name">AURA</span>
        <span class="brand__rule" aria-hidden="true"></span>
        <span class="brand__tag">Spa Capilar · Tricología</span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="Abrir menú">
        <span class="nav-toggle__bar"></span>
      </button>
      <nav class="site-nav" id="site-menu" aria-label="Principal">
        <ul>
          <li><a href="../index.html">Inicio</a></li>
          <li><a href="servicios.html">Servicios</a></li>
          <li><a href="tienda.html" aria-current="page">Tienda</a></li>
          <li><a href="contacto.html">Contacto</a></li>
        </ul>
        <a class="btn" href="https://wa.me/34610167764" data-wa="">Reservar</a>
      </nav>
    </div>
  </header>

  <main id="contenido">
    <section class="page-hero">
      <img class="page-hero__bg" src="../assets/img/textura-lino.webp" alt="" width="2000" height="900" fetchpriority="high">
      <img class="lotus" src="../assets/icons/loto.svg" alt="" width="64" height="40">
      <h1>Tienda</h1>
      <p>Cosmética natural Jaldún, bonos para cuidarte a tu ritmo y tarjetas regalo.</p>
      <nav class="chips" aria-label="Secciones de la tienda">
        <a href="#jaldun">Jaldún</a>
        <a href="#bonos">Bonos</a>
        <a href="#tarjetas-regalo">Tarjetas regalo</a>
      </nav>
    </section>

    <!-- secciones-tienda -->
  </main>

  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <a class="brand" href="../index.html" aria-label="Centro Aura, inicio">
          <span class="brand__name">AURA</span>
          <span class="brand__rule" aria-hidden="true"></span>
          <span class="brand__tag">Spa Capilar · Tricología</span>
        </a>
        <p class="footer-claim">Peluquería y salud capilar en Las Cabezas de San Juan.</p>
      </div>
      <div>
        <h2>Visítanos</h2>
        <address>C/ Dr. Domingo Gallego, 3<br>41730 Las Cabezas de San Juan<br>Sevilla</address>
        <a class="link-arrow" href="https://www.google.com/maps/search/?api=1&amp;query=C%2F%20Dr.%20Domingo%20Gallego%203%2C%2041730%20Las%20Cabezas%20de%20San%20Juan" target="_blank" rel="noopener">Cómo llegar</a>
      </div>
      <div>
        <h2>Horario</h2>
        <dl class="hours" data-hours>
          <dt>Lunes – Viernes</dt><dd>9:30 – 14:00 · 17:00 – 20:30</dd>
          <dt>Sábado</dt><dd>9:30 – 14:00</dd>
          <dt>Domingo</dt><dd>Cerrado</dd>
        </dl>
      </div>
      <div>
        <h2>Contacto</h2>
        <ul>
          <li><a href="tel:+34610167764" data-phone>+34 610 16 77 64</a></li>
          <li><a href="https://wa.me/34610167764" data-wa="">WhatsApp</a></li>
          <li><a href="https://www.instagram.com/centro__aura/" target="_blank" rel="noopener">Instagram</a></li>
        </ul>
      </div>
      <nav aria-label="Pie de página">
        <h2>Navegación</h2>
        <ul>
          <li><a href="../index.html">Inicio</a></li>
          <li><a href="servicios.html">Servicios</a></li>
          <li><a href="tienda.html">Tienda</a></li>
          <li><a href="contacto.html">Contacto</a></li>
        </ul>
      </nav>
    </div>
    <div class="container footer-bottom">
      <p>© 2026 Centro Aura</p>
      <p><a href="#">Aviso legal</a> · <a href="#">Privacidad</a></p>
    </div>
  </footer>

  <a class="wa-float" href="https://wa.me/34610167764" data-wa="" aria-label="Reservar por WhatsApp">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
  </a>
</body>
</html>
```

- [ ] **Step 6: Escribir `pages/contacto.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contacto y horario | Centro Aura, Las Cabezas de San Juan</title>
  <meta name="description" content="Teléfono, WhatsApp, horario y cómo llegar a Centro Aura: C/ Dr. Domingo Gallego, 3, Las Cabezas de San Juan (Sevilla). Pide cita o pregúntanos lo que necesites.">
  <link rel="canonical" href="contacto.html">
  <meta name="theme-color" content="#FFFDF7">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_ES">
  <meta property="og:site_name" content="Centro Aura">
  <meta property="og:title" content="Contacto · Centro Aura">
  <meta property="og:description" content="Pide cita por WhatsApp o visítanos en Las Cabezas de San Juan.">
  <meta property="og:image" content="../assets/img/hero-salon.webp">
  <link rel="icon" href="../assets/icons/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&amp;family=Jost:wght@300;400;500&amp;display=swap">
  <link rel="stylesheet" href="../css/styles.css">
  <script src="../js/data.js" defer></script>
  <script src="../js/lib.js" defer></script>
  <script src="../js/main.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>

  <header class="site-header">
    <div class="container site-header__inner">
      <a class="brand" href="../index.html" aria-label="Centro Aura, inicio">
        <span class="brand__name">AURA</span>
        <span class="brand__rule" aria-hidden="true"></span>
        <span class="brand__tag">Spa Capilar · Tricología</span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="Abrir menú">
        <span class="nav-toggle__bar"></span>
      </button>
      <nav class="site-nav" id="site-menu" aria-label="Principal">
        <ul>
          <li><a href="../index.html">Inicio</a></li>
          <li><a href="servicios.html">Servicios</a></li>
          <li><a href="tienda.html">Tienda</a></li>
          <li><a href="contacto.html" aria-current="page">Contacto</a></li>
        </ul>
        <a class="btn" href="https://wa.me/34610167764" data-wa="">Reservar</a>
      </nav>
    </div>
  </header>

  <main id="contenido">
    <section class="page-hero">
      <img class="page-hero__bg" src="../assets/img/textura-lino.webp" alt="" width="2000" height="900" fetchpriority="high">
      <img class="lotus" src="../assets/icons/loto.svg" alt="" width="64" height="40">
      <h1>Contacto</h1>
      <p>Escríbeme, llámame o pásate por el salón. Te respondo lo antes posible.</p>
    </section>

    <!-- secciones-contacto -->
  </main>

  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <a class="brand" href="../index.html" aria-label="Centro Aura, inicio">
          <span class="brand__name">AURA</span>
          <span class="brand__rule" aria-hidden="true"></span>
          <span class="brand__tag">Spa Capilar · Tricología</span>
        </a>
        <p class="footer-claim">Peluquería y salud capilar en Las Cabezas de San Juan.</p>
      </div>
      <div>
        <h2>Visítanos</h2>
        <address>C/ Dr. Domingo Gallego, 3<br>41730 Las Cabezas de San Juan<br>Sevilla</address>
        <a class="link-arrow" href="https://www.google.com/maps/search/?api=1&amp;query=C%2F%20Dr.%20Domingo%20Gallego%203%2C%2041730%20Las%20Cabezas%20de%20San%20Juan" target="_blank" rel="noopener">Cómo llegar</a>
      </div>
      <div>
        <h2>Horario</h2>
        <dl class="hours" data-hours>
          <dt>Lunes – Viernes</dt><dd>9:30 – 14:00 · 17:00 – 20:30</dd>
          <dt>Sábado</dt><dd>9:30 – 14:00</dd>
          <dt>Domingo</dt><dd>Cerrado</dd>
        </dl>
      </div>
      <div>
        <h2>Contacto</h2>
        <ul>
          <li><a href="tel:+34610167764" data-phone>+34 610 16 77 64</a></li>
          <li><a href="https://wa.me/34610167764" data-wa="">WhatsApp</a></li>
          <li><a href="https://www.instagram.com/centro__aura/" target="_blank" rel="noopener">Instagram</a></li>
        </ul>
      </div>
      <nav aria-label="Pie de página">
        <h2>Navegación</h2>
        <ul>
          <li><a href="../index.html">Inicio</a></li>
          <li><a href="servicios.html">Servicios</a></li>
          <li><a href="tienda.html">Tienda</a></li>
          <li><a href="contacto.html">Contacto</a></li>
        </ul>
      </nav>
    </div>
    <div class="container footer-bottom">
      <p>© 2026 Centro Aura</p>
      <p><a href="#">Aviso legal</a> · <a href="#">Privacidad</a></p>
    </div>
  </footer>

  <a class="wa-float" href="https://wa.me/34610167764" data-wa="" aria-label="Reservar por WhatsApp">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
  </a>
</body>
</html>
```

- [ ] **Step 7: Añadir al final de `css/styles.css` los estilos del hero de la portada**

```css

/* 7. Inicio ----------------------------------------------------------------- */
.hero {
  position: relative; isolation: isolate; overflow: hidden;
  display: grid; place-items: center; min-height: 100vh; min-height: 100svh;
  padding: calc(var(--header-h) + 2rem) var(--gutter) 6rem; text-align: center;
}
.hero__bg { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; }
.hero::after {
  content: ''; position: absolute; inset: 0; z-index: -1;
  background: linear-gradient(180deg, rgba(255, 253, 247, 0.78) 0%, rgba(255, 253, 247, 0.55) 45%, rgba(246, 240, 228, 0.85) 100%);
}
.hero__title { margin-right: -0.16em; font-size: var(--fs-hero); font-weight: 300; letter-spacing: 0.16em; line-height: 1; text-transform: uppercase; }
.hero__rule { width: 80px; height: 1px; margin: 1.5rem auto; border: 0; background: var(--c-accent); }
.hero__subtitle {
  margin: 0 -0.36em 0 0;
  font-size: clamp(0.72rem, 2vw, 0.9rem); font-weight: 500; letter-spacing: 0.36em; text-transform: uppercase;
  color: var(--c-text-soft);
}
.hero .actions { margin-top: 2.75rem; }
.hero__down {
  position: absolute; bottom: 1.75rem; left: 50%;
  display: grid; place-items: center; width: 46px; height: 46px;
  border: 1px solid var(--c-text); border-radius: 50%; color: var(--c-text);
  transform: translateX(-50%); transition: background-color 0.3s var(--ease);
}
.hero__down:hover { background: var(--c-line); }
.hero__down svg { width: 18px; height: 18px; }
```

- [ ] **Step 8: Añadir al final de `css/styles.css` los estilos de los chips de la tienda (se usan en la cabecera de página)**

```css

/* 9. Tienda ----------------------------------------------------------------- */
.chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; margin-top: 2rem; }
.chips a {
  padding: 0.55rem 1.25rem; border: 1px solid var(--c-text-soft); border-radius: 999px;
  font-size: var(--fs-label); font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; text-decoration: none;
  transition: background-color 0.3s var(--ease);
}
.chips a:hover { background: var(--c-line); }
```

- [ ] **Step 9: Ejecutar los tests y comprobar que pasan**

Run: `npm test`
Expected: PASS. Todos los tests de las 4 páginas en verde (8 por página + "existen las 4 páginas").

- [ ] **Step 10: Commit**

```bash
git add index.html pages/ css/styles.css tests/pages.test.js
git commit -m "Añade el esqueleto de las 4 páginas: cabecera, pie, hero y SEO básico

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Página de Inicio (secciones y datos estructurados)

**Files:**
- Modify: `index.html` (reemplazar el marcador `    <!-- secciones-inicio -->` y añadir el JSON-LD al `<head>`), `css/styles.css` (añadir al final)
- Create: `tests/inicio.test.js`

**Interfaces:**
- Consumes: clases y atributos de las tasks 4 y 5; IDs de servicio `spa-capilar`, `consulta-tricologica` y `terapias-capilares` (que la Task 7 crea en `pages/servicios.html`) y el ancla `pages/tienda.html#tarjetas-regalo` (Task 5).
- Produces: `index.html` completo, con `<script type="application/ld+json">` de tipo `HairSalon`.

- [ ] **Step 1: Escribir los tests que fallan, en `tests/inicio.test.js`**

```js
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

test('JSON-LD: el horario coincide con data.js', () => {
  const pad = (t) => t.trim().padStart(5, '0');
  const fromData = new Set(data.hours.flatMap((h) => h.slots.map((s) => s.split('–').map(pad).join('-'))));
  const fromLd = new Set(ld.openingHoursSpecification.map((o) => `${o.opens}-${o.closes}`));
  assert.deepEqual([...fromLd].sort(), [...fromData].sort());
});
```

- [ ] **Step 2: Ejecutar los tests y comprobar que fallan**

Run: `npm test`
Expected: FAIL. `inicio.test.js` no carga porque no encuentra el JSON-LD (`Cannot read properties of null`).

- [ ] **Step 3: En `index.html`, reemplazar la línea `    <!-- secciones-inicio -->` por:**

```html
    <section class="section" id="presentacion" aria-labelledby="intro-title">
      <div class="container section-head reveal">
        <img class="lotus" src="assets/icons/loto.svg" alt="" width="64" height="40">
        <span class="eyebrow">Peluquería · Salud capilar</span>
        <h2 class="title" id="intro-title">Centro Aura</h2>
        <p class="lead">En Aura cuidamos el cabello desde donde nace: el cuero cabelludo. Unimos la peluquería de siempre con la tricología y los rituales de spa capilar para que tu pelo, además de bonito, esté sano.</p>
        <p class="quote">«La energía del interior y la que envuelve al cuerpo físico.»</p>
      </div>
      <div class="container feature-grid">
        <a class="feature-card reveal" href="pages/servicios.html#spa-capilar">
          <img src="assets/img/destacado-spa.webp" alt="Masaje relajante en el cuero cabelludo durante un spa capilar" width="900" height="1125" loading="lazy">
          <div>
            <h3>Spa Capilar</h3>
            <span class="btn btn--light">Ver más</span>
          </div>
        </a>
        <a class="feature-card reveal" href="pages/servicios.html#consulta-tricologica">
          <img src="assets/img/destacado-tricologia.webp" alt="Revisión del cuero cabelludo separando el cabello con guantes" width="900" height="1125" loading="lazy">
          <div>
            <h3>Consulta Tricológica</h3>
            <span class="btn btn--light">Ver más</span>
          </div>
        </a>
        <a class="feature-card reveal" href="pages/servicios.html#terapias-capilares">
          <img src="assets/img/destacado-terapias.webp" alt="Terapia capilar con masaje suave en la cabeza" width="900" height="1125" loading="lazy">
          <div>
            <h3>Terapias Capilares</h3>
            <span class="btn btn--light">Ver más</span>
          </div>
        </a>
      </div>
    </section>

    <section class="section section--alt" aria-labelledby="paula-title">
      <div class="container about">
        <div class="about__portrait reveal">
          <img src="assets/img/paula-retrato.webp" alt="Paula, peluquera y fundadora de Centro Aura" width="640" height="640" loading="lazy">
        </div>
        <div class="about__text reveal">
          <span class="eyebrow">Peluquera titulada · Fundadora</span>
          <h2 class="title" id="paula-title">Hola, soy Paula</h2>
          <p>Soy peluquera titulada y me especialicé en tricología porque un buen corte no basta si el cuero cabelludo no está sano. Aura nace de esa idea: un espacio tranquilo donde miramos tu pelo con calma, entendemos qué necesita y lo tratamos con cosmética natural.</p>
          <p>Aquí no hay prisas. Cada visita empieza escuchándote.</p>
          <a class="link-arrow" href="https://www.instagram.com/centro__aura/" target="_blank" rel="noopener">Sígueme en Instagram</a>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="jaldun-title">
      <div class="container section-head reveal">
        <img class="lotus" src="assets/icons/loto.svg" alt="" width="64" height="40">
        <span class="eyebrow">Cosmética natural</span>
        <h2 class="title" id="jaldun-title">Salud capilar Jaldún</h2>
        <p>Trabajamos con Jaldún, fitoterapia capilar que devuelve al cuero cabelludo su equilibrio natural. Después de la consulta te recomendamos el que necesitas.</p>
      </div>
      <ul class="container product-grid" role="list">
        <li class="product-card reveal">
          <div class="product-card__visual" aria-hidden="true">
            <div class="bottle"><span class="bottle__brand">Jaldún</span><span class="bottle__name">Equilibrante</span></div>
          </div>
          <div class="product-card__body">
            <h3>Champú Equilibrante</h3>
            <p>Caspa y exceso de grasa</p>
          </div>
        </li>
        <li class="product-card reveal">
          <div class="product-card__visual" aria-hidden="true">
            <div class="bottle"><span class="bottle__brand">Jaldún</span><span class="bottle__name">Vitalzen</span></div>
          </div>
          <div class="product-card__body">
            <h3>Champú Vitalzen Fortificante</h3>
            <p>Caída del cabello</p>
          </div>
        </li>
        <li class="product-card reveal">
          <div class="product-card__visual" aria-hidden="true">
            <div class="bottle"><span class="bottle__brand">Jaldún</span><span class="bottle__name">Multiefecto</span></div>
          </div>
          <div class="product-card__body">
            <h3>Champú Multiefecto Regulador</h3>
            <p>Cuero cabelludo sensible</p>
          </div>
        </li>
      </ul>
      <div class="container text-center mt-lg">
        <a class="btn" href="pages/tienda.html">Ver tienda</a>
      </div>
    </section>

    <section class="section section--alt" aria-labelledby="regalo-title">
      <div class="container split">
        <div class="split__media reveal">
          <img src="assets/img/tarjeta-regalo.webp" alt="Flores secas sobre un paño de lino claro" width="1200" height="900" loading="lazy">
        </div>
        <div class="split__text reveal">
          <img class="lotus" src="assets/icons/loto.svg" alt="" width="64" height="40">
          <span class="eyebrow">Un detalle con sentido</span>
          <h2 class="title" id="regalo-title">Regala Aura</h2>
          <p>Una tarjeta regalo para un spa capilar, un tratamiento o el importe que prefieras. La preparamos a mano y la recoges en el salón.</p>
          <div class="actions">
            <a class="btn btn--solid" href="https://wa.me/34610167764" data-wa="Tarjeta regalo" data-wa-kind="producto">Pedir tarjeta regalo</a>
            <a class="link-arrow" href="pages/tienda.html#tarjetas-regalo">Ver importes</a>
          </div>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="visita-title">
      <div class="container split split--reverse">
        <div class="split__media reveal">
          <iframe src="https://www.google.com/maps?q=C%2F%20Dr.%20Domingo%20Gallego%203%2C%2041730%20Las%20Cabezas%20de%20San%20Juan&amp;output=embed" title="Mapa: Centro Aura en C/ Dr. Domingo Gallego, 3, Las Cabezas de San Juan" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
        <div class="split__text reveal">
          <img class="lotus" src="assets/icons/loto.svg" alt="" width="64" height="40">
          <span class="eyebrow">Visítanos</span>
          <h2 class="title" id="visita-title">Te esperamos en Las Cabezas</h2>
          <address>C/ Dr. Domingo Gallego, 3<br>41730 Las Cabezas de San Juan, Sevilla</address>
          <dl class="hours" data-hours>
            <dt>Lunes – Viernes</dt><dd>9:30 – 14:00 · 17:00 – 20:30</dd>
            <dt>Sábado</dt><dd>9:30 – 14:00</dd>
            <dt>Domingo</dt><dd>Cerrado</dd>
          </dl>
          <div class="actions">
            <a class="btn" href="https://www.google.com/maps/search/?api=1&amp;query=C%2F%20Dr.%20Domingo%20Gallego%203%2C%2041730%20Las%20Cabezas%20de%20San%20Juan" target="_blank" rel="noopener">Cómo llegar</a>
            <a class="link-arrow" href="tel:+34610167764" data-phone>+34 610 16 77 64</a>
          </div>
        </div>
      </div>
    </section>
```

- [ ] **Step 4: En `index.html`, añadir el JSON-LD justo antes de `</head>`**

```html
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "name": "Centro Aura — Spa Capilar · Tricología",
    "description": "Peluquería, spa capilar, consulta tricológica y terapias capilares con cosmética natural Jaldún.",
    "image": "assets/img/hero-salon.webp",
    "telephone": "+34610167764",
    "priceRange": "€€",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "C/ Dr. Domingo Gallego, 3",
      "addressLocality": "Las Cabezas de San Juan",
      "addressRegion": "Sevilla",
      "postalCode": "41730",
      "addressCountry": "ES"
    },
    "geo": { "@type": "GeoCoordinates", "latitude": 36.9853, "longitude": -5.9395 },
    "openingHoursSpecification": [
      { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "09:30", "closes": "14:00" },
      { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "17:00", "closes": "20:30" },
      { "@type": "OpeningHoursSpecification", "dayOfWeek": "Saturday", "opens": "09:30", "closes": "14:00" }
    ],
    "sameAs": ["https://www.instagram.com/centro__aura/"]
  }
  </script>
```

- [ ] **Step 5: Añadir al final de `css/styles.css` (debajo del bloque «7. Inicio»; el orden entre bloques no importa)**

```css

/* 7b. Inicio: destacados y Paula -------------------------------------------- */
.feature-grid { display: grid; gap: clamp(1rem, 2vw, 1.5rem); grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.feature-card {
  position: relative; isolation: isolate; overflow: hidden;
  display: grid; place-items: center; aspect-ratio: 4 / 5; padding: 1.5rem;
  color: var(--c-bg); text-align: center; text-decoration: none;
}
.feature-card img { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; transition: transform 0.9s var(--ease); }
.feature-card::after { content: ''; position: absolute; inset: 0; z-index: -1; background: var(--c-overlay); transition: background-color 0.4s var(--ease); }
.feature-card h3 { margin-bottom: 1.25rem; color: var(--c-bg); font-size: clamp(1.9rem, 3.2vw, 2.4rem); text-shadow: 0 1px 12px rgba(46, 38, 28, 0.35); }
.feature-card:hover img { transform: scale(1.05); }
.feature-card:hover::after { background: rgba(46, 38, 28, 0.5); }
.feature-card:hover .btn--light { background: var(--c-bg); border-color: var(--c-bg); color: var(--c-text); }

.about { display: grid; gap: clamp(2.5rem, 6vw, 5rem); align-items: center; text-align: center; }
.about__portrait {
  width: min(340px, 72vw); aspect-ratio: 1; margin-inline: auto; overflow: hidden; border-radius: 50%;
  background: var(--c-line); box-shadow: 0 0 0 12px var(--c-bg-alt), 0 0 0 13px var(--c-line);
}
.about__portrait img { width: 100%; height: 100%; object-fit: cover; }
.about__text p { max-width: 54ch; margin-inline: auto; }
.about__text .link-arrow { margin-top: 1.5rem; }
@media (min-width: 800px) {
  .about { grid-template-columns: minmax(260px, 380px) 1fr; text-align: left; }
  .about__text p { margin-inline: 0; }
}
```

- [ ] **Step 6: Ejecutar los tests y comprobar que pasan**

Run: `npm test`
Expected: PASS, incluidos los 5 tests de `inicio.test.js`.

- [ ] **Step 7: Commit**

```bash
git add index.html css/styles.css tests/inicio.test.js
git commit -m "Completa la portada: presentación, destacados, Paula, Jaldún, regalo, mapa y JSON-LD

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Página de Servicios (pestañas por categoría)

**Files:**
- Modify: `pages/servicios.html` (reemplazar el marcador `    <!-- secciones-servicios -->`), `css/styles.css` (añadir al final), `js/main.js` (añadir `initTabs`)
- Create: `tests/servicios.test.js`

**Interfaces:**
- Consumes: `lib.categoryOf(items, id)` (Task 1), `data.items` (Task 2), `$$` de `main.js` (Task 4).
- Produces: `<li class="service" id="<id>">` para los 8 servicios. Pestañas `button[role="tab"][data-category]` con `aria-controls="panel-<categoría>"`. El hash `#<id-servicio>` abre la pestaña de su categoría.

- [ ] **Step 1: Escribir los tests que fallan, en `tests/servicios.test.js`**

```js
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
```

- [ ] **Step 2: Ejecutar los tests y comprobar que fallan**

Run: `npm test`
Expected: FAIL. Fallan "marcador reemplazado", "cada servicio tiene bloque…", "pestañas…" y "enlaces a servicios.html#id" (los enlaces de la portada todavía no tienen destino).

- [ ] **Step 3: En `pages/servicios.html`, reemplazar la línea `    <!-- secciones-servicios -->` por:**

```html
    <section class="section" aria-label="Carta de servicios">
      <div class="container">
        <div class="tabs" role="tablist" aria-label="Categorías de servicios" hidden>
          <button class="tab" type="button" role="tab" id="tab-salud" aria-controls="panel-salud" aria-selected="true" data-category="salud">Salud capilar</button>
          <button class="tab" type="button" role="tab" id="tab-tratamientos" aria-controls="panel-tratamientos" aria-selected="false" tabindex="-1" data-category="tratamientos">Tratamientos</button>
          <button class="tab" type="button" role="tab" id="tab-peluqueria" aria-controls="panel-peluqueria" aria-selected="false" tabindex="-1" data-category="peluqueria">Peluquería</button>
        </div>

        <div class="categories">
          <div class="category" id="panel-salud" role="tabpanel" aria-labelledby="tab-salud">
            <div class="category__media reveal">
              <img src="../assets/img/servicio-salud.webp" alt="Masaje en el cuero cabelludo con la clienta relajada" width="1000" height="1250" loading="lazy">
            </div>
            <div>
              <h2 class="category__title">Salud capilar</h2>
              <p class="category__intro">El corazón de Aura: cuidar el cabello desde la raíz.</p>
              <ul class="service-list" role="list">
                <li class="service" id="consulta-tricologica">
                  <div>
                    <h3>Consulta tricológica</h3>
                    <p>Analizamos tu cuero cabelludo con microcámara para ver qué pasa de verdad: grasa, caspa, sensibilidad o caída. Sales con un diagnóstico claro y un plan pensado para ti.</p>
                  </div>
                  <div class="service__meta">
                    <span class="service__duration" data-duration="consulta-tricologica">45 min</span>
                    <span class="price" data-price="consulta-tricologica">30 €</span>
                    <a class="btn" href="https://wa.me/34610167764" data-wa="Consulta tricológica">Reservar</a>
                  </div>
                </li>
                <li class="service" id="spa-capilar">
                  <div>
                    <h3>Spa capilar</h3>
                    <p>Limpieza profunda, exfoliación suave, masaje y mascarilla en un ritual para desconectar. Tu cuero cabelludo respira y tu pelo lo nota desde el primer día.</p>
                  </div>
                  <div class="service__meta">
                    <span class="service__duration" data-duration="spa-capilar">60 min</span>
                    <span class="price" data-price="spa-capilar">desde 35 €</span>
                    <a class="btn" href="https://wa.me/34610167764" data-wa="Spa capilar">Reservar</a>
                  </div>
                </li>
                <li class="service" id="terapias-capilares">
                  <div>
                    <h3>Terapias capilares</h3>
                    <p>Tratamientos específicos para la caída, el exceso de grasa, la caspa o la sensibilidad, con activos naturales y sesiones de seguimiento.</p>
                  </div>
                  <div class="service__meta">
                    <span class="service__duration" data-duration="terapias-capilares">60 min</span>
                    <span class="price" data-price="terapias-capilares">desde 40 €</span>
                    <a class="btn" href="https://wa.me/34610167764" data-wa="Terapias capilares">Reservar</a>
                  </div>
                </li>
                <li class="service" id="barros">
                  <div>
                    <h3>Barros naturales</h3>
                    <p>Arcillas y barros que depuran, calman y equilibran el cuero cabelludo. Ideales para pelo graso o con tendencia a la caspa.</p>
                  </div>
                  <div class="service__meta">
                    <span class="service__duration" data-duration="barros">45 min</span>
                    <span class="price" data-price="barros">desde 30 €</span>
                    <a class="btn" href="https://wa.me/34610167764" data-wa="Barros naturales">Reservar</a>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div class="category" id="panel-tratamientos" role="tabpanel" aria-labelledby="tab-tratamientos">
            <div class="category__media reveal">
              <img src="../assets/img/servicio-tratamientos.webp" alt="Melena larga, lisa y brillante vista de espaldas" width="1000" height="1250" loading="lazy">
            </div>
            <div>
              <h2 class="category__title">Tratamientos</h2>
              <p class="category__intro">Para que tu pelo recupere suavidad, brillo y fuerza.</p>
              <ul class="service-list" role="list">
                <li class="service" id="alisados">
                  <div>
                    <h3>Alisados</h3>
                    <p>Alisados que respetan la fibra y dejan el pelo suave, brillante y fácil de peinar durante semanas.</p>
                  </div>
                  <div class="service__meta">
                    <span class="service__duration" data-duration="alisados">2–3 h</span>
                    <span class="price" data-price="alisados">desde 90 €</span>
                    <a class="btn" href="https://wa.me/34610167764" data-wa="Alisados">Reservar</a>
                  </div>
                </li>
                <li class="service" id="hidratacion">
                  <div>
                    <h3>Hidratación y reparación</h3>
                    <p>Recupera la hidratación y la fuerza del pelo seco, dañado o castigado por el tinte y el calor.</p>
                  </div>
                  <div class="service__meta">
                    <span class="service__duration" data-duration="hidratacion">45 min</span>
                    <span class="price" data-price="hidratacion">desde 25 €</span>
                    <a class="btn" href="https://wa.me/34610167764" data-wa="Hidratación y reparación">Reservar</a>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div class="category" id="panel-peluqueria" role="tabpanel" aria-labelledby="tab-peluqueria">
            <div class="category__media reveal">
              <img src="../assets/img/servicio-peluqueria.webp" alt="Peluquera peinando a una clienta en el salón" width="1000" height="1250" loading="lazy">
            </div>
            <div>
              <h2 class="category__title">Peluquería</h2>
              <p class="category__intro">Cortes y peinados con el mismo mimo que todo lo demás.</p>
              <ul class="service-list" role="list">
                <li class="service" id="corte">
                  <div>
                    <h3>Corte y peinado</h3>
                    <p>Un corte que tiene en cuenta tu tipo de pelo, tu día a día y cómo te gusta llevarlo.</p>
                  </div>
                  <div class="service__meta">
                    <span class="service__duration" data-duration="corte">45 min</span>
                    <span class="price" data-price="corte">desde 18 €</span>
                    <a class="btn" href="https://wa.me/34610167764" data-wa="Corte y peinado">Reservar</a>
                  </div>
                </li>
                <li class="service" id="peinados">
                  <div>
                    <h3>Peinados y recogidos</h3>
                    <p>Ondas, recogidos y peinados para bodas, eventos o para sentirte especial un día cualquiera.</p>
                  </div>
                  <div class="service__meta">
                    <span class="service__duration" data-duration="peinados">60 min</span>
                    <span class="price" data-price="peinados">desde 25 €</span>
                    <a class="btn" href="https://wa.me/34610167764" data-wa="Peinados y recogidos">Reservar</a>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--alt" aria-labelledby="consulta-title">
      <div class="container section-head reveal">
        <img class="lotus" src="../assets/icons/loto.svg" alt="" width="64" height="40">
        <span class="eyebrow">Paso a paso</span>
        <h2 class="title" id="consulta-title">¿Cómo es una consulta tricológica?</h2>
      </div>
      <ol class="container steps">
        <li class="step reveal">
          <h3>Diagnóstico con microcámara</h3>
          <p>Vemos tu cuero cabelludo ampliado en pantalla y te explico lo que encontramos.</p>
        </li>
        <li class="step reveal">
          <h3>Plan personalizado</h3>
          <p>Elegimos el tratamiento en cabina y los productos para casa según lo que necesita tu piel.</p>
        </li>
        <li class="step reveal">
          <h3>Seguimiento</h3>
          <p>Revisamos cómo evoluciona y ajustamos el plan hasta ver resultados.</p>
        </li>
      </ol>
    </section>

    <section class="section" aria-labelledby="dudas-title">
      <div class="container section-head reveal">
        <h2 class="title" id="dudas-title">¿Dudas sobre qué necesita tu cabello?</h2>
        <p>Cuéntamelo y lo vemos, sin compromiso.</p>
        <div class="actions">
          <a class="btn btn--solid" href="contacto.html#formulario">Escríbeme</a>
        </div>
      </div>
    </section>
```

> Nota: el enlace `contacto.html#formulario` apunta a un id que crea la Task 9. El test de enlaces locales comprueba solo el archivo, no el ancla, así que la Task 7 pasa igual.

- [ ] **Step 4: Añadir al final de `css/styles.css`**

```css

/* 8. Servicios -------------------------------------------------------------- */
.tabs { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; margin-bottom: clamp(2.5rem, 6vw, 4rem); }
.tab {
  min-height: 46px; padding: 0.7rem 1.5rem;
  border: 1px solid transparent; border-radius: 999px; background: none; color: var(--c-text-soft);
  font: 500 0.78rem/1 var(--f-sans); letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer;
  transition: background-color 0.3s var(--ease), color 0.3s var(--ease), border-color 0.3s var(--ease);
}
.tab:hover { border-color: var(--c-line); color: var(--c-text); }
.tab[aria-selected="true"] { background: var(--c-line); color: var(--c-text); }

.categories { display: grid; gap: var(--space-section); }
.category { display: grid; gap: clamp(2rem, 5vw, 4.5rem); }
.category__media img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.category__title { margin-bottom: 0.75rem; font-size: var(--fs-h2); }
.category__intro { color: var(--c-text-soft); font-size: var(--fs-lead); }
@media (min-width: 960px) {
  .category { grid-template-columns: 5fr 7fr; align-items: start; }
  .category__media { position: sticky; top: calc(var(--header-h) + 2rem); }
  .category__media img { aspect-ratio: 4 / 5; }
}

.service-list { margin-top: 1.5rem; border-top: 1px solid var(--c-line); }
.service { display: grid; gap: 1rem 2rem; padding-block: 1.9rem; border-bottom: 1px solid var(--c-line); }
.service h3 { margin-bottom: 0.4rem; font-size: var(--fs-h3); }
.service p { max-width: 54ch; margin: 0; color: var(--c-text-soft); }
.service__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.5rem; }
.service__duration { color: var(--c-text-soft); font-size: var(--fs-small); white-space: nowrap; }
@media (min-width: 700px) {
  .service { grid-template-columns: 1fr auto; align-items: center; }
  .service__meta { flex-direction: column; align-items: flex-end; gap: 0.6rem; }
}

.steps { display: grid; gap: 2.5rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); padding: 0; list-style: none; counter-reset: paso; }
.step { text-align: center; }
.step::before {
  content: counter(paso, decimal-leading-zero); counter-increment: paso;
  display: block; margin-bottom: 1rem;
  font-family: var(--f-serif); font-size: 3.2rem; line-height: 1; color: var(--c-muted);
}
.step h3 { margin-bottom: 0.6rem; font-size: 1.6rem; }
.step p { max-width: 32ch; margin-inline: auto; color: var(--c-text-soft); }
```

- [ ] **Step 5: En `js/main.js`, insertar `initTabs` justo antes de la línea `  fillData();` (la llamada final, no la definición)**

```js
  /* Pestañas de Servicios: sin JS se ven las tres categorías apiladas */
  function initTabs() {
    const tablist = document.querySelector('[role="tablist"]');
    if (!tablist) return;
    const tabs = $$('[role="tab"]', tablist);
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));

    const select = (tab, moveFocus) => {
      tabs.forEach((t, i) => {
        const active = t === tab;
        t.setAttribute('aria-selected', String(active));
        t.tabIndex = active ? 0 : -1;
        panels[i].hidden = !active;
      });
      if (moveFocus) tab.focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (event) => {
        const last = tabs.length - 1;
        const target = {
          ArrowRight: tabs[i === last ? 0 : i + 1],
          ArrowLeft: tabs[i === 0 ? last : i - 1],
          Home: tabs[0],
          End: tabs[last]
        }[event.key];
        if (!target) return;
        event.preventDefault();
        select(target, true);
      });
    });

    const openFromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const category = lib.categoryOf(data.items, id);
      const tab = tabs.find((t) => t.dataset.category === category);
      select(tab || tabs[0], false);
      if (tab) document.getElementById(id).scrollIntoView({ block: 'start' });
    };

    tablist.hidden = false;
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
  }

```

Y en el bloque de llamadas del final, añadir `initTabs();` después de `initMenu();`:

```js
  fillData();
  wireWhatsApp();
  initHeader();
  initMenu();
  initTabs();
  initReveal();
```

- [ ] **Step 6: Comprobar la sintaxis y ejecutar los tests**

Run: `node --check js/main.js && npm test`
Expected: PASS, incluidos los 5 tests de `servicios.test.js`.

- [ ] **Step 7: Commit**

```bash
git add pages/servicios.html css/styles.css js/main.js tests/servicios.test.js
git commit -m "Añade la página de Servicios con pestañas por categoría y pasos de la consulta

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Página de Tienda (Jaldún, bonos y tarjetas regalo)

**Files:**
- Modify: `pages/tienda.html` (reemplazar el marcador `    <!-- secciones-tienda -->`), `css/styles.css` (añadir al final)
- Create: `tests/tienda.test.js`

**Interfaces:**
- Consumes: `data.items` de tipo `producto`, `bono` y `regalo` (Task 2); `product-card` y `bottle` (Task 4); `data-saving` (Task 4).
- Produces: las secciones `#jaldun`, `#bonos` y `#tarjetas-regalo` (destinos de los chips de la Task 5 y del enlace «Ver importes» de la Task 6).

- [ ] **Step 1: Escribir los tests que fallan, en `tests/tienda.test.js`**

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { read } = require('./helpers.js');
const data = require('../js/data.js');

const html = read('pages/tienda.html');
const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));

test('tienda: marcador reemplazado y secciones con ancla', () => {
  assert.ok(!html.includes('<!-- secciones-tienda -->'));
  for (const id of ['jaldun', 'bonos', 'tarjetas-regalo']) assert.match(html, new RegExp(`<section[^>]*id="${id}"`));
});

test('tienda: todos los productos, bonos y tarjetas de data.js tienen precio en la página', () => {
  for (const [id, item] of Object.entries(data.items)) {
    if (item.type === 'servicio') continue;
    assert.match(html, new RegExp(`data-price="${id}"`), id);
  }
});

test('tienda: los bonos muestran el ahorro', () => {
  for (const [id, item] of Object.entries(data.items)) {
    if (item.type === 'bono') assert.match(html, new RegExp(`data-saving="${id}"`), id);
  }
});

test('tienda: los botones de compra usan el mensaje de producto', () => {
  const tags = main.match(/<a\b[^>]*data-wa="[^"]+"[^>]*>/g) || [];
  assert.equal(tags.length, 9);
  for (const tag of tags) assert.match(tag, /data-wa-kind="producto"/, tag);
});

test('tienda: aviso de recogida en el salón', () => {
  assert.match(html, /Recogida en el salón\. Te confirmamos disponibilidad por WhatsApp\./);
});
```

- [ ] **Step 2: Ejecutar los tests y comprobar que fallan**

Run: `npm test`
Expected: FAIL. Fallan los 5 tests de `tienda.test.js`.

- [ ] **Step 3: En `pages/tienda.html`, reemplazar la línea `    <!-- secciones-tienda -->` por:**

```html
    <p class="note">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      Recogida en el salón. Te confirmamos disponibilidad por WhatsApp.
    </p>

    <section class="section" id="jaldun" aria-labelledby="jaldun-title">
      <div class="container section-head reveal">
        <span class="eyebrow">Cosmética natural</span>
        <h2 class="title" id="jaldun-title">Champús Jaldún</h2>
        <p>Fitoterapia capilar que devuelve al cuero cabelludo su equilibrio natural. Si no sabes cuál es el tuyo, pregúntame.</p>
      </div>
      <ul class="container product-grid" role="list">
        <li class="product-card reveal">
          <div class="product-card__visual" aria-hidden="true">
            <div class="bottle"><span class="bottle__brand">Jaldún</span><span class="bottle__name">Equilibrante</span></div>
          </div>
          <div class="product-card__body">
            <h3>Champú Equilibrante</h3>
            <p>Para caspa y exceso de grasa. Equilibra el cuero cabelludo con árbol de té, sauce y aloe vera.</p>
            <span class="price" data-price="jaldun-equilibrante">22 €</span>
            <a class="btn" href="https://wa.me/34610167764" data-wa="Champú Equilibrante Jaldún" data-wa-kind="producto">Lo quiero</a>
          </div>
        </li>
        <li class="product-card reveal">
          <div class="product-card__visual" aria-hidden="true">
            <div class="bottle"><span class="bottle__brand">Jaldún</span><span class="bottle__name">Vitalzen</span></div>
          </div>
          <div class="product-card__body">
            <h3>Champú Vitalzen Fortificante</h3>
            <p>Para la caída. Estimula la microcirculación y fortalece el cabello desde la raíz.</p>
            <span class="price" data-price="jaldun-vitalzen">24 €</span>
            <a class="btn" href="https://wa.me/34610167764" data-wa="Champú Vitalzen Fortificante Jaldún" data-wa-kind="producto">Lo quiero</a>
          </div>
        </li>
        <li class="product-card reveal">
          <div class="product-card__visual" aria-hidden="true">
            <div class="bottle"><span class="bottle__brand">Jaldún</span><span class="bottle__name">Multiefecto</span></div>
          </div>
          <div class="product-card__body">
            <h3>Champú Multiefecto Regulador</h3>
            <p>Para cuero cabelludo sensible o desequilibrado. Con limón y aguacate: calma, regula e hidrata.</p>
            <span class="price" data-price="jaldun-multiefecto">22 €</span>
            <a class="btn" href="https://wa.me/34610167764" data-wa="Champú Multiefecto Regulador Jaldún" data-wa-kind="producto">Lo quiero</a>
          </div>
        </li>
      </ul>
    </section>

    <section class="section section--alt" id="bonos" aria-labelledby="bonos-title">
      <div class="container section-head reveal">
        <img class="lotus" src="../assets/icons/loto.svg" alt="" width="64" height="40">
        <span class="eyebrow">Cuídate a tu ritmo</span>
        <h2 class="title" id="bonos-title">Bonos</h2>
        <p>Los tratamientos capilares funcionan mejor con constancia. Con un bono te sale más a cuenta.</p>
      </div>
      <ul class="container bono-grid" role="list">
        <li class="bono reveal">
          <h3>Bono Spa Capilar</h3>
          <p>Cinco rituales de spa capilar para disfrutar a tu ritmo.</p>
          <span class="badge" data-saving="bono-spa-5">ahorras 25 €</span>
          <span class="price" data-price="bono-spa-5">150 €</span>
          <a class="btn btn--solid" href="https://wa.me/34610167764" data-wa="Bono 5 sesiones de Spa Capilar" data-wa-kind="producto">Lo quiero</a>
        </li>
        <li class="bono reveal">
          <h3>Bono tratamiento tricológico</h3>
          <p>Consulta tricológica y cuatro sesiones de terapia capilar: el plan completo para ver resultados.</p>
          <span class="badge" data-saving="bono-tricologico">ahorras 20 €</span>
          <span class="price" data-price="bono-tricologico">170 €</span>
          <a class="btn btn--solid" href="https://wa.me/34610167764" data-wa="Bono tratamiento tricológico" data-wa-kind="producto">Lo quiero</a>
        </li>
      </ul>
    </section>

    <section class="section" id="tarjetas-regalo" aria-labelledby="regalo-title">
      <div class="container section-head reveal">
        <img class="lotus" src="../assets/icons/loto.svg" alt="" width="64" height="40">
        <span class="eyebrow">Un detalle con sentido</span>
        <h2 class="title" id="regalo-title">Tarjetas regalo</h2>
        <p>Elige un importe o regala un servicio concreto. La preparamos a mano y la recoges en el salón.</p>
      </div>
      <ul class="container product-grid" role="list">
        <li class="product-card reveal">
          <div class="product-card__visual" aria-hidden="true">
            <div class="giftcard"><img class="giftcard__lotus" src="../assets/icons/loto.svg" alt="" width="64" height="40"><span class="giftcard__brand">AURA</span><span class="giftcard__value" data-price="regalo-25">25 €</span></div>
          </div>
          <div class="product-card__body">
            <h3>Tarjeta de 25 €</h3>
            <p>Para gastar en cualquier servicio o producto.</p>
            <span class="price" data-price="regalo-25">25 €</span>
            <a class="btn" href="https://wa.me/34610167764" data-wa="Tarjeta regalo de 25 €" data-wa-kind="producto">Regalar</a>
          </div>
        </li>
        <li class="product-card reveal">
          <div class="product-card__visual" aria-hidden="true">
            <div class="giftcard"><img class="giftcard__lotus" src="../assets/icons/loto.svg" alt="" width="64" height="40"><span class="giftcard__brand">AURA</span><span class="giftcard__value" data-price="regalo-50">50 €</span></div>
          </div>
          <div class="product-card__body">
            <h3>Tarjeta de 50 €</h3>
            <p>Para gastar en cualquier servicio o producto.</p>
            <span class="price" data-price="regalo-50">50 €</span>
            <a class="btn" href="https://wa.me/34610167764" data-wa="Tarjeta regalo de 50 €" data-wa-kind="producto">Regalar</a>
          </div>
        </li>
        <li class="product-card reveal">
          <div class="product-card__visual" aria-hidden="true">
            <div class="giftcard"><img class="giftcard__lotus" src="../assets/icons/loto.svg" alt="" width="64" height="40"><span class="giftcard__brand">AURA</span><span class="giftcard__value" data-price="regalo-75">75 €</span></div>
          </div>
          <div class="product-card__body">
            <h3>Tarjeta de 75 €</h3>
            <p>Para gastar en cualquier servicio o producto.</p>
            <span class="price" data-price="regalo-75">75 €</span>
            <a class="btn" href="https://wa.me/34610167764" data-wa="Tarjeta regalo de 75 €" data-wa-kind="producto">Regalar</a>
          </div>
        </li>
        <li class="product-card reveal">
          <div class="product-card__visual" aria-hidden="true">
            <div class="giftcard"><img class="giftcard__lotus" src="../assets/icons/loto.svg" alt="" width="64" height="40"><span class="giftcard__brand">AURA</span><span class="giftcard__value">Un servicio</span></div>
          </div>
          <div class="product-card__body">
            <h3>El servicio que elijas</h3>
            <p>Un spa capilar, un tratamiento o un peinado para una ocasión especial.</p>
            <span class="price">A elegir</span>
            <a class="btn" href="https://wa.me/34610167764" data-wa="Tarjeta regalo de un servicio" data-wa-kind="producto">Regalar</a>
          </div>
        </li>
      </ul>
    </section>
```

- [ ] **Step 4: Añadir al final de `css/styles.css` (debajo del bloque «9. Tienda» de la Task 5)**

```css

/* 9b. Tienda: aviso, bonos y tarjetas --------------------------------------- */
.note {
  display: flex; align-items: center; justify-content: center; gap: 0.6rem;
  margin: 0; padding: 1rem var(--gutter);
  background: var(--c-bg-alt); color: var(--c-text-soft); font-size: var(--fs-small); text-align: center;
}
.note svg { flex: none; width: 18px; height: 18px; color: var(--c-muted); }

.bono-grid { display: grid; gap: clamp(1rem, 2.5vw, 1.75rem); grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); max-width: 920px; }
.bono {
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  padding: clamp(2rem, 4vw, 3rem); border: 1px solid var(--c-line); background: var(--c-bg); text-align: center;
}
.bono h3 { font-size: 1.9rem; }
.bono p { margin: 0; color: var(--c-text-soft); }
.bono .price { margin-top: auto; padding-top: 0.75rem; font-size: 2.2rem; }
.badge {
  display: inline-block; padding: 0.35rem 0.9rem; border-radius: 999px; background: var(--c-bg-alt);
  font-size: var(--fs-label); font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase;
}
.badge:empty { display: none; }

.giftcard {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem;
  width: 72%; aspect-ratio: 1.6; border: 1px solid var(--c-line); background: var(--c-bg); box-shadow: var(--shadow-soft);
}
.giftcard__lotus { width: 28px; height: auto; }
.giftcard__brand { margin-right: -0.28em; font-family: var(--f-serif); font-size: 1.3rem; letter-spacing: 0.28em; }
.giftcard__value { font-family: var(--f-serif); font-size: 1.1rem; font-style: italic; color: var(--c-text-soft); }
```

- [ ] **Step 5: Ejecutar los tests y comprobar que pasan**

Run: `npm test`
Expected: PASS, incluidos los 5 tests de `tienda.test.js`.

- [ ] **Step 6: Commit**

```bash
git add pages/tienda.html css/styles.css tests/tienda.test.js
git commit -m "Añade la Tienda: champús Jaldún, bonos y tarjetas regalo con pedido por WhatsApp

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Página de Contacto (tarjetas, horario, mapa y formulario)

**Files:**
- Modify: `pages/contacto.html` (reemplazar el marcador `    <!-- secciones-contacto -->`), `css/styles.css` (añadir al final), `js/main.js` (añadir `initContactForm`)
- Create: `tests/contacto.test.js`

**Interfaces:**
- Consumes: `lib.composeContactMessage`, `lib.buildWaUrl` (Task 1); `data.business.phoneDigits` (Task 2).
- Produces: `form#contact-form` con los campos `nombre` (obligatorio), `servicio` (opcional) y `mensaje` (obligatorio); `#formulario` (destino del CTA de la Task 7).

- [ ] **Step 1: Escribir los tests que fallan, en `tests/contacto.test.js`**

```js
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

test('contacto: el selector incluye todos los servicios de data.js', () => {
  for (const item of Object.values(data.items)) {
    if (item.type === 'servicio') assert.match(html, new RegExp(`<option>${item.name}</option>`), item.name);
  }
});

test('contacto: mapa incrustado', () => {
  assert.match(html, /<iframe src="https:\/\/www\.google\.com\/maps\?q=[^"]+&amp;output=embed" title="[^"]+" loading="lazy"/);
});
```

- [ ] **Step 2: Ejecutar los tests y comprobar que fallan**

Run: `npm test`
Expected: FAIL. Fallan los 5 tests de `contacto.test.js`.

- [ ] **Step 3: En `pages/contacto.html`, reemplazar la línea `    <!-- secciones-contacto -->` por:**

```html
    <section class="section" aria-label="Formas de contacto">
      <ul class="container contact-grid" role="list">
        <li class="reveal">
          <a class="contact-card" href="tel:+34610167764">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <h2>Llámame</h2>
            <span data-phone>+34 610 16 77 64</span>
          </a>
        </li>
        <li class="reveal">
          <a class="contact-card" href="https://wa.me/34610167764" data-wa="">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <h2>WhatsApp</h2>
            <span>Pide cita o pregúntame</span>
          </a>
        </li>
        <li class="reveal">
          <a class="contact-card" href="https://www.instagram.com/centro__aura/" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            <h2>Instagram</h2>
            <span>@centro__aura</span>
          </a>
        </li>
        <li class="reveal">
          <a class="contact-card" href="https://www.google.com/maps/search/?api=1&amp;query=C%2F%20Dr.%20Domingo%20Gallego%203%2C%2041730%20Las%20Cabezas%20de%20San%20Juan" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <h2>Cómo llegar</h2>
            <span>C/ Dr. Domingo Gallego, 3</span>
          </a>
        </li>
      </ul>
    </section>

    <section class="section section--alt" aria-labelledby="horario-title">
      <div class="container split">
        <div class="split__text reveal">
          <img class="lotus" src="../assets/icons/loto.svg" alt="" width="64" height="40">
          <span class="eyebrow">Horario</span>
          <h2 class="title" id="horario-title">Cuándo encontrarnos</h2>
          <address>C/ Dr. Domingo Gallego, 3<br>41730 Las Cabezas de San Juan, Sevilla</address>
          <dl class="hours" data-hours>
            <dt>Lunes – Viernes</dt><dd>9:30 – 14:00 · 17:00 – 20:30</dd>
            <dt>Sábado</dt><dd>9:30 – 14:00</dd>
            <dt>Domingo</dt><dd>Cerrado</dd>
          </dl>
        </div>
        <div class="split__media reveal">
          <iframe src="https://www.google.com/maps?q=C%2F%20Dr.%20Domingo%20Gallego%203%2C%2041730%20Las%20Cabezas%20de%20San%20Juan&amp;output=embed" title="Mapa: Centro Aura en C/ Dr. Domingo Gallego, 3, Las Cabezas de San Juan" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
      </div>
    </section>

    <section class="section" id="formulario" aria-labelledby="form-title">
      <div class="container section-head reveal">
        <span class="eyebrow">Pregúntanos</span>
        <h2 class="title" id="form-title">¿Tienes alguna duda?</h2>
        <p>Escribe tu mensaje y se abrirá WhatsApp con todo listo para enviar.</p>
      </div>
      <form class="form" id="contact-form">
        <div class="field">
          <label for="f-nombre">Nombre</label>
          <input id="f-nombre" name="nombre" type="text" autocomplete="given-name" required aria-describedby="err-nombre" data-error="Escribe tu nombre, por favor.">
          <p class="field-error" id="err-nombre" aria-live="polite"></p>
        </div>
        <div class="field">
          <label for="f-servicio">Servicio de interés <span class="optional">(opcional)</span></label>
          <select id="f-servicio" name="servicio">
            <option value="">Elige una opción</option>
            <option>Consulta tricológica</option>
            <option>Spa capilar</option>
            <option>Terapias capilares</option>
            <option>Barros naturales</option>
            <option>Alisados</option>
            <option>Hidratación y reparación</option>
            <option>Corte y peinado</option>
            <option>Peinados y recogidos</option>
            <option value="">Otro / no lo sé</option>
          </select>
        </div>
        <div class="field">
          <label for="f-mensaje">Mensaje</label>
          <textarea id="f-mensaje" name="mensaje" rows="5" required aria-describedby="err-mensaje" data-error="Cuéntame en qué puedo ayudarte."></textarea>
          <p class="field-error" id="err-mensaje" aria-live="polite"></p>
        </div>
        <button class="btn btn--solid" type="submit">Enviar por WhatsApp</button>
        <p class="form-hint">Se abrirá WhatsApp con tu mensaje listo para enviar.</p>
      </form>
    </section>
```

- [ ] **Step 4: Añadir al final de `css/styles.css`**

```css

/* 10. Contacto -------------------------------------------------------------- */
.contact-grid { display: grid; gap: clamp(1rem, 2vw, 1.5rem); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.contact-card {
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem; height: 100%;
  padding: 2.25rem 1.5rem; border: 1px solid var(--c-line); background: var(--c-bg);
  text-align: center; text-decoration: none;
  transition: background-color 0.3s var(--ease), border-color 0.3s var(--ease);
}
.contact-card:hover { background: var(--c-bg-alt); border-color: var(--c-muted); }
.contact-card svg { width: 28px; height: 28px; margin-bottom: 0.5rem; color: var(--c-muted); }
.contact-card h2 { font-size: 1.6rem; }
.contact-card span { color: var(--c-text-soft); font-size: var(--fs-small); overflow-wrap: anywhere; }

.form { display: grid; gap: 1.5rem; max-width: 640px; margin-inline: auto; }
.field { display: grid; gap: 0.5rem; }
.field label { font-size: var(--fs-label); font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; }
.field .optional { color: var(--c-text-soft); font-weight: 400; letter-spacing: 0.05em; text-transform: none; }
.field input,
.field select,
.field textarea {
  width: 100%; min-height: 50px; padding: 0.8rem 1rem;
  border: 1px solid var(--c-border); border-radius: 2px; background: var(--c-bg); color: var(--c-text); font: inherit;
}
.field textarea { min-height: 150px; resize: vertical; }
.field input:focus-visible,
.field select:focus-visible,
.field textarea:focus-visible { outline-offset: 1px; }
.field [aria-invalid="true"] { border-color: var(--c-error); }
.field-error { min-height: 1.3em; margin: 0; color: var(--c-error); font-size: var(--fs-small); }
.form .btn { justify-self: center; }
.form-hint { margin: 0; color: var(--c-text-soft); font-size: var(--fs-small); text-align: center; }
```

- [ ] **Step 5: En `js/main.js`, insertar `initContactForm` justo antes de la línea `  fillData();` (la llamada final)**

```js
  /* Formulario de Contacto: valida y abre WhatsApp con el mensaje compuesto.
     Sin JS se queda la validación nativa del navegador (required). */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.noValidate = true;
    const fields = [form.elements.nombre, form.elements.mensaje];

    const setError = (field, message) => {
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      document.getElementById('err-' + field.name).textContent = message;
    };

    fields.forEach((field) => {
      field.addEventListener('input', () => {
        if (field.value.trim()) setError(field, '');
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const invalid = fields.filter((field) => !field.value.trim());
      fields.forEach((field) => setError(field, invalid.includes(field) ? field.dataset.error : ''));
      if (invalid.length) {
        invalid[0].focus();
        return;
      }
      const message = lib.composeContactMessage({
        name: form.elements.nombre.value,
        service: form.elements.servicio.value,
        message: form.elements.mensaje.value
      });
      window.open(lib.buildWaUrl(data.business.phoneDigits, message), '_blank', 'noopener');
    });
  }

```

Y dejar el bloque de llamadas final así:

```js
  fillData();
  wireWhatsApp();
  initHeader();
  initMenu();
  initTabs();
  initContactForm();
  initReveal();
```

- [ ] **Step 6: Comprobar la sintaxis y ejecutar los tests**

Run: `node --check js/main.js && npm test`
Expected: PASS, incluidos los 5 tests de `contacto.test.js`.

- [ ] **Step 7: Commit**

```bash
git add pages/contacto.html css/styles.css js/main.js tests/contacto.test.js
git commit -m "Añade Contacto: tarjetas, horario, mapa y formulario que abre WhatsApp

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Verificación en navegador y README

**Files:**
- Create: `README.md`
- Modify: cualquier archivo en el que la verificación encuentre un fallo (cada arreglo lleva su propio commit)

**Interfaces:**
- Consumes: la web completa.
- Produces: la demo verificada y documentada.

- [ ] **Step 1: Arrancar el servidor de preview**

Usa `preview_start` con el nombre `centro-aura` (de `.claude/launch.json`) y abre `http://localhost:4173/`.
Expected: la portada carga sin errores (revísalo con `read_console_messages` y `onlyErrors: true`).

- [ ] **Step 2: Capturas a 375, 768 y 1440 px de las 4 páginas**

Para cada página (`/`, `/pages/servicios.html`, `/pages/tienda.html`, `/pages/contacto.html`) y cada ancho, usa `resize_window` y haz capturas del principio, la mitad y el final de la página. Comprueba en cada una:
- no hay scroll horizontal. Ejecuta `document.documentElement.scrollWidth <= window.innerWidth` en `javascript_tool`; debe devolver `true`;
- en la portada, la cabecera es transparente sobre el hero y sólida tras hacer scroll;
- el loto, la tipografía serif y los botones píldora se ven como en la especificación;
- los precios aparecen con "desde" donde toca, y el horario aparece en el pie.
Al terminar, vuelve a `resize_window` con `preset: "desktop"`.

- [ ] **Step 3: Comprobar los enlaces de WhatsApp desde la consola**

En cada página, ejecuta en `javascript_tool`:

```js
[...document.querySelectorAll('[data-wa]')].map((a) => decodeURIComponent(a.href.split('text=')[1] || '(sin texto)'))
```

Expected: cada entrada empieza por `Hola Paula, me gustaría reservar` o `Hola Paula, me interesa:`, y ninguna devuelve `(sin texto)`.

- [ ] **Step 4: Menú móvil (a 375 px)**

Haz clic en la hamburguesa. Comprueba que se abre a pantalla completa y que `aria-expanded` pasa a `"true"`. Con Tab, el foco recorre la hamburguesa y los enlaces del menú y vuelve a empezar sin salirse. Esc cierra el menú y devuelve el foco a la hamburguesa. Un clic en un enlace también lo cierra.

- [ ] **Step 5: Pestañas de Servicios**

- Navega a `/pages/servicios.html#spa-capilar` → la pestaña «Salud capilar» está activa y la página baja hasta «Spa capilar».
- Navega a `/pages/servicios.html#alisados` → la activa es «Tratamientos».
- Con el foco en una pestaña, ← y → cambian de pestaña, e Inicio y Fin van a la primera y a la última.

- [ ] **Step 6: Formulario de Contacto**

- Envía el formulario vacío → aparecen los dos mensajes de error, `aria-invalid="true"` y el foco va a «Nombre».
- Rellena «Lucía», el servicio «Spa capilar» y el mensaje «¿Hueco el viernes?». Antes de enviar, sustituye `window.open` desde la consola para capturar la URL:

```js
window.__waUrl = null; window.open = (url) => { window.__waUrl = url; };
```

  Envía el formulario y ejecuta `decodeURIComponent(window.__waUrl)`.
  Expected: `https://wa.me/34610167764?text=Hola Paula, soy Lucía. Me interesa: Spa capilar. ¿Hueco el viernes?`

- [ ] **Step 7: Arreglar lo que falle**

Por cada problema: corrige el archivo, ejecuta `npm test`, vuelve a comprobarlo en el navegador y haz un commit con un mensaje que describa el arreglo.

- [ ] **Step 8: Escribir `README.md`**

````markdown
# Centro Aura — demo web

Demo de la web de **Centro Aura** (Spa Capilar · Tricología), en C/ Dr. Domingo Gallego, 3, Las Cabezas de San Juan.

## Verla

- Abre `index.html` en el navegador, o
- arranca el servidor local y entra en http://localhost:4173:

```bash
npm run serve
```

No hace falta instalar nada (solo Node 18 o superior para el servidor y los tests).

## Cambiar precios, horario o teléfono

Todo está en **`js/data.js`**. Cambia el valor y guarda: las páginas lo leen de ahí.
Si cambias el horario, actualiza también el bloque `application/ld+json` de `index.html`. `npm test` avisa si no coinciden.

## Cambiar las fotos

Las fotos actuales son de stock (Unsplash) y provisionales. Para poner las reales:

1. Guarda la foto en `assets/img/` con **el mismo nombre** (por ejemplo, `paula-retrato.webp`) y en formato WebP.
2. Si la nueva foto tiene otro tamaño, actualiza sus atributos `width` y `height` en el HTML y su tamaño en `tools/images.json`. `npm test` comprueba que coinciden.

## Tests

```bash
npm test
```

Comprueban las funciones de `js/lib.js`, los datos de `js/data.js`, la estructura y los enlaces de cada página, el tamaño real de las fotos y el horario del JSON-LD.

## Estructura

| Carpeta o archivo | Qué contiene |
|---|---|
| `index.html`, `pages/` | Las 4 páginas |
| `css/styles.css` | Todos los estilos (tokens de color y tipografía arriba del todo) |
| `js/data.js` | Datos de negocio |
| `js/lib.js` | Funciones sin DOM (precios, WhatsApp, horario) |
| `js/main.js` | Comportamiento: menú, pestañas, formulario, animaciones |
| `assets/` | Fotos e iconos |
| `tools/` | Servidor local y descarga de fotos |
| `docs/superpowers/` | Especificación y plan |

## Pendiente de la clienta

- Fotos reales del local, de Paula, de sus trabajos y de los productos.
- Precios y horario definitivos.
- Textos legales (aviso legal y privacidad) y dominio.
````

- [ ] **Step 9: Ejecutar todos los tests por última vez**

Run: `npm test`
Expected: PASS, 0 fallos.

- [ ] **Step 10: Commit**

```bash
git add README.md
git commit -m "Añade README con instrucciones para ver, editar y verificar la demo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
