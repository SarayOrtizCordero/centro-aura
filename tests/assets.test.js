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
