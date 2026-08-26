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

function readReturnListRows_() {
  var sheet = getReturnListSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var lastCol = sheet.getLastColumn();
  return sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
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

function appendLogRow_(rowValues) {
  getLogSheet_().appendRow(rowValues);
}
