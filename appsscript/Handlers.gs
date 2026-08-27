function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function handleInquiry(payload) {
  var iprColumn = readIprColumnValues_();
  var matches = findMatchingIndexesInColumn(iprColumn, payload.iprBarcode);
  if (matches.length === 0) {
    return { success: true, found: false };
  }
  if (matches.length > 1) {
    return { success: true, found: true, duplicate: true };
  }
  var result = buildInquiryResult(readFullRow_(matches[0]));
  result.success = true;
  result.found = true;
  result.duplicate = false;
  if (result.reportDate instanceof Date) {
    result.reportDate = Utilities.formatDate(result.reportDate, 'Asia/Seoul', 'yyyy-MM-dd');
  }
  return result;
}

function handleProcessDiscard(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // 10초 대기
  try {
    var iprColumn = readIprColumnValues_();
    var matches = findMatchingIndexesInColumn(iprColumn, payload.iprBarcode);
    if (matches.length !== 1) {
      return { success: false, error: matches.length === 0 ? 'NOT_FOUND' : 'DUPLICATE' };
    }
    var now = new Date();
    var photoUrl = uploadPhoto_(payload.photoBase64, 'discard_' + payload.iprBarcode + '_' + now.getTime());
    var update = buildProcessUpdate(ACTION_TYPE.DISCARD, now);
    writeProcessResult_(matches[0], update);
    appendLogRow_(buildLogRow({
      timestamp: now,
      statusLabel: update.finalStatus,
      iprBarcode: payload.iprBarcode,
      workerName: payload.worker && payload.worker.name,
      vfId: payload.worker && payload.worker.vfId,
      photoUrl: photoUrl
    }));
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function handleProcessReturnVendor(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // 10초 대기
  try {
    var iprColumn = readIprColumnValues_();
    var matches = findMatchingIndexesInColumn(iprColumn, payload.iprBarcode);
    if (matches.length !== 1) {
      return { success: false, error: matches.length === 0 ? 'NOT_FOUND' : 'DUPLICATE' };
    }
    var now = new Date();
    var update = buildProcessUpdate(ACTION_TYPE.RETURN_VENDOR, now);
    writeProcessResult_(matches[0], update);
    appendLogRow_(buildLogRow({
      timestamp: now,
      statusLabel: update.finalStatus,
      iprBarcode: payload.iprBarcode,
      workerName: payload.worker && payload.worker.name,
      vfId: payload.worker && payload.worker.vfId
    }));
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function handleProcessReturnParcel(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // 10초 대기
  try {
    var iprColumn = readIprColumnValues_();
    var matches = findMatchingIndexesInColumn(iprColumn, payload.iprBarcode);
    if (matches.length !== 1) {
      return { success: false, error: matches.length === 0 ? 'NOT_FOUND' : 'DUPLICATE' };
    }
    var now = new Date();
    var update = buildProcessUpdate(ACTION_TYPE.RETURN_PARCEL, now, { trackingNo: payload.trackingNo });
    writeProcessResult_(matches[0], update);
    appendLogRow_(buildLogRow({
      timestamp: now,
      statusLabel: update.finalStatus,
      iprBarcode: payload.iprBarcode,
      workerName: payload.worker && payload.worker.name,
      vfId: payload.worker && payload.worker.vfId,
      remark: '운송장번호: ' + (payload.trackingNo || '')
    }));
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}
