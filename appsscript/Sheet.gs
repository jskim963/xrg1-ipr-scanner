var SHEET_NAME_RETURN_LIST = '회송리스트';
var SHEET_NAME_LOG = 'log';
var LOG_HEADER = ['처리일시', '처리구분', 'IPR바코드', '처리자명', 'VF ID', '폐기존 이동 후 사진 URL', '비고'];

function getReturnListSheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_RETURN_LIST);
  if (!sheet) {
    throw new Error('시트를 찾을 수 없습니다: ' + SHEET_NAME_RETURN_LIST);
  }
  return sheet;
}

function getLogSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_LOG);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_LOG);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(LOG_HEADER);
  }
  return sheet;
}

// 오프라인 스냅샷용: A~T(20개 열, buildInquiryResult가 쓰는 마지막 열인 FINAL_STATUS까지)만 읽는다.
// 미처리 여부 판정과 필드 구성은 호출부(Handlers.gs)에서 buildInquiryResult로 처리한다.
function readUnprocessedSnapshotRows_() {
  var sheet = getReturnListSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 20).getValues();
}

// IPR(F열) 한 개 열만 읽어서 매칭 행을 찾는다. 시트가 수천 행/수십 열일 때
// 매 요청마다 전체 행을 통째로 읽으면 응답이 느려지므로, 매칭 단계는 이 얇은
// 열 하나만 읽고, 실제로 매칭된 행 하나만 readFullRow_()로 나머지 값을 가져온다.
function readIprColumnValues_() {
  var sheet = getReturnListSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, COLUMNS.IPR + 1, lastRow - 1, 1).getValues();
  return values.map(function (row) { return row[0]; });
}

function readFullRow_(rowIndex) {
  var sheet = getReturnListSheet_();
  var lastCol = sheet.getLastColumn();
  return sheet.getRange(rowIndex + 2, 1, 1, lastCol).getValues()[0];
}

function writeProcessResult_(rowIndex, update) {
  var sheet = getReturnListSheet_();
  var sheetRow = rowIndex + 2; // rowIndex는 0-based 데이터 행, 시트는 2행부터 데이터 시작
  sheet.getRange(sheetRow, COLUMNS.FINAL_DATE + 1).setValue(update.finalDate);
  sheet.getRange(sheetRow, COLUMNS.FINAL_STATUS + 1).setValue(update.finalStatus);
  if (update.trackingNo !== null && update.trackingNo !== undefined) {
    sheet.getRange(sheetRow, COLUMNS.TRACKING_NO + 1).setValue(update.trackingNo);
  }
}

// "회송존 이동" 처리 전용: U열(Remark 날짜)에 처리일, X열(택배 진행상태 — 이 플로우에서는
// 재사용)에 '회송존 이동' 문자열을 기입한다. S/T열(최종 처리)은 건드리지 않는다 — 아직
// 최종 처리가 아닌 중간 상태이기 때문이다.
function writeStagingResult_(rowIndex, update) {
  var sheet = getReturnListSheet_();
  var sheetRow = rowIndex + 2;
  sheet.getRange(sheetRow, COLUMNS.REMARK_DATE + 1).setValue(update.remarkDate);
  sheet.getRange(sheetRow, COLUMNS.PROGRESS_STATUS + 1).setValue(update.progressStatus);
}

function appendLogRow_(rowValues) {
  getLogSheet_().appendRow(rowValues);
}

// AC열(중복/재신고 점검)에 "중복스캔"을 추가한다. 기존 내용이 있으면 지우지 않고 이어붙인다.
function markDuplicateScan_(rowIndex) {
  var sheet = getReturnListSheet_();
  var sheetRow = rowIndex + 2;
  var cell = sheet.getRange(sheetRow, COLUMNS.DUPLICATE_CHECK + 1);
  var current = String(cell.getValue() || '').trim();
  if (current.indexOf('중복스캔') === -1) {
    cell.setValue(current === '' ? '중복스캔' : current + ' / 중복스캔');
  }
}
