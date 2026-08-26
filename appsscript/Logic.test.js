const test = require('node:test');
const assert = require('node:assert/strict');
const { COLUMNS, findMatchingRowIndexes, determineReturnRoute, buildInquiryResult } = require('./Logic.js');

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

test('determineReturnRoute: "택배"가 포함되면 parcel', () => {
  assert.equal(determineReturnRoute('택배'), 'parcel');
});

test('determineReturnRoute: "업체"가 포함되면 vendor', () => {
  assert.equal(determineReturnRoute('업체직접회수'), 'vendor');
});

test('determineReturnRoute: 알 수 없는 값은 unknown', () => {
  assert.equal(determineReturnRoute(''), 'unknown');
  assert.equal(determineReturnRoute('기타'), 'unknown');
});

test('buildInquiryResult: 행 데이터를 조회 응답 형태로 변환한다', () => {
  const row = [];
  row[COLUMNS.DATE] = '2026-08-10';
  row[COLUMNS.IPR] = 'IPR0001';
  row[COLUMNS.VENDOR_NAME] = '테스트벤더';
  row[COLUMNS.PRODUCT_BARCODE] = 'S0001';
  row[COLUMNS.PRODUCT_NAME] = '테스트 상품';
  row[COLUMNS.QTY] = 3;
  row[COLUMNS.METHOD] = '택배';
  row[COLUMNS.DPLUS6_CONDITION] = 'O';
  row[COLUMNS.FINAL_STATUS] = '';

  const result = buildInquiryResult(row);

  assert.equal(result.iprBarcode, 'IPR0001');
  assert.equal(result.vendor, '테스트벤더');
  assert.equal(result.qty, 3);
  assert.equal(result.method, '택배');
  assert.equal(result.isOverDPlus6, 'O');
  assert.equal(result.alreadyProcessed, false);
  assert.equal(result.existingStatus, null);
});

test('buildInquiryResult: 최종처리가 이미 있으면 alreadyProcessed=true', () => {
  const row = [];
  row[COLUMNS.FINAL_STATUS] = '택배 회송';
  const result = buildInquiryResult(row);
  assert.equal(result.alreadyProcessed, true);
  assert.equal(result.existingStatus, '택배 회송');
});
