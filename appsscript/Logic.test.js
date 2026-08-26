const test = require('node:test');
const assert = require('node:assert/strict');
const { COLUMNS, findMatchingRowIndexes } = require('./Logic.js');

test('COLUMNS는 설계 문서의 열 순서(A=0 ... W=22)와 일치한다', () => {
  assert.equal(COLUMNS.IPR, 5);
  assert.equal(COLUMNS.METHOD, 12);
  assert.equal(COLUMNS.FINAL_DATE, 18);
  assert.equal(COLUMNS.FINAL_STATUS, 19);
  assert.equal(COLUMNS.TRACKING_NO, 22);
});

test('findMatchingRowIndexes: 유일한 IPR바코드는 행 1개를 찾는다', () => {
  const rows = [
    ['', '', '', '', '', 'IPR0001'],
    ['', '', '', '', '', 'IPR0002']
  ];
  assert.deepEqual(findMatchingRowIndexes(rows, 'IPR0002'), [1]);
});

test('findMatchingRowIndexes: 앞뒤 공백은 무시하고 비교한다', () => {
  const rows = [['', '', '', '', '', '  IPR0001  ']];
  assert.deepEqual(findMatchingRowIndexes(rows, 'IPR0001'), [0]);
});

test('findMatchingRowIndexes: 중복된 IPR바코드는 여러 인덱스를 반환한다', () => {
  const rows = [
    ['', '', '', '', '', 'IPR0001'],
    ['', '', '', '', '', 'IPR0001']
  ];
  assert.deepEqual(findMatchingRowIndexes(rows, 'IPR0001'), [0, 1]);
});

test('findMatchingRowIndexes: 매칭되는 행이 없으면 빈 배열을 반환한다', () => {
  const rows = [['', '', '', '', '', 'IPR0001']];
  assert.deepEqual(findMatchingRowIndexes(rows, 'NOPE'), []);
});

test('findMatchingRowIndexes: 빈 IPR 셀은 빈 검색어와 매칭되지 않는다', () => {
  const rows = [['', '', '', '', '', '']];
  assert.deepEqual(findMatchingRowIndexes(rows, ''), []);
});
