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
  TRACKING_NO: 22,
  DUPLICATE_CHECK: 28
};

var FINAL_STATUS_LABEL = {
  DISCARD: 'D+6 폐기',
  RETURN_VENDOR: '업체 트럭 회송',
  RETURN_PARCEL: '택배 회송'
};

var RETURN_ROUTE = {
  PARCEL: 'parcel',
  VENDOR: 'vendor',
  UNKNOWN: 'unknown'
};

var ACTION_TYPE = {
  DISCARD: 'discard',
  RETURN_VENDOR: 'returnVendor',
  RETURN_PARCEL: 'returnParcel'
};

function findMatchingIndexesInColumn(columnValues, iprBarcode) {
  var target = String(iprBarcode || '').trim();
  var indexes = [];
  if (target === '') return indexes;
  for (var i = 0; i < columnValues.length; i++) {
    var value = String(columnValues[i] || '').trim();
    if (value !== '' && value === target) {
      indexes.push(i);
    }
  }
  return indexes;
}

function determineReturnRoute(methodValue) {
  var value = String(methodValue || '').trim();
  if (value.indexOf('택배') !== -1) return RETURN_ROUTE.PARCEL;
  if (value.indexOf('업체') !== -1) return RETURN_ROUTE.VENDOR;
  return RETURN_ROUTE.UNKNOWN;
}

function buildInquiryResult(row) {
  var finalStatus = String(row[COLUMNS.FINAL_STATUS] || '').trim();
  return {
    iprBarcode: String(row[COLUMNS.IPR] || '').trim(),
    productBarcode: String(row[COLUMNS.PRODUCT_BARCODE] || '').trim(),
    productName: String(row[COLUMNS.PRODUCT_NAME] || '').trim(),
    reportDate: row[COLUMNS.DATE],
    vendor: String(row[COLUMNS.VENDOR_NAME] || '').trim(),
    qty: row[COLUMNS.QTY],
    method: String(row[COLUMNS.METHOD] || '').trim(),
    isOverDPlus6: row[COLUMNS.DPLUS6_CONDITION],
    alreadyProcessed: finalStatus !== '',
    existingStatus: finalStatus !== '' ? finalStatus : null
  };
}

function buildProcessUpdate(actionType, now, extra) {
  extra = extra || {};
  var statusMap = {};
  statusMap[ACTION_TYPE.DISCARD] = FINAL_STATUS_LABEL.DISCARD;
  statusMap[ACTION_TYPE.RETURN_VENDOR] = FINAL_STATUS_LABEL.RETURN_VENDOR;
  statusMap[ACTION_TYPE.RETURN_PARCEL] = FINAL_STATUS_LABEL.RETURN_PARCEL;

  var finalStatus = statusMap[actionType];
  if (!finalStatus) {
    throw new Error('Unknown actionType: ' + actionType);
  }
  return {
    finalDate: now,
    finalStatus: finalStatus,
    trackingNo: actionType === ACTION_TYPE.RETURN_PARCEL ? (extra.trackingNo || '') : null
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
    RETURN_ROUTE: RETURN_ROUTE,
    ACTION_TYPE: ACTION_TYPE,
    findMatchingIndexesInColumn: findMatchingIndexesInColumn,
    determineReturnRoute: determineReturnRoute,
    buildInquiryResult: buildInquiryResult,
    buildProcessUpdate: buildProcessUpdate,
    buildLogRow: buildLogRow
  };
}
