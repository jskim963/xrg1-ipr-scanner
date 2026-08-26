import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeScanValue } from './scan-parser.js';

test('normalizeScanValue: 앞뒤 공백/개행을 제거한다', () => {
  assert.equal(normalizeScanValue('  IPR0001\n'), 'IPR0001');
});

test('normalizeScanValue: 빈 값은 null을 반환한다', () => {
  assert.equal(normalizeScanValue(''), null);
  assert.equal(normalizeScanValue('   '), null);
  assert.equal(normalizeScanValue(null), null);
  assert.equal(normalizeScanValue(undefined), null);
});

test('normalizeScanValue: 일반 문자열은 그대로 반환한다', () => {
  assert.equal(normalizeScanValue('IPR0016929830'), 'IPR0016929830');
});
