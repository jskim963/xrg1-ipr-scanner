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

function handleSyncDown(payload) {
  var rows = readUnprocessedSnapshotRows_();
  var items = [];
  for (var i = 0; i < rows.length; i++) {
    var ipr = String(rows[i][COLUMNS.IPR] || '').trim();
    var finalStatus = String(rows[i][COLUMNS.FINAL_STATUS] || '').trim();
    if (ipr === '' || finalStatus !== '') continue;
    var result = buildInquiryResult(rows[i]);
    if (result.reportDate instanceof Date) {
      result.reportDate = Utilities.formatDate(result.reportDate, 'Asia/Seoul', 'yyyy-MM-dd');
    }
    delete result.alreadyProcessed;
    delete result.existingStatus;
    items.push(result);
  }
  return { success: true, items: items };
}

function applySyncItem_(item) {
  var iprColumn = readIprColumnValues_();
  var matches = findMatchingIndexesInColumn(iprColumn, item.iprBarcode);
  if (matches.length !== 1) {
    return { iprBarcode: item.iprBarcode, status: 'not_found' };
  }
  var rowIndex = matches[0];
  var currentRow = readFullRow_(rowIndex);
  var alreadyProcessed = String(currentRow[COLUMNS.FINAL_STATUS] || '').trim() !== '';
  var timestamp = item.offlineTimestamp ? new Date(item.offlineTimestamp) : new Date();

  if (alreadyProcessed) {
    markDuplicateScan_(rowIndex);
    appendLogRow_(buildLogRow({
      timestamp: timestamp,
      statusLabel: '중복스캔',
      iprBarcode: item.iprBarcode,
      workerName: item.worker && item.worker.name,
      vfId: item.worker && item.worker.vfId,
      remark: '오프라인 동기화 중 이미 처리된 건과 중복 - 값 유지되지 않음'
    }));
    return { iprBarcode: item.iprBarcode, status: 'duplicate' };
  }

  var actionType = item.action === 'processDiscard' ? ACTION_TYPE.DISCARD
    : item.action === 'processReturnVendor' ? ACTION_TYPE.RETURN_VENDOR
    : ACTION_TYPE.RETURN_PARCEL;
  var photoUrl = '';
  if (actionType === ACTION_TYPE.DISCARD && item.photoBase64) {
    photoUrl = uploadPhoto_(item.photoBase64, 'discard_' + item.iprBarcode + '_' + timestamp.getTime());
  }
  var update = buildProcessUpdate(actionType, timestamp, { trackingNo: item.trackingNo });
  writeProcessResult_(rowIndex, update);
  appendLogRow_(buildLogRow({
    timestamp: timestamp,
    statusLabel: update.finalStatus,
    iprBarcode: item.iprBarcode,
    workerName: item.worker && item.worker.name,
    vfId: item.worker && item.worker.vfId,
    photoUrl: photoUrl,
    remark: actionType === ACTION_TYPE.RETURN_PARCEL
      ? ('운송장번호: ' + (item.trackingNo || '') + ' (오프라인 동기화)')
      : '(오프라인 동기화)'
  }));
  return { iprBarcode: item.iprBarcode, status: 'applied' };
}

function handleSyncUp(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var items = payload.items || [];
    var results = [];
    for (var i = 0; i < items.length; i++) {
      results.push(applySyncItem_(items[i]));
    }
    return { success: true, results: results };
  } finally {
    lock.releaseLock();
  }
}
