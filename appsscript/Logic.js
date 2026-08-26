var COLUMNS = {
  DATE: 0,
  FC: 1,
  ERROR_TYPE: 2,
  ERROR_DESC: 3,
  PO_ID: 4,
  IPR: 5,
  VENDOR_ID: 6,
  VENDOR_NAME: 7,
  PRODUCT_BARCODE: 8,
  PRODUCT_NAME: 9,
  QTY: 10,
  PLT: 11,
  METHOD: 12,
  PARCEL_ADDRESS: 13,
  CONTACT: 14,
  TRACKING_PRINT: 15,
  SRMS_REPLY_DATE: 16,
  DPLUS6_CONDITION: 17,
  FINAL_DATE: 18,
  FINAL_STATUS: 19,
  REMARK_DATE: 20,
  MEMO: 21,
  TRACKING_NO: 22
};

var FINAL_STATUS_LABEL = {
  DISCARD: 'D+6 폐기',
  RETURN_VENDOR: '업체 트럭 회송',
  RETURN_PARCEL: '택배 회송'
};

function findMatchingRowIndexes(rows, iprBarcode) {
  var target = String(iprBarcode || '').trim();
  var indexes = [];
  if (target === '') return indexes;
  for (var i = 0; i < rows.length; i++) {
    var value = String(rows[i][COLUMNS.IPR] || '').trim();
    if (value !== '' && value === target) {
      indexes.push(i);
    }
  }
  return indexes;
}

function determineReturnRoute(methodValue) {
  var value = String(methodValue || '').trim();
  if (value.indexOf('택배') !== -1) return 'parcel';
  if (value.indexOf('업체') !== -1) return 'vendor';
  return 'unknown';
}

function buildInquiryResult(row) {
  var finalStatus = String(row[COLUMNS.FINAL_STATUS] || '').trim();
  return {
    iprBarcode: String(row[COLUMNS.IPR] || '').trim(),
    productBarcode: String(row[COLUMNS.PRODUCT_BARCODE] || '').trim(),
    productName: String(row[COLUMNS.PRODUCT_NAME] || '').trim(),
    reportDate: row[COLUMNS.DATE],
    vendor: row[COLUMNS.VENDOR_NAME],
    qty: row[COLUMNS.QTY],
    method: String(row[COLUMNS.METHOD] || '').trim(),
    isOverDPlus6: row[COLUMNS.DPLUS6_CONDITION],
    alreadyProcessed: finalStatus !== '',
    existingStatus: finalStatus !== '' ? finalStatus : null
  };
}

function buildProcessUpdate(actionType, now, extra) {
  extra = extra || {};
  var statusMap = {
    discard: FINAL_STATUS_LABEL.DISCARD,
    returnVendor: FINAL_STATUS_LABEL.RETURN_VENDOR,
    returnParcel: FINAL_STATUS_LABEL.RETURN_PARCEL
  };
  var finalStatus = statusMap[actionType];
  if (!finalStatus) {
    throw new Error('Unknown actionType: ' + actionType);
  }
  return {
    finalDate: now,
    finalStatus: finalStatus,
    trackingNo: actionType === 'returnParcel' ? (extra.trackingNo || '') : null
  };
}

function buildLogRow(entry) {
  return [
    entry.timestamp,
    entry.statusLabel,
    entry.iprBarcode,
    entry.workerName || '',
    entry.vfId || '',
    entry.photoUrl || '',
    entry.remark || ''
  ];
}

if (typeof module !== 'undefined') {
  module.exports = {
    COLUMNS: COLUMNS,
    FINAL_STATUS_LABEL: FINAL_STATUS_LABEL,
    findMatchingRowIndexes: findMatchingRowIndexes,
    determineReturnRoute: determineReturnRoute,
    buildInquiryResult: buildInquiryResult,
    buildProcessUpdate: buildProcessUpdate,
    buildLogRow: buildLogRow
  };
}
