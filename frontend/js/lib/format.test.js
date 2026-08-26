import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDateDisplay, formatDPlus6Badge, formatMethodLabel, determineReturnRoute } from './format.js';

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

test('determineReturnRoute: 회수구분 문구로 처리 화면을 분기한다', () => {
  assert.equal(determineReturnRoute('택배'), 'parcel');
  assert.equal(determineReturnRoute('업체직접회수'), 'vendor');
  assert.equal(determineReturnRoute(''), 'unknown');
});
