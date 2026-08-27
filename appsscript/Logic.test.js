const test = require('node:test');
const assert = require('node:assert/strict');
const { COLUMNS, findMatchingIndexesInColumn, determineReturnRoute, buildInquiryResult, buildProcessUpdate, buildLogRow, FINAL_STATUS_LABEL, ACTION_TYPE, buildStagingUpdate } = require('./Logic.js');

test('findMatchingIndexesInColumn: 유일한 IPR바코드는 인덱스 1개를 찾는다', () => {
  assert.deepEqual(findMatchingIndexesInColumn(['IPR0001', 'IPR0002', 'IPR0003'], 'IPR0002'), [1]);
});

test('findMatchingIndexesInColumn: 앞뒤 공백은 무시하고 비교한다', () => {
  assert.deepEqual(findMatchingIndexesInColumn(['  IPR0001  '], 'IPR0001'), [0]);
});

test('findMatchingIndexesInColumn: 중복된 값은 여러 인덱스를 반환한다', () => {
  assert.deepEqual(findMatchingIndexesInColumn(['IPR0001', 'IPR0001'], 'IPR0001'), [0, 1]);
});

test('findMatchingIndexesInColumn: 매칭 없으면 빈 배열', () => {
  assert.deepEqual(findMatchingIndexesInColumn(['IPR0001'], 'NOPE'), []);
});

test('findMatchingIndexesInColumn: 빈 검색어/빈 셀은 매칭하지 않는다', () => {
  assert.deepEqual(findMatchingIndexesInColumn([''], ''), []);
});

test('COLUMNS는 설계 문서의 열 순서(A=0 ... W=22)와 일치한다', () => {
  assert.equal(COLUMNS.IPR, 5);
  assert.equal(COLUMNS.METHOD, 12);
  assert.equal(COLUMNS.FINAL_DATE, 18);
  assert.equal(COLUMNS.FINAL_STATUS, 19);
  assert.equal(COLUMNS.TRACKING_NO, 22);
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

test('buildInquiryResult: vendor 필드도 trim 처리된다', () => {
  const row = [];
  row[COLUMNS.VENDOR_NAME] = '  테스트벤더  ';
  const result = buildInquiryResult(row);
  assert.equal(result.vendor, '테스트벤더');
});

test('buildProcessUpdate: discard는 D+6 폐기로 기록되고 운송장번호는 null', () => {
  const now = new Date('2026-08-26T09:00:00Z');
  const update = buildProcessUpdate('discard', now);
  assert.equal(update.finalDate, now);
  assert.equal(update.finalStatus, 'D+6 폐기');
  assert.equal(update.trackingNo, null);
});

test('buildProcessUpdate: returnVendor는 업체 트럭 회송으로 기록된다', () => {
  const update = buildProcessUpdate('returnVendor', new Date());
  assert.equal(update.finalStatus, '업체 트럭 회송');
});

test('buildProcessUpdate: returnParcel은 택배 회송 + 운송장번호를 포함한다', () => {
  const update = buildProcessUpdate('returnParcel', new Date(), { trackingNo: '1234567890' });
  assert.equal(update.finalStatus, '택배 회송');
  assert.equal(update.trackingNo, '1234567890');
});

test('buildProcessUpdate: 알 수 없는 actionType은 에러를 던진다', () => {
  assert.throws(() => buildProcessUpdate('nope', new Date()));
});

test('FINAL_STATUS_LABEL 상수는 시트에 기입할 정확한 문자열을 담는다', () => {
  assert.equal(FINAL_STATUS_LABEL.DISCARD, 'D+6 폐기');
  assert.equal(FINAL_STATUS_LABEL.RETURN_VENDOR, '업체 트럭 회송');
  assert.equal(FINAL_STATUS_LABEL.RETURN_PARCEL, '택배 회송');
});

test('buildLogRow: log 시트 컬럼 순서(7열)로 배열을 만든다', () => {
  const row = buildLogRow({
    timestamp: '2026-08-26T09:00:00Z',
    statusLabel: 'D+6 폐기',
    iprBarcode: 'IPR0001',
    workerName: '홍길동',
    vfId: 'VF1234',
    photoUrl: 'https://drive.google.com/x',
    remark: ''
  });
  assert.deepEqual(row, [
    '2026-08-26T09:00:00Z',
    'D+6 폐기',
    'IPR0001',
    '홍길동',
    'VF1234',
    'https://drive.google.com/x',
    ''
  ]);
});

test('buildLogRow: 선택 필드가 없으면 빈 문자열로 채운다', () => {
  const row = buildLogRow({ timestamp: 't', statusLabel: 's', iprBarcode: 'IPR0001' });
  assert.deepEqual(row, ['t', 's', 'IPR0001', '', '', '', '']);
});

test('COLUMNS.DUPLICATE_CHECK는 AC열(29번째, 0-based 28)이다', () => {
  assert.equal(COLUMNS.DUPLICATE_CHECK, 28);
});

test('COLUMNS.PROGRESS_STATUS는 X열(0-based 23)이다', () => {
  assert.equal(COLUMNS.PROGRESS_STATUS, 23);
});

test('ACTION_TYPE.RETURN_ZONE_MOVE는 processReturnZoneMove이다', () => {
  assert.equal(ACTION_TYPE.RETURN_ZONE_MOVE, 'processReturnZoneMove');
});

test('buildStagingUpdate: 처리일과 회송존 이동 문자열을 담는다', () => {
  const now = new Date('2026-08-27T09:00:00Z');
  const update = buildStagingUpdate(now);
  assert.equal(update.remarkDate, now);
  assert.equal(update.progressStatus, '회송존 이동');
});
