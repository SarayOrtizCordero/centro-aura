const { test } = require('node:test');
const assert = require('node:assert/strict');
const { read } = require('./helpers.js');

const css = read('css/styles.css');
const queries = [...css.matchAll(/@media\s*([^{]+)\{/g)].map((m) => m[1].trim());

test('css: mobile-first, sin media queries de max-width', () => {
  const desktopFirst = queries.filter((q) => /max-width/.test(q));
  assert.deepEqual(desktopFirst, [], 'los estilos base son los de móvil; se amplía con min-width');
});

test('css: puntos de ruptura conocidos (600, 700, 760, 860, 900, 960)', () => {
  const widths = queries
    .map((q) => q.match(/min-width:\s*(\d+)px/))
    .filter(Boolean)
    .map((m) => Number(m[1]));
  for (const w of widths) assert.ok([600, 700, 760, 860, 900, 960].includes(w), `punto de ruptura inesperado: ${w}px`);
});

test('css: el menú móvil es la base y la navegación en línea llega con min-width: 900px', () => {
  assert.match(css, /\.site-nav \{\s*position: fixed;/);
  assert.match(css, /@media \(min-width: 900px\) \{[^@]*?\.nav-toggle \{ display: none; \}/);
});

test('css: los enlaces y botones tienen área táctil de 44 px o más', () => {
  assert.match(css, /\.btn \{[^}]*min-height: 48px/);
  assert.match(css, /\.chips a \{[^}]*min-height: 44px/);
});

test('css: el menú móvil es un panel bajo la cabecera, no una pantalla completa', () => {
  const block = css.match(/\.site-nav \{([^}]*)\}/)[1];
  assert.match(block, /top: var\(--header-h\)/);
  assert.match(block, /left: 0; right: 0/);
  assert.doesNotMatch(block, /inset: 0/);
  assert.match(css, /body\.menu-open::after \{/, 'falta el velo que cierra el menú al tocar fuera');
});

test('js: un toque fuera de la cabecera cierra el menú', () => {
  assert.match(read('js/main.js'), /!event\.target\.closest\('\.site-header'\)\) setOpen\(false\)/);
});
