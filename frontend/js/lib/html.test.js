import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from './html.js';

test('escapeHtml: escapes the 5 HTML-significant characters', () => {
  assert.equal(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
});

test('escapeHtml: escapes ampersand and single quote', () => {
  assert.equal(escapeHtml("Tom & Jerry's"), 'Tom &amp; Jerry&#39;s');
});

test('escapeHtml: null/undefined become empty string', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
});

test('escapeHtml: numbers and plain strings pass through unchanged (no special chars)', () => {
  assert.equal(escapeHtml(3), '3');
  assert.equal(escapeHtml('plain text'), 'plain text');
});
