import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('App shell links shared owl branding and real JSON module app', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /assets\/owl\.svg/);
  assert.match(html, /type="module"[^>]*src="\.\/assets\/app\.mjs"/);
  assert.doesNotMatch(html, /const sources=|const quiz=/);
});

test('Owl logo is a standalone SVG usable as favicon and mascot', async () => {
  const svg = await readFile(new URL('../assets/owl.svg', import.meta.url), 'utf8');
  assert.match(svg, /<svg[^>]+viewBox="0 0 310 265"/);
  assert.doesNotMatch(svg, /<script|https?:\/\/.*(?:png|jpg)/);
});
