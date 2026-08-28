import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDateDisplay, formatDPlus6Badge, formatMethodLabel, splitBarcodeSuffix, formatRelativeMinutes } from './format.js';

test('formatDateDisplay: Date 객체는 YYYY-MM-DD로 표시한다', () => {
  assert.equal(formatDateDisplay(new Date('2026-08-10T00:00:00Z')), '2026-08-10');
});

test('formatDateDisplay: 문자열 값은 앞의 날짜 부분만 취한다', () => {
  assert.equal(formatDateDisplay('2026-08-10T09:00:00.000Z'), '2026-08-10');
});

test('formatDateDisplay: 값이 없으면 대시를 표시한다', () => {
  assert.equal(formatDateDisplay(''), '-');
  assert.equal(formatDateDisplay(null), '-');
});

test('formatDPlus6Badge: 값이 있으면 초과, 없으면 미초과', () => {
  assert.equal(formatDPlus6Badge('O'), '초과');
  assert.equal(formatDPlus6Badge(''), '미초과');
  assert.equal(formatDPlus6Badge(null), '미초과');
});

test('formatMethodLabel: 택배/업체 문구를 표준 라벨로 정규화한다', () => {
  assert.equal(formatMethodLabel('택배'), '택배');
  assert.equal(formatMethodLabel('업체직접회수'), '업체직접회수');
  assert.equal(formatMethodLabel(''), '미지정');
});

test('splitBarcodeSuffix: 길이가 suffixLength보다 길면 뒤 자리를 분리한다', () => {
  assert.deepEqual(splitBarcodeSuffix('S0037699586659', 4), { prefix: 'S003769958', suffix: '6659' });
});

test('splitBarcodeSuffix: suffixLength 생략 시 기본값 4를 사용한다', () => {
  assert.deepEqual(splitBarcodeSuffix('ABCDEFGH'), { prefix: 'ABCD', suffix: 'EFGH' });
});

test('splitBarcodeSuffix: 길이가 suffixLength 이하이면 전체를 suffix로 반환한다', () => {
  assert.deepEqual(splitBarcodeSuffix('AB', 4), { prefix: '', suffix: 'AB' });
  assert.deepEqual(splitBarcodeSuffix('', 4), { prefix: '', suffix: '' });
});

test('splitBarcodeSuffix: null/undefined은 빈 문자열로 처리한다', () => {
  assert.deepEqual(splitBarcodeSuffix(null), { prefix: '', suffix: '' });
  assert.deepEqual(splitBarcodeSuffix(undefined), { prefix: '', suffix: '' });
});

test('formatRelativeMinutes: 1분 미만이면 방금 전', () => {
  const now = new Date('2026-08-28T09:00:30.000Z').getTime();
  assert.equal(formatRelativeMinutes('2026-08-28T09:00:00.000Z', now), '방금 전');
});

test('formatRelativeMinutes: 60분 미만이면 N분 전', () => {
  const now = new Date('2026-08-28T09:05:00.000Z').getTime();
  assert.equal(formatRelativeMinutes('2026-08-28T09:00:00.000Z', now), '5분 전');
});

test('formatRelativeMinutes: 24시간 미만이면 N시간 전', () => {
  const now = new Date('2026-08-28T12:00:00.000Z').getTime();
  assert.equal(formatRelativeMinutes('2026-08-28T09:00:00.000Z', now), '3시간 전');
});

test('formatRelativeMinutes: 24시간 이상이면 N일 전', () => {
  const now = new Date('2026-08-30T09:00:00.000Z').getTime();
  assert.equal(formatRelativeMinutes('2026-08-28T09:00:00.000Z', now), '2일 전');
});

test('formatRelativeMinutes: isoString이 없으면 null', () => {
  assert.equal(formatRelativeMinutes(null, Date.now()), null);
  assert.equal(formatRelativeMinutes('', Date.now()), null);
});
